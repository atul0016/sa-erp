/**
 * Shop Floor Control Service (MES - Manufacturing Execution System)
 * 
 * Per The ERP Architect's Handbook:
 * - Job Card management for kiosk interface
 * - Clock-in/Job-on time tracking
 * - Downtime tracking and categorization
 * - OEE (Overall Equipment Effectiveness) calculation
 */

import { v4 as uuidv4 } from 'uuid';
import type { Database } from 'better-sqlite3';

export interface JobCard {
  id: string;
  tenant_id: string;
  job_card_number: string;
  production_order_id: string;
  production_order_number: string;
  operation_id: string;
  work_center_id: string;
  work_center_name: string;
  operation_name: string;
  shift_id?: string;
  job_date: string;
  planned_qty: number;
  completed_qty: number;
  rejected_qty: number;
  rework_qty: number;
  planned_start?: string;
  planned_end?: string;
  actual_start?: string;
  actual_end?: string;
  setup_start?: string;
  setup_end?: string;
  setup_time_minutes: number;
  run_time_minutes: number;
  total_time_minutes: number;
  operators: string[];
  primary_operator_id?: string;
  remarks?: string;
  qc_status?: string;
  qc_remarks?: string;
  status: 'pending' | 'started' | 'paused' | 'completed' | 'cancelled';
}

export interface TimeTrackingEntry {
  id: string;
  tenant_id: string;
  job_card_id: string;
  operator_id: string;
  tracking_type: 'clock_in' | 'clock_out' | 'job_start' | 'job_pause' | 'job_resume' | 'job_end';
  timestamp: string;
  reason?: string;
  remarks?: string;
}

export interface DowntimeRecord {
  id: string;
  tenant_id: string;
  work_center_id: string;
  job_card_id?: string;
  downtime_type: 'planned' | 'unplanned';
  downtime_category: 'breakdown' | 'changeover' | 'material_shortage' | 'operator_absence' | 'power_outage' | 'maintenance' | 'other';
  downtime_code?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  root_cause?: string;
  corrective_action?: string;
  reported_by: string;
  resolved_by?: string;
}

export interface OeeRecord {
  id: string;
  tenant_id: string;
  work_center_id: string;
  record_date: string;
  shift_id?: string;
  planned_production_time: number;
  actual_production_time: number;
  downtime_minutes: number;
  availability_percent: number;
  ideal_cycle_time: number;
  total_count: number;
  performance_percent: number;
  good_count: number;
  reject_count: number;
  rework_count: number;
  quality_percent: number;
  oee_percent: number;
  breakdown_minutes: number;
  changeover_minutes: number;
  speed_loss_units: number;
  remarks?: string;
}

/**
 * Create a job card from production order operation
 */
export function createJobCard(
  db: Database,
  tenantId: string,
  productionOrderId: string,
  operationId: string,
  jobDate: string,
  shiftId?: string
): JobCard {
  // Get production order and operation details
  const operation = db.prepare(`
    SELECT 
      poo.*,
      po.order_number as production_order_number
    FROM production_order_operations poo
    JOIN production_orders po ON poo.production_order_id = po.id
    WHERE poo.id = ? AND po.id = ?
  `).get(operationId, productionOrderId) as any;

  if (!operation) {
    throw new Error('Operation not found');
  }

  const jobCardNumber = `JC-${Date.now()}`;

  const jobCard: JobCard = {
    id: uuidv4(),
    tenant_id: tenantId,
    job_card_number: jobCardNumber,
    production_order_id: productionOrderId,
    production_order_number: operation.production_order_number,
    operation_id: operationId,
    work_center_id: operation.work_center_id,
    work_center_name: operation.work_center_name,
    operation_name: operation.operation_name,
    shift_id: shiftId,
    job_date: jobDate,
    planned_qty: operation.planned_qty - (operation.completed_qty || 0),
    completed_qty: 0,
    rejected_qty: 0,
    rework_qty: 0,
    planned_start: operation.planned_start,
    planned_end: operation.planned_end,
    setup_time_minutes: 0,
    run_time_minutes: 0,
    total_time_minutes: 0,
    operators: [],
    status: 'pending',
  };

  db.prepare(`
    INSERT INTO job_cards (
      id, tenant_id, job_card_number, production_order_id, production_order_number,
      operation_id, work_center_id, work_center_name, operation_name,
      shift_id, job_date, planned_qty, completed_qty, rejected_qty, rework_qty,
      planned_start, planned_end, setup_time_minutes, run_time_minutes, total_time_minutes,
      operators, status
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `).run(
    jobCard.id,
    jobCard.tenant_id,
    jobCard.job_card_number,
    jobCard.production_order_id,
    jobCard.production_order_number,
    jobCard.operation_id,
    jobCard.work_center_id,
    jobCard.work_center_name,
    jobCard.operation_name,
    jobCard.shift_id,
    jobCard.job_date,
    jobCard.planned_qty,
    jobCard.completed_qty,
    jobCard.rejected_qty,
    jobCard.rework_qty,
    jobCard.planned_start,
    jobCard.planned_end,
    jobCard.setup_time_minutes,
    jobCard.run_time_minutes,
    jobCard.total_time_minutes,
    JSON.stringify(jobCard.operators),
    jobCard.status
  );

  return jobCard;
}

/**
 * Start job card (Clock-in/Job-on)
 */
export function startJobCard(
  db: Database,
  tenantId: string,
  jobCardId: string,
  operatorId: string,
  isSetup: boolean = false
): void {
  const now = new Date().toISOString();

  // Check operator exists
  const operator = db.prepare(`
    SELECT * FROM shop_floor_operators WHERE id = ? AND tenant_id = ?
  `).get(operatorId, tenantId);

  if (!operator) {
    throw new Error('Operator not found');
  }

  // Get job card
  const jobCard = db.prepare(`
    SELECT * FROM job_cards WHERE id = ? AND tenant_id = ?
  `).get(jobCardId, tenantId) as JobCard | undefined;

  if (!jobCard) {
    throw new Error('Job card not found');
  }

  if (jobCard.status === 'completed' || jobCard.status === 'cancelled') {
    throw new Error('Job card is already closed');
  }

  // Record time tracking
  const trackingType = jobCard.status === 'paused' ? 'job_resume' : 'job_start';
  recordTimeTracking(db, tenantId, jobCardId, operatorId, trackingType);

  // Update job card
  const updates: any = {
    status: 'started',
    primary_operator_id: operatorId,
  };

  if (isSetup && !jobCard.setup_start) {
    updates.setup_start = now;
  } else if (!jobCard.actual_start) {
    updates.actual_start = now;
  }

  // Add operator to list
  const operators = jobCard.operators ? JSON.parse(jobCard.operators as any) : [];
  if (!operators.includes(operatorId)) {
    operators.push(operatorId);
    updates.operators = JSON.stringify(operators);
  }

  const setClause = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');

  db.prepare(`
    UPDATE job_cards SET ${setClause} WHERE id = ?
  `).run(...Object.values(updates), jobCardId);
}

/**
 * Pause job card
 */
export function pauseJobCard(
  db: Database,
  tenantId: string,
  jobCardId: string,
  operatorId: string,
  reason?: string
): void {
  recordTimeTracking(db, tenantId, jobCardId, operatorId, 'job_pause', reason);

  db.prepare(`
    UPDATE job_cards SET status = 'paused' WHERE id = ? AND tenant_id = ?
  `).run(jobCardId, tenantId);
}

/**
 * Complete setup phase
 */
export function completeSetup(
  db: Database,
  tenantId: string,
  jobCardId: string
): void {
  const now = new Date().toISOString();

  const jobCard = db.prepare(`
    SELECT * FROM job_cards WHERE id = ? AND tenant_id = ?
  `).get(jobCardId, tenantId) as JobCard | undefined;

  if (!jobCard || !jobCard.setup_start) {
    throw new Error('Job card not found or setup not started');
  }

  const setupStart = new Date(jobCard.setup_start);
  const setupEnd = new Date(now);
  const setupMinutes = Math.round((setupEnd.getTime() - setupStart.getTime()) / 60000);

  db.prepare(`
    UPDATE job_cards 
    SET setup_end = ?, setup_time_minutes = ?, actual_start = ?
    WHERE id = ? AND tenant_id = ?
  `).run(now, setupMinutes, now, jobCardId, tenantId);
}

/**
 * Record production output
 */
export function recordOutput(
  db: Database,
  tenantId: string,
  jobCardId: string,
  goodQty: number,
  rejectedQty: number,
  reworkQty: number,
  operatorId: string
): void {
  const jobCard = db.prepare(`
    SELECT * FROM job_cards WHERE id = ? AND tenant_id = ?
  `).get(jobCardId, tenantId) as JobCard | undefined;

  if (!jobCard) {
    throw new Error('Job card not found');
  }

  const newCompleted = (jobCard.completed_qty || 0) + goodQty;
  const newRejected = (jobCard.rejected_qty || 0) + rejectedQty;
  const newRework = (jobCard.rework_qty || 0) + reworkQty;

  db.prepare(`
    UPDATE job_cards 
    SET completed_qty = ?, rejected_qty = ?, rework_qty = ?
    WHERE id = ? AND tenant_id = ?
  `).run(newCompleted, newRejected, newRework, jobCardId, tenantId);

  // Also update production order operation
  db.prepare(`
    UPDATE production_order_operations
    SET 
      completed_qty = completed_qty + ?,
      rejected_qty = rejected_qty + ?
    WHERE id = ?
  `).run(goodQty, rejectedQty, jobCard.operation_id);
}

/**
 * Complete job card
 */
export function completeJobCard(
  db: Database,
  tenantId: string,
  jobCardId: string,
  operatorId: string,
  qcStatus?: string,
  qcRemarks?: string
): void {
  const now = new Date().toISOString();

  recordTimeTracking(db, tenantId, jobCardId, operatorId, 'job_end');

  const jobCard = db.prepare(`
    SELECT * FROM job_cards WHERE id = ? AND tenant_id = ?
  `).get(jobCardId, tenantId) as JobCard | undefined;

  if (!jobCard) {
    throw new Error('Job card not found');
  }

  // Calculate run time
  let runMinutes = 0;
  if (jobCard.actual_start) {
    const start = new Date(jobCard.actual_start);
    const end = new Date(now);
    runMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    
    // Subtract paused time
    const pausedTime = calculatePausedTime(db, jobCardId);
    runMinutes -= pausedTime;
  }

  const totalMinutes = (jobCard.setup_time_minutes || 0) + runMinutes;

  db.prepare(`
    UPDATE job_cards 
    SET 
      actual_end = ?,
      run_time_minutes = ?,
      total_time_minutes = ?,
      qc_status = ?,
      qc_remarks = ?,
      status = 'completed'
    WHERE id = ? AND tenant_id = ?
  `).run(now, runMinutes, totalMinutes, qcStatus, qcRemarks, jobCardId, tenantId);

  // Update production order operation status
  updateOperationStatus(db, jobCard.operation_id);
}

/**
 * Record downtime
 */
export function recordDowntime(
  db: Database,
  tenantId: string,
  workCenterId: string,
  downtimeType: 'planned' | 'unplanned',
  downtimeCategory: DowntimeRecord['downtime_category'],
  startTime: string,
  reportedBy: string,
  jobCardId?: string,
  description?: string
): DowntimeRecord {
  const downtime: DowntimeRecord = {
    id: uuidv4(),
    tenant_id: tenantId,
    work_center_id: workCenterId,
    job_card_id: jobCardId,
    downtime_type: downtimeType,
    downtime_category: downtimeCategory,
    start_time: startTime,
    description,
    reported_by: reportedBy,
  };

  db.prepare(`
    INSERT INTO downtime_records (
      id, tenant_id, work_center_id, job_card_id, downtime_type, downtime_category,
      start_time, description, reported_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    downtime.id,
    downtime.tenant_id,
    downtime.work_center_id,
    downtime.job_card_id,
    downtime.downtime_type,
    downtime.downtime_category,
    downtime.start_time,
    downtime.description,
    downtime.reported_by
  );

  return downtime;
}

/**
 * Resolve downtime
 */
export function resolveDowntime(
  db: Database,
  downtimeId: string,
  endTime: string,
  rootCause?: string,
  correctiveAction?: string,
  resolvedBy?: string
): void {
  const downtime = db.prepare(`
    SELECT * FROM downtime_records WHERE id = ?
  `).get(downtimeId) as DowntimeRecord | undefined;

  if (!downtime) {
    throw new Error('Downtime record not found');
  }

  const start = new Date(downtime.start_time);
  const end = new Date(endTime);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  db.prepare(`
    UPDATE downtime_records
    SET 
      end_time = ?,
      duration_minutes = ?,
      root_cause = ?,
      corrective_action = ?,
      resolved_by = ?
    WHERE id = ?
  `).run(endTime, durationMinutes, rootCause, correctiveAction, resolvedBy, downtimeId);
}

/**
 * Calculate OEE for a work center
 */
export function calculateOee(
  db: Database,
  tenantId: string,
  workCenterId: string,
  recordDate: string,
  shiftId?: string
): OeeRecord {
  // Get work center details
  const workCenter = db.prepare(`
    SELECT * FROM work_centers WHERE id = ?
  `).get(workCenterId) as any;

  if (!workCenter) {
    throw new Error('Work center not found');
  }

  // Get shift details for planned time
  let plannedProductionTime = 480; // Default 8 hours
  if (shiftId) {
    const shift = db.prepare(`
      SELECT * FROM shifts WHERE id = ?
    `).get(shiftId) as any;
    if (shift) {
      plannedProductionTime = shift.working_hours * 60;
    }
  }

  // Get completed job cards for the day
  const jobCards = db.prepare(`
    SELECT * FROM job_cards
    WHERE tenant_id = ? AND work_center_id = ? AND job_date = ?
    ${shiftId ? 'AND shift_id = ?' : ''}
    AND status = 'completed'
  `).all(tenantId, workCenterId, recordDate, ...(shiftId ? [shiftId] : [])) as JobCard[];

  // Calculate totals
  let totalRunTime = 0;
  let totalSetupTime = 0;
  let totalGoodCount = 0;
  let totalRejectCount = 0;
  let totalReworkCount = 0;
  let totalCount = 0;

  for (const jc of jobCards) {
    totalRunTime += jc.run_time_minutes || 0;
    totalSetupTime += jc.setup_time_minutes || 0;
    totalGoodCount += jc.completed_qty || 0;
    totalRejectCount += jc.rejected_qty || 0;
    totalReworkCount += jc.rework_qty || 0;
    totalCount += (jc.completed_qty || 0) + (jc.rejected_qty || 0) + (jc.rework_qty || 0);
  }

  // Get downtime for the day
  const downtimes = db.prepare(`
    SELECT * FROM downtime_records
    WHERE tenant_id = ? AND work_center_id = ?
    AND date(start_time) = ?
    AND duration_minutes IS NOT NULL
  `).all(tenantId, workCenterId, recordDate) as DowntimeRecord[];

  let totalDowntime = 0;
  let breakdownMinutes = 0;
  let changeoverMinutes = 0;

  for (const dt of downtimes) {
    totalDowntime += dt.duration_minutes || 0;
    if (dt.downtime_category === 'breakdown') {
      breakdownMinutes += dt.duration_minutes || 0;
    }
    if (dt.downtime_category === 'changeover') {
      changeoverMinutes += dt.duration_minutes || 0;
    }
  }

  // Calculate metrics
  const actualProductionTime = totalRunTime;
  
  // Availability = Operating Time / Planned Production Time
  const availabilityPercent = plannedProductionTime > 0
    ? Math.round((actualProductionTime / (plannedProductionTime - totalSetupTime)) * 100)
    : 0;

  // Ideal cycle time (use work center's standard or calculate from capacity)
  const idealCycleTime = workCenter.capacity_per_hour 
    ? 60 / workCenter.capacity_per_hour 
    : 1; // minutes per unit

  // Performance = (Ideal Cycle Time × Total Count) / Operating Time
  const performancePercent = actualProductionTime > 0
    ? Math.min(100, Math.round((idealCycleTime * totalCount / actualProductionTime) * 100))
    : 0;

  // Quality = Good Count / Total Count
  const qualityPercent = totalCount > 0
    ? Math.round((totalGoodCount / totalCount) * 100)
    : 100;

  // OEE = Availability × Performance × Quality
  const oeePercent = Math.round(
    (availabilityPercent / 100) * (performancePercent / 100) * (qualityPercent / 100) * 100
  );

  // Speed loss (theoretical count - actual count when running)
  const theoreticalCount = Math.floor(actualProductionTime / idealCycleTime);
  const speedLossUnits = Math.max(0, theoreticalCount - totalCount);

  const oeeRecord: OeeRecord = {
    id: uuidv4(),
    tenant_id: tenantId,
    work_center_id: workCenterId,
    record_date: recordDate,
    shift_id: shiftId,
    planned_production_time: plannedProductionTime,
    actual_production_time: actualProductionTime,
    downtime_minutes: totalDowntime,
    availability_percent: availabilityPercent,
    ideal_cycle_time: idealCycleTime,
    total_count: totalCount,
    performance_percent: performancePercent,
    good_count: totalGoodCount,
    reject_count: totalRejectCount,
    rework_count: totalReworkCount,
    quality_percent: qualityPercent,
    oee_percent: oeePercent,
    breakdown_minutes: breakdownMinutes,
    changeover_minutes: changeoverMinutes,
    speed_loss_units: speedLossUnits,
  };

  // Save OEE record
  db.prepare(`
    INSERT OR REPLACE INTO oee_records (
      id, tenant_id, work_center_id, record_date, shift_id,
      planned_production_time, actual_production_time, downtime_minutes, availability_percent,
      ideal_cycle_time, total_count, performance_percent,
      good_count, reject_count, rework_count, quality_percent,
      oee_percent, breakdown_minutes, changeover_minutes, speed_loss_units
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    oeeRecord.id,
    oeeRecord.tenant_id,
    oeeRecord.work_center_id,
    oeeRecord.record_date,
    oeeRecord.shift_id,
    oeeRecord.planned_production_time,
    oeeRecord.actual_production_time,
    oeeRecord.downtime_minutes,
    oeeRecord.availability_percent,
    oeeRecord.ideal_cycle_time,
    oeeRecord.total_count,
    oeeRecord.performance_percent,
    oeeRecord.good_count,
    oeeRecord.reject_count,
    oeeRecord.rework_count,
    oeeRecord.quality_percent,
    oeeRecord.oee_percent,
    oeeRecord.breakdown_minutes,
    oeeRecord.changeover_minutes,
    oeeRecord.speed_loss_units
  );

  return oeeRecord;
}

/**
 * Get job cards for kiosk display
 */
export function getKioskJobCards(
  db: Database,
  tenantId: string,
  workCenterId: string,
  date?: string
): JobCard[] {
  const targetDate = date || new Date().toISOString().split('T')[0];

  return db.prepare(`
    SELECT * FROM job_cards
    WHERE tenant_id = ? AND work_center_id = ? AND job_date = ?
    AND status IN ('pending', 'started', 'paused')
    ORDER BY 
      CASE status 
        WHEN 'started' THEN 1 
        WHEN 'paused' THEN 2 
        ELSE 3 
      END,
      planned_start
  `).all(tenantId, workCenterId, targetDate) as JobCard[];
}

/**
 * Get operator's active job
 */
export function getOperatorActiveJob(
  db: Database,
  tenantId: string,
  operatorId: string
): JobCard | null {
  return db.prepare(`
    SELECT * FROM job_cards
    WHERE tenant_id = ? 
    AND status = 'started'
    AND (
      primary_operator_id = ?
      OR operators LIKE ?
    )
    ORDER BY actual_start DESC
    LIMIT 1
  `).get(tenantId, operatorId, `%"${operatorId}"%`) as JobCard | null;
}

// Helper functions
function recordTimeTracking(
  db: Database,
  tenantId: string,
  jobCardId: string,
  operatorId: string,
  trackingType: TimeTrackingEntry['tracking_type'],
  reason?: string,
  remarks?: string
): void {
  db.prepare(`
    INSERT INTO time_tracking (
      id, tenant_id, job_card_id, operator_id, tracking_type, timestamp, reason, remarks
    ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?)
  `).run(uuidv4(), tenantId, jobCardId, operatorId, trackingType, reason, remarks);
}

function calculatePausedTime(db: Database, jobCardId: string): number {
  const entries = db.prepare(`
    SELECT * FROM time_tracking
    WHERE job_card_id = ?
    ORDER BY timestamp
  `).all(jobCardId) as TimeTrackingEntry[];

  let pausedTime = 0;
  let pauseStart: Date | null = null;

  for (const entry of entries) {
    if (entry.tracking_type === 'job_pause') {
      pauseStart = new Date(entry.timestamp);
    } else if (entry.tracking_type === 'job_resume' && pauseStart) {
      const resumeTime = new Date(entry.timestamp);
      pausedTime += Math.round((resumeTime.getTime() - pauseStart.getTime()) / 60000);
      pauseStart = null;
    }
  }

  return pausedTime;
}

function updateOperationStatus(db: Database, operationId: string): void {
  const operation = db.prepare(`
    SELECT planned_qty, completed_qty FROM production_order_operations WHERE id = ?
  `).get(operationId) as { planned_qty: number; completed_qty: number } | undefined;

  if (operation) {
    const status = operation.completed_qty >= operation.planned_qty ? 'completed' : 'in_progress';
    db.prepare(`
      UPDATE production_order_operations SET status = ? WHERE id = ?
    `).run(status, operationId);
  }
}

export default {
  createJobCard,
  startJobCard,
  pauseJobCard,
  completeSetup,
  recordOutput,
  completeJobCard,
  recordDowntime,
  resolveDowntime,
  calculateOee,
  getKioskJobCards,
  getOperatorActiveJob,
};

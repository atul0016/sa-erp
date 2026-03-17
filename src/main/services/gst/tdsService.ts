/**
 * TDS Service - Tax Deducted at Source Management
 * 
 * Per The ERP Architect's Handbook:
 * - Auto-deduction based on Section 194C/J/Q
 * - Threshold monitoring (single/annual)
 * - Lower deduction certificate handling
 * - Form 26Q generation
 * - Challan management
 */

import { v4 as uuidv4 } from 'uuid';
import type { Database } from 'better-sqlite3';

export interface TdsSection {
  id: string;
  section_code: string;
  description: string;
  payment_nature: string;
  individual_rate: number;
  company_rate: number;
  threshold_single: number;
  threshold_annual: number;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
}

export interface PartyTdsConfig {
  id: string;
  tenant_id: string;
  party_type: 'vendor' | 'customer';
  party_id: string;
  pan: string;
  deductee_category_id?: string;
  lower_deduction_cert_no?: string;
  lower_deduction_rate?: number;
  lower_deduction_from?: string;
  lower_deduction_to?: string;
  no_deduction_cert_no?: string;
  no_deduction_from?: string;
  no_deduction_to?: string;
  default_section_id?: string;
  is_active: boolean;
}

export interface TdsCalculationResult {
  sectionId: string;
  sectionCode: string;
  baseAmount: number;
  rate: number;
  tdsAmount: number;
  surcharge: number;
  educationCess: number;
  totalTds: number;
  isLowerRate: boolean;
  certificateNumber?: string;
  message?: string;
}

export interface TdsTransaction {
  id: string;
  tenant_id: string;
  transaction_type: 'deduction' | 'payment' | 'reversal';
  reference_type: string;
  reference_id: string;
  reference_number: string;
  transaction_date: string;
  party_type: string;
  party_id: string;
  party_name: string;
  pan: string;
  section_id: string;
  section_code: string;
  base_amount: number;
  tds_rate: number;
  tds_amount: number;
  surcharge: number;
  education_cess: number;
  total_tds: number;
  is_lower_rate: boolean;
  certificate_number?: string;
  payment_status: 'pending' | 'paid';
  challan_id?: string;
  fiscal_year: string;
  quarter: string;
}

// Standard TDS sections as per Income Tax Act
export const TDS_SECTIONS: Omit<TdsSection, 'id'>[] = [
  {
    section_code: '194C',
    description: 'Payment to Contractors',
    payment_nature: 'Contract Payments',
    individual_rate: 1,
    company_rate: 2,
    threshold_single: 30000,
    threshold_annual: 100000,
    effective_from: '2024-04-01',
    is_active: true,
  },
  {
    section_code: '194J',
    description: 'Professional/Technical Services',
    payment_nature: 'Professional Fees',
    individual_rate: 10,
    company_rate: 10,
    threshold_single: 30000,
    threshold_annual: 30000,
    effective_from: '2024-04-01',
    is_active: true,
  },
  {
    section_code: '194Q',
    description: 'Purchase of Goods',
    payment_nature: 'Purchase Payments',
    individual_rate: 0.1,
    company_rate: 0.1,
    threshold_single: 0,
    threshold_annual: 5000000, // 50 Lakhs
    effective_from: '2024-04-01',
    is_active: true,
  },
  {
    section_code: '194A',
    description: 'Interest (other than securities)',
    payment_nature: 'Interest Payment',
    individual_rate: 10,
    company_rate: 10,
    threshold_single: 5000,
    threshold_annual: 40000,
    effective_from: '2024-04-01',
    is_active: true,
  },
  {
    section_code: '194H',
    description: 'Commission/Brokerage',
    payment_nature: 'Commission',
    individual_rate: 5,
    company_rate: 5,
    threshold_single: 15000,
    threshold_annual: 15000,
    effective_from: '2024-04-01',
    is_active: true,
  },
  {
    section_code: '194I(a)',
    description: 'Rent - Plant/Machinery/Equipment',
    payment_nature: 'Rent (P&M)',
    individual_rate: 2,
    company_rate: 2,
    threshold_single: 0,
    threshold_annual: 240000,
    effective_from: '2024-04-01',
    is_active: true,
  },
  {
    section_code: '194I(b)',
    description: 'Rent - Land/Building/Furniture',
    payment_nature: 'Rent (Land/Bldg)',
    individual_rate: 10,
    company_rate: 10,
    threshold_single: 0,
    threshold_annual: 240000,
    effective_from: '2024-04-01',
    is_active: true,
  },
];

/**
 * Initialize TDS master data
 */
export function initializeTdsSections(db: Database): void {
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM tds_sections').get() as { count: number };
  
  if (existingCount.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO tds_sections (
        id, section_code, description, payment_nature,
        individual_rate, company_rate, threshold_single, threshold_annual,
        effective_from, effective_to, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const section of TDS_SECTIONS) {
      stmt.run(
        uuidv4(),
        section.section_code,
        section.description,
        section.payment_nature,
        section.individual_rate,
        section.company_rate,
        section.threshold_single,
        section.threshold_annual,
        section.effective_from,
        section.effective_to || null,
        section.is_active ? 1 : 0
      );
    }
  }

  // Initialize deductee categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM tds_deductee_categories').get() as { count: number };
  
  if (categoryCount.count === 0) {
    const categories = [
      { code: 'IND', description: 'Individual/HUF', rate_factor: 1.0 },
      { code: 'COM', description: 'Domestic Company', rate_factor: 1.0 },
      { code: 'FRM', description: 'Firm', rate_factor: 1.0 },
      { code: 'AOP', description: 'AOP/BOI', rate_factor: 1.0 },
      { code: 'NRI', description: 'Non-Resident Individual', rate_factor: 1.0 },
      { code: 'FGN', description: 'Foreign Company', rate_factor: 1.0 },
      { code: 'NOP', description: 'No PAN/Invalid PAN', rate_factor: 2.0 }, // 20% minimum
    ];

    const catStmt = db.prepare(`
      INSERT INTO tds_deductee_categories (id, code, description, rate_factor)
      VALUES (?, ?, ?, ?)
    `);

    for (const cat of categories) {
      catStmt.run(uuidv4(), cat.code, cat.description, cat.rate_factor);
    }
  }
}

/**
 * Get active TDS sections
 */
export function getTdsSections(db: Database): TdsSection[] {
  return db.prepare(`
    SELECT * FROM tds_sections 
    WHERE is_active = 1 
    AND (effective_to IS NULL OR effective_to >= date('now'))
    ORDER BY section_code
  `).all() as TdsSection[];
}

/**
 * Get party TDS configuration
 */
export function getPartyTdsConfig(
  db: Database,
  tenantId: string,
  partyType: 'vendor' | 'customer',
  partyId: string
): PartyTdsConfig | null {
  return db.prepare(`
    SELECT * FROM party_tds_config
    WHERE tenant_id = ? AND party_type = ? AND party_id = ? AND is_active = 1
  `).get(tenantId, partyType, partyId) as PartyTdsConfig | null;
}

/**
 * Get annual payments to a party for threshold checking
 */
export function getAnnualPayments(
  db: Database,
  tenantId: string,
  partyId: string,
  sectionId: string,
  fiscalYear: string
): number {
  const result = db.prepare(`
    SELECT COALESCE(SUM(base_amount), 0) as total
    FROM tds_transactions
    WHERE tenant_id = ? 
    AND party_id = ?
    AND section_id = ?
    AND fiscal_year = ?
    AND transaction_type = 'deduction'
  `).get(tenantId, partyId, sectionId, fiscalYear) as { total: number };

  return result.total;
}

/**
 * Calculate TDS for a transaction
 */
export function calculateTds(
  db: Database,
  tenantId: string,
  partyType: 'vendor' | 'customer',
  partyId: string,
  partyPan: string,
  sectionCode: string,
  amount: number,
  transactionDate: string
): TdsCalculationResult | null {
  // Get section details
  const section = db.prepare(`
    SELECT * FROM tds_sections
    WHERE section_code = ? AND is_active = 1
    AND effective_from <= ?
    AND (effective_to IS NULL OR effective_to >= ?)
  `).get(sectionCode, transactionDate, transactionDate) as TdsSection | undefined;

  if (!section) {
    return null;
  }

  // Get party configuration
  const partyConfig = getPartyTdsConfig(db, tenantId, partyType, partyId);

  // Check if no deduction certificate is applicable
  if (partyConfig?.no_deduction_cert_no) {
    const certFrom = partyConfig.no_deduction_from;
    const certTo = partyConfig.no_deduction_to;
    if (certFrom && certTo && transactionDate >= certFrom && transactionDate <= certTo) {
      return {
        sectionId: section.id,
        sectionCode: section.section_code,
        baseAmount: amount,
        rate: 0,
        tdsAmount: 0,
        surcharge: 0,
        educationCess: 0,
        totalTds: 0,
        isLowerRate: false,
        certificateNumber: partyConfig.no_deduction_cert_no,
        message: 'No deduction certificate applicable',
      };
    }
  }

  // Check single transaction threshold
  if (section.threshold_single > 0 && amount < section.threshold_single) {
    return {
      sectionId: section.id,
      sectionCode: section.section_code,
      baseAmount: amount,
      rate: 0,
      tdsAmount: 0,
      surcharge: 0,
      educationCess: 0,
      totalTds: 0,
      isLowerRate: false,
      message: `Amount below single transaction threshold (₹${section.threshold_single})`,
    };
  }

  // Get fiscal year
  const fiscalYear = getFiscalYear(transactionDate);

  // Check annual threshold
  if (section.threshold_annual > 0) {
    const annualPayments = getAnnualPayments(db, tenantId, partyId, section.id, fiscalYear);
    if (annualPayments + amount < section.threshold_annual) {
      return {
        sectionId: section.id,
        sectionCode: section.section_code,
        baseAmount: amount,
        rate: 0,
        tdsAmount: 0,
        surcharge: 0,
        educationCess: 0,
        totalTds: 0,
        isLowerRate: false,
        message: `Cumulative amount below annual threshold (₹${section.threshold_annual})`,
      };
    }
  }

  // Determine rate
  let rate: number;
  let isLowerRate = false;
  let certificateNumber: string | undefined;

  // Check lower deduction certificate
  if (partyConfig?.lower_deduction_rate !== undefined && partyConfig.lower_deduction_cert_no) {
    const certFrom = partyConfig.lower_deduction_from;
    const certTo = partyConfig.lower_deduction_to;
    if (certFrom && certTo && transactionDate >= certFrom && transactionDate <= certTo) {
      rate = partyConfig.lower_deduction_rate;
      isLowerRate = true;
      certificateNumber = partyConfig.lower_deduction_cert_no;
    } else {
      // Use standard rate
      rate = partyType === 'vendor' ? section.individual_rate : section.company_rate;
    }
  } else {
    // Get deductee category for rate determination
    const deducteeCategory = partyConfig?.deductee_category_id
      ? db.prepare('SELECT * FROM tds_deductee_categories WHERE id = ?').get(partyConfig.deductee_category_id) as { rate_factor: number } | undefined
      : undefined;

    // Check PAN validity - 20% minimum if no valid PAN
    const isPanValid = partyPan && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(partyPan);
    
    if (!isPanValid) {
      rate = 20; // Section 206AA - Higher rate for no PAN
    } else {
      // Use individual or company rate based on PAN type (4th character: P=Individual, C=Company, F=Firm)
      const panType = partyPan.charAt(3);
      rate = panType === 'C' ? section.company_rate : section.individual_rate;
      
      // Apply rate factor if applicable
      if (deducteeCategory?.rate_factor) {
        rate *= deducteeCategory.rate_factor;
      }
    }
  }

  // Calculate TDS
  const tdsAmount = Math.round(amount * rate / 100);
  
  // Calculate surcharge (if applicable - for amounts > 1 Cr)
  const surcharge = amount >= 10000000 ? Math.round(tdsAmount * 0.15) : 0; // 15% surcharge
  
  // Calculate Education Cess (4% on TDS + Surcharge)
  const educationCess = Math.round((tdsAmount + surcharge) * 0.04);

  return {
    sectionId: section.id,
    sectionCode: section.section_code,
    baseAmount: amount,
    rate,
    tdsAmount,
    surcharge,
    educationCess,
    totalTds: tdsAmount + surcharge + educationCess,
    isLowerRate,
    certificateNumber,
  };
}

/**
 * Record TDS deduction
 */
export function recordTdsDeduction(
  db: Database,
  tenantId: string,
  referenceType: string,
  referenceId: string,
  referenceNumber: string,
  transactionDate: string,
  partyType: string,
  partyId: string,
  partyName: string,
  pan: string,
  calculation: TdsCalculationResult
): TdsTransaction {
  const fiscalYear = getFiscalYear(transactionDate);
  const quarter = getQuarter(transactionDate);

  const transaction: TdsTransaction = {
    id: uuidv4(),
    tenant_id: tenantId,
    transaction_type: 'deduction',
    reference_type: referenceType,
    reference_id: referenceId,
    reference_number: referenceNumber,
    transaction_date: transactionDate,
    party_type: partyType,
    party_id: partyId,
    party_name: partyName,
    pan,
    section_id: calculation.sectionId,
    section_code: calculation.sectionCode,
    base_amount: calculation.baseAmount,
    tds_rate: calculation.rate,
    tds_amount: calculation.tdsAmount,
    surcharge: calculation.surcharge,
    education_cess: calculation.educationCess,
    total_tds: calculation.totalTds,
    is_lower_rate: calculation.isLowerRate,
    certificate_number: calculation.certificateNumber,
    payment_status: 'pending',
    fiscal_year: fiscalYear,
    quarter,
  };

  db.prepare(`
    INSERT INTO tds_transactions (
      id, tenant_id, transaction_type, reference_type, reference_id, reference_number,
      transaction_date, party_type, party_id, party_name, pan,
      section_id, section_code, base_amount, tds_rate, tds_amount,
      surcharge, education_cess, total_tds, is_lower_rate, certificate_number,
      payment_status, fiscal_year, quarter
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `).run(
    transaction.id,
    transaction.tenant_id,
    transaction.transaction_type,
    transaction.reference_type,
    transaction.reference_id,
    transaction.reference_number,
    transaction.transaction_date,
    transaction.party_type,
    transaction.party_id,
    transaction.party_name,
    transaction.pan,
    transaction.section_id,
    transaction.section_code,
    transaction.base_amount,
    transaction.tds_rate,
    transaction.tds_amount,
    transaction.surcharge,
    transaction.education_cess,
    transaction.total_tds,
    transaction.is_lower_rate ? 1 : 0,
    transaction.certificate_number,
    transaction.payment_status,
    transaction.fiscal_year,
    transaction.quarter
  );

  return transaction;
}

/**
 * Generate TDS Challan
 */
export function generateTdsChallan(
  db: Database,
  tenantId: string,
  sectionCode: string,
  assessmentYear: string,
  quarter: string,
  transactionIds: string[],
  bankDetails: { bankName: string; bsrCode: string; paymentMode: string }
): { challanId: string; challanNumber: string } {
  // Get transactions
  const placeholders = transactionIds.map(() => '?').join(',');
  const transactions = db.prepare(`
    SELECT * FROM tds_transactions
    WHERE id IN (${placeholders})
  `).all(...transactionIds) as TdsTransaction[];

  const challanNumber = `TDS/${quarter}/${Date.now()}`;
  const totalTds = transactions.reduce((sum, t) => sum + t.tds_amount, 0);
  const totalSurcharge = transactions.reduce((sum, t) => sum + t.surcharge, 0);
  const totalCess = transactions.reduce((sum, t) => sum + t.education_cess, 0);

  const challanId = uuidv4();

  db.prepare(`
    INSERT INTO tds_challans (
      id, tenant_id, challan_number, challan_date, section_code,
      assessment_year, quarter, deductee_count, total_tds_amount,
      surcharge_amount, cess_amount, interest_amount, fee_amount, total_amount,
      bank_name, bsr_code, payment_mode, status
    ) VALUES (
      ?, ?, ?, date('now'), ?,
      ?, ?, ?, ?,
      ?, ?, 0, 0, ?,
      ?, ?, ?, 'pending'
    )
  `).run(
    challanId,
    tenantId,
    challanNumber,
    sectionCode,
    assessmentYear,
    quarter,
    transactions.length,
    totalTds,
    totalSurcharge,
    totalCess,
    totalTds + totalSurcharge + totalCess,
    bankDetails.bankName,
    bankDetails.bsrCode,
    bankDetails.paymentMode
  );

  // Update transactions with challan ID
  db.prepare(`
    UPDATE tds_transactions SET challan_id = ? WHERE id IN (${placeholders})
  `).run(challanId, ...transactionIds);

  return { challanId, challanNumber };
}

/**
 * Generate Form 26Q data
 */
export function generateForm26Q(
  db: Database,
  tenantId: string,
  assessmentYear: string,
  quarter: string
): void {
  // Get tenant details for deductor info
  const tenant = db.prepare(`
    SELECT * FROM tenants WHERE id = (
      SELECT tenant_id FROM users WHERE tenant_id = ? LIMIT 1
    )
  `).get(tenantId) as any;

  // Get all transactions for the quarter
  const transactions = db.prepare(`
    SELECT t.*, c.challan_number, c.payment_date, c.acknowledgement_number
    FROM tds_transactions t
    LEFT JOIN tds_challans c ON t.challan_id = c.id
    WHERE t.tenant_id = ? AND t.fiscal_year = ? AND t.quarter = ?
    AND t.transaction_type = 'deduction'
    ORDER BY t.transaction_date
  `).all(tenantId, assessmentYear, quarter) as any[];

  const form26QId = uuidv4();

  db.prepare(`
    INSERT INTO tds_form_26q (
      id, tenant_id, assessment_year, quarter, form_type,
      tan, deductor_name, deductor_address, deductor_state, deductor_pincode,
      responsible_person_name, responsible_person_designation,
      total_deductees, total_amount_paid, total_tds_deducted, total_tds_deposited,
      status, deductee_details
    ) VALUES (
      ?, ?, ?, ?, '26Q',
      ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      'draft', ?
    )
  `).run(
    form26QId,
    tenantId,
    assessmentYear,
    quarter,
    tenant?.tan || '',
    tenant?.name || '',
    tenant?.address_line1 || '',
    tenant?.state || '',
    tenant?.pincode || '',
    '', // responsible_person_name - to be filled
    '', // responsible_person_designation - to be filled
    new Set(transactions.map(t => t.pan)).size, // unique deductees
    transactions.reduce((sum, t) => sum + t.base_amount, 0),
    transactions.reduce((sum, t) => sum + t.total_tds, 0),
    transactions.filter(t => t.payment_date).reduce((sum, t) => sum + t.total_tds, 0),
    JSON.stringify(transactions)
  );
}

// Helper functions
function getFiscalYear(date: string): string {
  const d = new Date(date);
  const month = d.getMonth();
  const year = d.getFullYear();
  
  // Indian fiscal year: April to March
  if (month >= 3) { // April onwards
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

function getQuarter(date: string): string {
  const d = new Date(date);
  const month = d.getMonth();
  
  // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
  if (month >= 3 && month <= 5) return 'Q1';
  if (month >= 6 && month <= 8) return 'Q2';
  if (month >= 9 && month <= 11) return 'Q3';
  return 'Q4';
}

export default {
  initializeTdsSections,
  getTdsSections,
  getPartyTdsConfig,
  calculateTds,
  recordTdsDeduction,
  generateTdsChallan,
  generateForm26Q,
  getTdsTransactions,
  getTdsSummary,
};

/**
 * Get TDS transactions for a tenant
 */
export function getTdsTransactions(
  db: Database,
  tenantId: string,
  filters?: { quarter?: string; status?: string; sectionCode?: string }
): TdsTransaction[] {
  let query = `
    SELECT * FROM tds_transactions
    WHERE tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (filters?.quarter) {
    query += ' AND quarter = ?';
    params.push(filters.quarter);
  }
  if (filters?.status) {
    query += ' AND payment_status = ?';
    params.push(filters.status);
  }
  if (filters?.sectionCode) {
    query += ' AND section_code = ?';
    params.push(filters.sectionCode);
  }

  query += ' ORDER BY transaction_date DESC';

  return db.prepare(query).all(...params) as TdsTransaction[];
}

/**
 * Get TDS summary for a quarter
 */
export function getTdsSummary(
  db: Database,
  tenantId: string,
  quarter?: string
): {
  total_deducted: number;
  total_deposited: number;
  pending_deposit: number;
  pending_filing: number;
} {
  let query = `
    SELECT 
      COALESCE(SUM(total_tds), 0) as total_deducted,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_tds ELSE 0 END), 0) as total_deposited
    FROM tds_transactions
    WHERE tenant_id = ? AND transaction_type = 'deduction'
  `;
  const params: any[] = [tenantId];

  if (quarter) {
    query += ' AND quarter = ?';
    params.push(quarter);
  }

  const result = db.prepare(query).get(...params) as {
    total_deducted: number;
    total_deposited: number;
  };

  return {
    total_deducted: result.total_deducted,
    total_deposited: result.total_deposited,
    pending_deposit: result.total_deducted - result.total_deposited,
    pending_filing: result.total_deducted, // Simplified - should check filing status
  };
}

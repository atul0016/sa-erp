/**
 * Shop Floor Kiosk - MES Interface
 * 
 * Touch-friendly interface for shop floor operators
 * Per The ERP Architect's Handbook specifications
 */

import { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  WrenchIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserCircleIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';

interface JobCard {
  id: string;
  job_card_number: string;
  production_order_number: string;
  work_center_name: string;
  operation_name: string;
  planned_qty: number;
  completed_qty: number;
  rejected_qty: number;
  status: 'pending' | 'started' | 'paused' | 'completed';
  planned_start: string;
  actual_start?: string;
}

interface WorkCenter {
  id: string;
  code: string;
  name: string;
}

interface Operator {
  id: string;
  operator_code: string;
  operator_name: string;
}

export default function ShopFloorKiosk() {
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<string>('');
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [activeOperator, setActiveOperator] = useState<Operator | null>(null);
  const [showOperatorLogin, setShowOperatorLogin] = useState(true);
  const [operatorCode, setOperatorCode] = useState('');
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [showDowntimeModal, setShowDowntimeModal] = useState(false);
  const [outputData, setOutputData] = useState({ good: 0, rejected: 0, rework: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for demo
  useEffect(() => {
    setWorkCenters([
      { id: '1', code: 'WC-CNC-01', name: 'CNC Machine 1' },
      { id: '2', code: 'WC-CNC-02', name: 'CNC Machine 2' },
      { id: '3', code: 'WC-LATHE-01', name: 'Lathe Machine 1' },
      { id: '4', code: 'WC-MILL-01', name: 'Milling Machine 1' },
    ]);
  }, []);

  useEffect(() => {
    if (selectedWorkCenter) {
      // Load job cards for work center
      setJobCards([
        {
          id: '1',
          job_card_number: 'JC-2024-001',
          production_order_number: 'PO-2024-0125',
          work_center_name: 'CNC Machine 1',
          operation_name: 'Rough Machining',
          planned_qty: 100,
          completed_qty: 45,
          rejected_qty: 2,
          status: 'started',
          planned_start: '2024-01-15T08:00:00',
          actual_start: '2024-01-15T08:15:00',
        },
        {
          id: '2',
          job_card_number: 'JC-2024-002',
          production_order_number: 'PO-2024-0126',
          work_center_name: 'CNC Machine 1',
          operation_name: 'Finish Machining',
          planned_qty: 50,
          completed_qty: 0,
          rejected_qty: 0,
          status: 'pending',
          planned_start: '2024-01-15T14:00:00',
        },
        {
          id: '3',
          job_card_number: 'JC-2024-003',
          production_order_number: 'PO-2024-0127',
          work_center_name: 'CNC Machine 1',
          operation_name: 'Threading',
          planned_qty: 200,
          completed_qty: 0,
          rejected_qty: 0,
          status: 'pending',
          planned_start: '2024-01-16T08:00:00',
        },
      ]);
    }
  }, [selectedWorkCenter]);

  const handleOperatorLogin = () => {
    if (operatorCode.trim()) {
      setActiveOperator({
        id: '1',
        operator_code: operatorCode,
        operator_name: 'Operator Name',
      });
      setShowOperatorLogin(false);
    }
  };

  const handleStartJob = (job: JobCard) => {
    setSelectedJob({ ...job, status: 'started', actual_start: new Date().toISOString() });
    setJobCards(cards => 
      cards.map(c => c.id === job.id ? { ...c, status: 'started' as const, actual_start: new Date().toISOString() } : c)
    );
  };

  const handlePauseJob = () => {
    if (selectedJob) {
      setSelectedJob({ ...selectedJob, status: 'paused' });
      setJobCards(cards =>
        cards.map(c => c.id === selectedJob.id ? { ...c, status: 'paused' as const } : c)
      );
    }
  };

  const handleResumeJob = () => {
    if (selectedJob) {
      setSelectedJob({ ...selectedJob, status: 'started' });
      setJobCards(cards =>
        cards.map(c => c.id === selectedJob.id ? { ...c, status: 'started' as const } : c)
      );
    }
  };

  const handleRecordOutput = () => {
    if (selectedJob) {
      setSelectedJob({
        ...selectedJob,
        completed_qty: selectedJob.completed_qty + outputData.good,
        rejected_qty: selectedJob.rejected_qty + outputData.rejected,
      });
      setJobCards(cards =>
        cards.map(c => c.id === selectedJob.id ? {
          ...c,
          completed_qty: c.completed_qty + outputData.good,
          rejected_qty: c.rejected_qty + outputData.rejected,
        } : c)
      );
      setOutputData({ good: 0, rejected: 0, rework: 0 });
      setShowOutputModal(false);
    }
  };

  const handleCompleteJob = () => {
    if (selectedJob) {
      setJobCards(cards =>
        cards.map(c => c.id === selectedJob.id ? { ...c, status: 'completed' as const } : c)
      );
      setSelectedJob(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getProgress = (job: JobCard) => {
    return Math.round((job.completed_qty / job.planned_qty) * 100);
  };

  // Operator Login Screen
  if (showOperatorLogin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <UserCircleIcon className="h-24 w-24 mx-auto text-blue-500" />
            <h1 className="text-3xl font-bold text-white mt-4">Shop Floor Login</h1>
            <p className="text-gray-400 mt-2">Enter your operator code to continue</p>
          </div>
          
          <input
            type="text"
            placeholder="Operator Code"
            value={operatorCode}
            onChange={(e) => setOperatorCode(e.target.value.toUpperCase())}
            className="w-full text-center text-3xl font-mono bg-gray-700 text-white rounded-xl p-6 mb-6
                       focus:ring-4 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
          
          <button
            onClick={handleOperatorLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-2xl font-semibold 
                       rounded-xl p-6 transition-colors"
          >
            Login
          </button>

          <div className="mt-8 text-center text-gray-500">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  }

  // Work Center Selection
  if (!selectedWorkCenter) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Select Work Center</h1>
            <p className="text-gray-400">Operator: {activeOperator?.operator_name}</p>
          </div>
          <div className="text-2xl font-mono text-white">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {workCenters.map(wc => (
            <button
              key={wc.id}
              onClick={() => setSelectedWorkCenter(wc.id)}
              className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-8 text-center
                         transition-all hover:scale-105 hover:shadow-xl"
            >
              <WrenchIcon className="h-16 w-16 mx-auto text-blue-500 mb-4" />
              <div className="text-xl font-bold text-white">{wc.code}</div>
              <div className="text-gray-400">{wc.name}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setShowOperatorLogin(true);
            setActiveOperator(null);
          }}
          className="mt-8 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left Panel - Job Queue */}
      <div className="w-1/3 bg-gray-800 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <QueueListIcon className="h-6 w-6 mr-2" />
            Job Queue
          </h2>
          <button
            onClick={() => setSelectedWorkCenter('')}
            className="text-gray-400 hover:text-white"
          >
            Change WC
          </button>
        </div>

        <div className="space-y-3">
          {jobCards.map(job => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className={`w-full text-left rounded-xl p-4 transition-all
                ${selectedJob?.id === job.id 
                  ? 'bg-blue-600 ring-2 ring-blue-400' 
                  : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-sm text-gray-300">{job.job_card_number}</span>
                <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(job.status)}`}>
                  {job.status.toUpperCase()}
                </span>
              </div>
              <div className="text-lg font-semibold text-white mb-1">{job.operation_name}</div>
              <div className="text-sm text-gray-400 mb-2">PO: {job.production_order_number}</div>
              
              {/* Progress bar */}
              <div className="bg-gray-600 rounded-full h-2 mb-1">
                <div 
                  className="bg-green-500 rounded-full h-2 transition-all"
                  style={{ width: `${getProgress(job)}%` }}
                />
              </div>
              <div className="text-sm text-gray-400">
                {job.completed_qty} / {job.planned_qty} ({getProgress(job)}%)
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - Active Job */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {workCenters.find(w => w.id === selectedWorkCenter)?.name}
            </h1>
            <p className="text-gray-400">Operator: {activeOperator?.operator_name}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono text-white">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-gray-400">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
        </div>

        {selectedJob ? (
          <div className="bg-gray-800 rounded-2xl p-6">
            {/* Job Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-sm text-gray-400 font-mono">{selectedJob.job_card_number}</div>
                <h2 className="text-3xl font-bold text-white">{selectedJob.operation_name}</h2>
                <div className="text-lg text-gray-400">PO: {selectedJob.production_order_number}</div>
              </div>
              <span className={`px-4 py-2 rounded-full text-lg text-white ${getStatusColor(selectedJob.status)}`}>
                {selectedJob.status.toUpperCase()}
              </span>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-white mb-2">
                <span className="text-lg">Progress</span>
                <span className="text-2xl font-bold">{getProgress(selectedJob)}%</span>
              </div>
              <div className="bg-gray-700 rounded-full h-6">
                <div 
                  className="bg-green-500 rounded-full h-6 transition-all flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(getProgress(selectedJob), 10)}%` }}
                >
                  <span className="text-sm font-bold text-white">{selectedJob.completed_qty}</span>
                </div>
              </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-700 rounded-xl p-4 text-center">
                <div className="text-gray-400 mb-1">Target</div>
                <div className="text-4xl font-bold text-white">{selectedJob.planned_qty}</div>
              </div>
              <div className="bg-green-900/50 rounded-xl p-4 text-center">
                <div className="text-green-400 mb-1">Good</div>
                <div className="text-4xl font-bold text-green-400">{selectedJob.completed_qty}</div>
              </div>
              <div className="bg-red-900/50 rounded-xl p-4 text-center">
                <div className="text-red-400 mb-1">Rejected</div>
                <div className="text-4xl font-bold text-red-400">{selectedJob.rejected_qty}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedJob.status === 'pending' && (
                <button
                  onClick={() => handleStartJob(selectedJob)}
                  className="col-span-2 lg:col-span-4 bg-green-600 hover:bg-green-700 text-white 
                             rounded-xl p-6 flex items-center justify-center text-xl font-semibold
                             transition-colors"
                >
                  <PlayIcon className="h-8 w-8 mr-3" />
                  START JOB
                </button>
              )}

              {selectedJob.status === 'started' && (
                <>
                  <button
                    onClick={handlePauseJob}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl p-6 
                               flex flex-col items-center justify-center transition-colors"
                  >
                    <PauseIcon className="h-10 w-10 mb-2" />
                    <span className="font-semibold">PAUSE</span>
                  </button>
                  <button
                    onClick={() => setShowOutputModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 
                               flex flex-col items-center justify-center transition-colors"
                  >
                    <CheckCircleIcon className="h-10 w-10 mb-2" />
                    <span className="font-semibold">OUTPUT</span>
                  </button>
                  <button
                    onClick={() => setShowDowntimeModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl p-6 
                               flex flex-col items-center justify-center transition-colors"
                  >
                    <ExclamationTriangleIcon className="h-10 w-10 mb-2" />
                    <span className="font-semibold">DOWNTIME</span>
                  </button>
                  <button
                    onClick={handleCompleteJob}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-6 
                               flex flex-col items-center justify-center transition-colors"
                  >
                    <StopIcon className="h-10 w-10 mb-2" />
                    <span className="font-semibold">COMPLETE</span>
                  </button>
                </>
              )}

              {selectedJob.status === 'paused' && (
                <>
                  <button
                    onClick={handleResumeJob}
                    className="col-span-2 bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 
                               flex items-center justify-center text-xl font-semibold transition-colors"
                  >
                    <PlayIcon className="h-8 w-8 mr-3" />
                    RESUME
                  </button>
                  <button
                    onClick={() => setShowDowntimeModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl p-6 
                               flex flex-col items-center justify-center transition-colors"
                  >
                    <ExclamationTriangleIcon className="h-10 w-10 mb-2" />
                    <span className="font-semibold">DOWNTIME</span>
                  </button>
                  <button
                    onClick={handleCompleteJob}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-6 
                               flex flex-col items-center justify-center transition-colors"
                  >
                    <StopIcon className="h-10 w-10 mb-2" />
                    <span className="font-semibold">COMPLETE</span>
                  </button>
                </>
              )}
            </div>

            {/* Timer */}
            {selectedJob.actual_start && selectedJob.status !== 'completed' && (
              <div className="mt-6 bg-gray-700 rounded-xl p-4 flex items-center justify-center">
                <ClockIcon className="h-8 w-8 text-gray-400 mr-3" />
                <span className="text-2xl font-mono text-white">
                  Elapsed: {formatElapsedTime(new Date(selectedJob.actual_start), currentTime)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center h-96">
            <QueueListIcon className="h-24 w-24 text-gray-600 mb-4" />
            <p className="text-xl text-gray-400">Select a job from the queue to begin</p>
          </div>
        )}
      </div>

      {/* Output Modal */}
      {showOutputModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-white mb-6">Record Output</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-400 mb-2">Good Quantity</label>
                <input
                  type="number"
                  value={outputData.good}
                  onChange={(e) => setOutputData({ ...outputData, good: parseInt(e.target.value) || 0 })}
                  className="w-full text-3xl text-center bg-gray-700 text-green-400 rounded-xl p-4
                             focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Rejected Quantity</label>
                <input
                  type="number"
                  value={outputData.rejected}
                  onChange={(e) => setOutputData({ ...outputData, rejected: parseInt(e.target.value) || 0 })}
                  className="w-full text-3xl text-center bg-gray-700 text-red-400 rounded-xl p-4
                             focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Rework Quantity</label>
                <input
                  type="number"
                  value={outputData.rework}
                  onChange={(e) => setOutputData({ ...outputData, rework: parseInt(e.target.value) || 0 })}
                  className="w-full text-3xl text-center bg-gray-700 text-yellow-400 rounded-xl p-4
                             focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowOutputModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl p-4 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordOutput}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 font-semibold"
              >
                Save Output
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downtime Modal */}
      {showDowntimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-white mb-6">Record Downtime</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { code: 'breakdown', label: 'Machine Breakdown', color: 'red' },
                { code: 'changeover', label: 'Changeover', color: 'yellow' },
                { code: 'material_shortage', label: 'Material Shortage', color: 'orange' },
                { code: 'maintenance', label: 'Maintenance', color: 'blue' },
                { code: 'power_outage', label: 'Power Outage', color: 'purple' },
                { code: 'other', label: 'Other', color: 'gray' },
              ].map(reason => (
                <button
                  key={reason.code}
                  onClick={() => {
                    // Record downtime
                    setShowDowntimeModal(false);
                  }}
                  className={`bg-${reason.color}-600 hover:bg-${reason.color}-700 text-white 
                             rounded-xl p-6 font-semibold transition-colors`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDowntimeModal(false)}
              className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white rounded-xl p-4 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatElapsedTime(start: Date, now: Date): string {
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

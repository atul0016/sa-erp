/**
 * OEE Dashboard - Overall Equipment Effectiveness
 * 
 * Real-time OEE monitoring per The ERP Architect's Handbook
 * OEE = Availability × Performance × Quality
 */

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface OEEData {
  id: string;
  work_center_code: string;
  work_center_name: string;
  date: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  planned_production_time: number;
  actual_production_time: number;
  downtime_minutes: number;
  ideal_cycle_time: number;
  actual_cycle_time: number;
  total_produced: number;
  good_produced: number;
  defects: number;
}

interface DowntimeBreakdown {
  reason: string;
  minutes: number;
  percentage: number;
  color: string;
}

export default function OEEDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<string>('all');
  const [oeeData, setOeeData] = useState<OEEData[]>([]);
  const [overallOEE, setOverallOEE] = useState({
    availability: 0,
    performance: 0,
    quality: 0,
    oee: 0,
  });
  const [downtimeBreakdown, setDowntimeBreakdown] = useState<DowntimeBreakdown[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; oee: number }[]>([]);

  // Mock data for demo
  useEffect(() => {
    // Set mock OEE data
    setOeeData([
      {
        id: '1',
        work_center_code: 'WC-CNC-01',
        work_center_name: 'CNC Machine 1',
        date: '2024-01-15',
        availability: 92.5,
        performance: 88.3,
        quality: 97.8,
        oee: 79.9,
        planned_production_time: 480,
        actual_production_time: 444,
        downtime_minutes: 36,
        ideal_cycle_time: 2.5,
        actual_cycle_time: 2.83,
        total_produced: 157,
        good_produced: 154,
        defects: 3,
      },
      {
        id: '2',
        work_center_code: 'WC-CNC-02',
        work_center_name: 'CNC Machine 2',
        date: '2024-01-15',
        availability: 88.2,
        performance: 91.5,
        quality: 95.2,
        oee: 76.8,
        planned_production_time: 480,
        actual_production_time: 423,
        downtime_minutes: 57,
        ideal_cycle_time: 3.0,
        actual_cycle_time: 3.28,
        total_produced: 129,
        good_produced: 123,
        defects: 6,
      },
      {
        id: '3',
        work_center_code: 'WC-LATHE-01',
        work_center_name: 'Lathe Machine 1',
        date: '2024-01-15',
        availability: 95.8,
        performance: 84.2,
        quality: 98.9,
        oee: 79.8,
        planned_production_time: 480,
        actual_production_time: 460,
        downtime_minutes: 20,
        ideal_cycle_time: 1.8,
        actual_cycle_time: 2.14,
        total_produced: 215,
        good_produced: 213,
        defects: 2,
      },
      {
        id: '4',
        work_center_code: 'WC-MILL-01',
        work_center_name: 'Milling Machine 1',
        date: '2024-01-15',
        availability: 78.5,
        performance: 92.1,
        quality: 96.5,
        oee: 69.8,
        planned_production_time: 480,
        actual_production_time: 377,
        downtime_minutes: 103,
        ideal_cycle_time: 4.0,
        actual_cycle_time: 4.34,
        total_produced: 87,
        good_produced: 84,
        defects: 3,
      },
    ]);

    // Calculate overall OEE
    setOverallOEE({
      availability: 88.8,
      performance: 89.0,
      quality: 97.1,
      oee: 76.8,
    });

    // Downtime breakdown
    setDowntimeBreakdown([
      { reason: 'Machine Breakdown', minutes: 85, percentage: 39.4, color: 'bg-red-500' },
      { reason: 'Changeover', minutes: 62, percentage: 28.7, color: 'bg-yellow-500' },
      { reason: 'Material Shortage', minutes: 35, percentage: 16.2, color: 'bg-orange-500' },
      { reason: 'Planned Maintenance', minutes: 25, percentage: 11.6, color: 'bg-blue-500' },
      { reason: 'Other', minutes: 9, percentage: 4.1, color: 'bg-gray-500' },
    ]);

    // Trend data (last 7 days)
    setTrendData([
      { date: '01/09', oee: 72.5 },
      { date: '01/10', oee: 75.8 },
      { date: '01/11', oee: 71.2 },
      { date: '01/12', oee: 78.4 },
      { date: '01/13', oee: 80.1 },
      { date: '01/14', oee: 74.9 },
      { date: '01/15', oee: 76.8 },
    ]);
  }, [selectedPeriod, selectedWorkCenter]);

  const getOEEColor = (value: number) => {
    if (value >= 85) return 'text-green-500';
    if (value >= 70) return 'text-yellow-500';
    if (value >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getOEEBgColor = (value: number) => {
    if (value >= 85) return 'bg-green-500';
    if (value >= 70) return 'bg-yellow-500';
    if (value >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getOEEClass = (value: number) => {
    if (value >= 85) return 'World Class';
    if (value >= 70) return 'Good';
    if (value >= 50) return 'Needs Improvement';
    return 'Critical';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">OEE Dashboard</h1>
          <p className="text-gray-600">Overall Equipment Effectiveness Monitoring</p>
        </div>

        <div className="flex gap-4">
          {/* Period Filter */}
          <div className="flex bg-white rounded-lg border overflow-hidden">
            {[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
            ].map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value as any)}
                className={`px-4 py-2 text-sm font-medium transition-colors
                  ${selectedPeriod === period.value 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Work Center Filter */}
          <select
            value={selectedWorkCenter}
            onChange={(e) => setSelectedWorkCenter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Work Centers</option>
            {oeeData.map(wc => (
              <option key={wc.id} value={wc.work_center_code}>
                {wc.work_center_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall OEE Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-4 gap-6">
          {/* OEE Score */}
          <div className="text-center">
            <div className="relative inline-block">
              <svg className="w-32 h-32" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={overallOEE.oee >= 85 ? '#22c55e' : overallOEE.oee >= 70 ? '#eab308' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${overallOEE.oee * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <span className={`text-3xl font-bold ${getOEEColor(overallOEE.oee)}`}>
                    {overallOEE.oee.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 font-semibold text-gray-800">Overall OEE</div>
            <div className={`text-sm ${getOEEColor(overallOEE.oee)}`}>
              {getOEEClass(overallOEE.oee)}
            </div>
          </div>

          {/* Availability */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <ClockIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-blue-600">{overallOEE.availability.toFixed(1)}%</div>
            <div className="text-gray-600 mt-1">Availability</div>
            <div className="text-sm text-gray-500">Run Time / Planned Time</div>
          </div>

          {/* Performance */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BoltIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold text-yellow-600">{overallOEE.performance.toFixed(1)}%</div>
            <div className="text-gray-600 mt-1">Performance</div>
            <div className="text-sm text-gray-500">Actual / Ideal Speed</div>
          </div>

          {/* Quality */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <ShieldCheckIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-4xl font-bold text-green-600">{overallOEE.quality.toFixed(1)}%</div>
            <div className="text-gray-600 mt-1">Quality</div>
            <div className="text-sm text-gray-500">Good / Total Produced</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Work Center OEE Cards */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Center Performance</h3>
          <div className="space-y-4">
            {oeeData.map(wc => (
              <div key={wc.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="font-semibold text-gray-800">{wc.work_center_name}</span>
                    <span className="text-sm text-gray-500 ml-2">({wc.work_center_code})</span>
                  </div>
                  <div className={`text-2xl font-bold ${getOEEColor(wc.oee)}`}>
                    {wc.oee.toFixed(1)}%
                  </div>
                </div>

                {/* OEE Bar */}
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getOEEBgColor(wc.oee)} transition-all`}
                    style={{ width: `${wc.oee}%` }}
                  />
                </div>

                {/* Component Breakdown */}
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Availability:</span>
                    <span className="font-medium text-blue-600">{wc.availability.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Performance:</span>
                    <span className="font-medium text-yellow-600">{wc.performance.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quality:</span>
                    <span className="font-medium text-green-600">{wc.quality.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Downtime Analysis */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Downtime Analysis</h3>
          
          <div className="space-y-3">
            {downtimeBreakdown.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.reason}</span>
                  <span className="font-medium">{item.minutes} min ({item.percentage}%)</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Downtime:</span>
              <span className="font-semibold text-red-600">
                {downtimeBreakdown.reduce((sum, d) => sum + d.minutes, 0)} minutes
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Lost Production:</span>
              <span className="font-semibold text-red-600">~72 units</span>
            </div>
          </div>
        </div>
      </div>

      {/* OEE Trend */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">OEE Trend (Last 7 Days)</h3>
        
        <div className="h-64 flex items-end gap-4">
          {trendData.map((day, index) => {
            const maxHeight = 200;
            const height = (day.oee / 100) * maxHeight;
            const prevOEE = index > 0 ? trendData[index - 1].oee : day.oee;
            const isUp = day.oee >= prevOEE;
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="mb-2 flex items-center text-sm">
                  <span className={`font-semibold ${getOEEColor(day.oee)}`}>
                    {day.oee.toFixed(1)}%
                  </span>
                  {index > 0 && (
                    isUp 
                      ? <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 ml-1" />
                      : <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 ml-1" />
                  )}
                </div>
                <div 
                  className={`w-full rounded-t-lg transition-all ${getOEEBgColor(day.oee)} opacity-80`}
                  style={{ height: `${height}px` }}
                />
                <div className="mt-2 text-sm text-gray-500">{day.date}</div>
              </div>
            );
          })}
        </div>

        {/* Target Line Reference */}
        <div className="flex justify-center gap-8 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>World Class (≥85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span>Good (70-84%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span>Needs Improvement (50-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span>Critical (&lt;50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

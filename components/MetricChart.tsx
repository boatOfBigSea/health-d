
import React, { useMemo } from 'react';
import { HealthRecord } from '../types';

export type ChartMode = 'recent' | 'monthly' | 'yearly';

interface MetricChartProps {
  records: HealthRecord[];
  mode: ChartMode;
  selectedYear: string;
}

const MetricChart: React.FC<MetricChartProps> = ({ records, mode, selectedYear }) => {
  const chartData = useMemo(() => {
    if (records.length === 0) return [];

    let filtered = [...records].sort((a, b) => a.date.localeCompare(b.date));

    // Handle filtering based on mode and selection
    if (mode === 'monthly') {
      // Monthly view MUST be limited to a specific year
      const yearToFilter = selectedYear === 'all' ? (filtered.length > 0 ? filtered[filtered.length - 1].date.substring(0, 4) : '') : selectedYear;
      filtered = filtered.filter(r => r.date.startsWith(yearToFilter));
    } else if (mode === 'yearly' && selectedYear !== 'all') {
      // Yearly view can be filtered to a specific year or show all
      filtered = filtered.filter(r => r.date.startsWith(selectedYear));
    }

    if (mode === 'recent') {
      return filtered.slice(-7).map(r => ({
        label: r.date.split('-').slice(1).join('/'),
        weight: r.weight,
        id: r.id,
        date: r.date
      }));
    }

    // Aggregate data
    const groups: Record<string, number[]> = {};
    filtered.forEach(r => {
      const key = mode === 'monthly' ? r.date.substring(0, 7) : r.date.substring(0, 4);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r.weight);
    });

    return Object.keys(groups).map(key => {
      const sum = groups[key].reduce((a, b) => a + b, 0);
      const avg = parseFloat((sum / groups[key].length).toFixed(1));
      return {
        label: mode === 'monthly' ? key.split('-')[1] + '月' : key + '年',
        weight: avg,
        id: key,
        date: key
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [records, mode, selectedYear]);

  if (chartData.length < 2) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-gray-400 space-y-3">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-center px-4">
          {selectedYear !== 'all' && (mode === 'monthly' || mode === 'yearly')
            ? `${selectedYear}年数据不足` 
            : `数据不足以生成${mode === 'recent' ? '近况' : mode === 'monthly' ? '月度' : '年度'}趋势`}
        </p>
      </div>
    );
  }

  const width = 300;
  const height = 160;
  const padding = 25;

  const weights = chartData.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const buffer = Math.max((maxWeight - minWeight) * 0.2, 1);
  const yMin = minWeight - buffer;
  const yMax = maxWeight + buffer;
  const weightRange = yMax - yMin;

  const getX = (index: number) => padding + (index * (width - 2 * padding) / (chartData.length - 1));
  const getY = (weight: number) => height - padding - ((weight - yMin) * (height - 2 * padding) / weightRange);

  const points = chartData.map((d, i) => `${getX(i)},${getY(d.weight)}`).join(' ');
  const areaPoints = `${getX(0)},${height - padding} ` + points + ` ${getX(chartData.length - 1)},${height - padding}`;

  return (
    <div className="w-full animate-fade-in">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#007AFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.5, 1].map((p, i) => {
          const y = padding + p * (height - 2 * padding);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#F2F2F7" strokeWidth="1" />
              <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="6" fill="#C7C7CC" fontWeight="bold">
                {Math.round(yMax - p * weightRange)}
              </text>
            </g>
          );
        })}

        {/* Gradient area */}
        <polygon points={areaPoints} fill="url(#areaGradient)" />

        {/* Path line */}
        <polyline
          fill="none"
          stroke="#007AFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Dots and values */}
        {chartData.map((d, i) => (
          <g key={d.id}>
            <circle cx={getX(i)} cy={getY(d.weight)} r="4.5" fill="#007AFF" />
            <circle cx={getX(i)} cy={getY(d.weight)} r="2" fill="white" />
            <text 
              x={getX(i)} 
              y={getY(d.weight) - 10} 
              textAnchor="middle" 
              fontSize="8" 
              fontWeight="800" 
              fill="#1C1C1E"
            >
              {d.weight}
            </text>
            <text 
              x={getX(i)} 
              y={height - 8} 
              textAnchor="middle" 
              fontSize="7" 
              fontWeight="bold" 
              fill="#8E8E93"
            >
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default MetricChart;

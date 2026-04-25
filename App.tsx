
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, TrendingDown, TrendingUp, Activity, Scale, Calendar, ChevronRight, Zap, BarChart3, ChevronDown, Download, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import Layout from './components/Layout';
import MetricChart, { ChartMode } from './components/MetricChart';
import { HealthRecord } from './types';
import { calculateBMI, getBMIInfo } from './utils/bmi';
import { getSmartAdvice } from './services/geminiService';

const STORAGE_KEY = 'health_records_pro_local_v3';

const App: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [chartMode, setChartMode] = useState<ChartMode>('recent');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [toastConfig, setToastConfig] = useState<{title: string, desc?: string, type: 'success'|'error'} | null>(null);

  const showToast = (title: string, desc?: string, type: 'success' | 'error' = 'success') => {
    setToastConfig({ title, desc, type });
    setTimeout(() => {
      setToastConfig(null);
    }, 5000);
  };

  // Form State
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Derive available years for filtering
  const availableYears = useMemo(() => {
    const years = new Set<string>(records.map(r => r.date.substring(0, 4)));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Handle export
  const exportData = () => {
    if (records.length === 0) {
      showToast('无法导出数据', '当前没有记录，请先添加健康数据后再尝试导出。', 'error');
      return;
    }
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health_pro_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('导出成功', '您的记录已成功下载。', 'success');
  };

  // Handle import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);
        
        if (Array.isArray(imported)) {
          // Simple validation: check if elements have required properties
          const isValid = imported.every((r: any) => r.id !== undefined && r.date !== undefined && r.weight !== undefined && r.height !== undefined && r.bmi !== undefined);
          if (isValid) {
            setRecords(imported.sort((a: any, b: any) => b.date.localeCompare(a.date)));
            if (imported.length > 0) setHeight(imported[0].height.toString());
            showToast('导入成功', `已成功导入 ${imported.length} 条记录。`, 'success');
          } else {
            showToast(
              '文件内容格式不匹配', 
              '请确保您的 JSON 文件是由本应用导出的标准格式。每条记录需要包含 id, date, weight, height, 和 bmi 字段。', 
              'error'
            );
          }
        } else {
          showToast('文件格式错误', '导入的文件应为一个 JSON 数组 ([...])。', 'error');
        }
      } catch (err) {
        showToast('解析文件失败', '无法读取该文件，请检查该文件是否为有效的 .json 文本文件。', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  // Handle default year selection when switching modes
  useEffect(() => {
    if (chartMode === 'monthly') {
      // Monthly must have a specific year. If "all", pick the latest.
      if (selectedYear === 'all' && availableYears.length > 0) {
        setSelectedYear(availableYears[0]);
      }
    }
  }, [chartMode, availableYears]);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecords(parsed);
        if (parsed.length > 0) setHeight(parsed[0].height.toString());
      } catch (e) { console.error(e); }
    }
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    
    if (records.length > 0 && isOnline) {
      setIsLoadingAi(true);
      getSmartAdvice(records).then(advice => {
        setAiAdvice(advice);
        setIsLoadingAi(false);
      });
    } else {
      setAiAdvice(null);
    }
  }, [records, isOnline]);

  const addRecord = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return;

    const newRecord: HealthRecord = {
      id: Date.now().toString(),
      date,
      height: h,
      weight: w,
      bmi: calculateBMI(h, w)
    };

    setRecords(prev => [newRecord, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setIsModalOpen(false);
    setWeight('');
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const currentRecord = records[0];
  const previousRecord = records[1];
  const weightDiff = currentRecord && previousRecord ? currentRecord.weight - previousRecord.weight : 0;
  const bmiInfo = currentRecord ? getBMIInfo(currentRecord.bmi) : null;

  return (
    <Layout>
      <header className="mb-8 animate-fade-in flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 items-start">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Health Pro</h1>
          <p className="text-gray-500 font-medium">身体指标全记录</p>
        </div>
        <div className="flex items-center gap-2">
          <label 
            className="px-3 py-2 bg-white text-gray-700 text-xs font-bold rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all ios-button-active cursor-pointer whitespace-nowrap"
            title="导入记录"
          >
            导入数据
            <input 
              type="file" 
              accept=".json" 
              onClick={(e) => { e.currentTarget.value = ''; }}
              onChange={handleImport} 
              className="hidden" 
            />
          </label>
          <button 
            onClick={exportData}
            className="px-3 py-2 bg-white text-gray-700 text-xs font-bold rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all ios-button-active whitespace-nowrap"
            title="导出记录"
          >
            导出数据
          </button>
          {!isOnline && (
            <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-orange-100">
              <Zap size={10} /> 离线
            </div>
          )}
        </div>
      </header>

      {currentRecord ? (
        <div className="space-y-4 animate-fade-in">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-[32px] p-6">
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Scale size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">体重</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{currentRecord.weight}</span>
                <span className="text-sm text-gray-400 font-bold uppercase">kg</span>
              </div>
              <div className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${weightDiff > 0 ? 'text-red-500' : weightDiff < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                {weightDiff > 0 ? <TrendingUp size={12} /> : weightDiff < 0 ? <TrendingDown size={12} /> : null}
                {weightDiff === 0 ? '持平' : `${Math.abs(weightDiff).toFixed(1)}kg`}
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-6">
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Activity size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">BMI</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{currentRecord.bmi}</span>
              </div>
              <div className={`mt-2 text-[11px] font-bold ${bmiInfo?.color}`}>
                {bmiInfo?.label}
              </div>
            </div>
          </div>

          {/* Advice Card */}
          <div className="glass-card rounded-[32px] p-6 border-l-[6px] border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                ✨ 小建议
                {isLoadingAi && <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />}
              </span>
            </div>
            <p className="text-gray-800 leading-relaxed text-sm font-medium">
              {aiAdvice || bmiInfo?.advice}
            </p>
          </div>
          
          {/* Chart Section */}
          <div className="glass-card rounded-[32px] p-6 overflow-hidden">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 size={14} /> 数据波动趋势
                </h3>

                {/* Year Selector (Visible for Monthly and Yearly) */}
                {(chartMode === 'monthly' || chartMode === 'yearly') && availableYears.length > 0 && (
                  <div className="relative group">
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-100 rounded-xl px-4 py-1.5 pr-8 text-[10px] font-bold text-gray-600 outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                    >
                      {chartMode === 'yearly' && <option value="all">所有年份</option>}
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year} 年</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>
              
              {/* Segmented Control */}
              <div className="bg-gray-100 p-1 rounded-xl flex items-center w-full">
                {(['recent', 'monthly', 'yearly'] as ChartMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-tight transition-all ${
                      chartMode === mode 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {mode === 'recent' ? '近况' : mode === 'monthly' ? '月度' : '年度'}
                  </button>
                ))}
              </div>
            </div>
            
            <MetricChart records={records} mode={chartMode} selectedYear={selectedYear} />
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-[40px] p-12 text-center animate-fade-in shadow-sm">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity size={48} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎来到 Health Pro</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
            记录第一条身体数据，开启您的健康量化之旅。数据将安全存储在您的设备本地。
          </p>
        </div>
      )}

      {/* History List */}
      <div className="mt-12 mb-24 animate-fade-in px-2">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-bold text-gray-900">打卡历史</h3>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{records.length} 记录</span>
        </div>
        
        <div className="space-y-4">
          {records.map((r) => (
            <div key={r.id} className="bg-white rounded-[28px] p-5 flex items-center justify-between shadow-sm border border-gray-100/50 ios-button-active">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                  <Calendar size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xl font-bold text-gray-900">{r.weight}<small className="text-[11px] ml-1 text-gray-400">KG</small></span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 ${getBMIInfo(r.bmi).color}`}>BMI {r.bmi}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">{r.date} • {r.height}cm</p>
                </div>
              </div>
              <button 
                onClick={() => deleteRecord(r.id)}
                className="p-3 text-gray-200 hover:text-red-400 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add FAB Wrapper */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-40">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_15px_30px_rgba(0,122,255,0.4)] flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90 pointer-events-auto"
        >
          <Plus size={32} />
        </button>
      </div>

      {/* Input Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex overflow-y-auto p-4 bg-black/50 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white m-auto w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex-shrink-0"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">录入指标</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-[24px] p-4">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2 ml-1">记录日期</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold text-gray-900 border-none outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-[24px] p-4">
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2 ml-1">身高 (cm)</label>
                  <input 
                    type="number" 
                    placeholder="170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-transparent text-lg font-bold text-gray-900 border-none outline-none"
                  />
                </div>
                <div className="bg-gray-50 rounded-[24px] p-4">
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2 ml-1">体重 (kg)</label>
                  <input 
                    type="number"
                    step="0.1" 
                    placeholder="60.0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-transparent text-lg font-bold text-gray-900 border-none outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-gray-400 font-bold active:bg-gray-100 rounded-[24px] transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={addRecord}
                  disabled={!weight || !height}
                  className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-[24px] shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  保存档案 <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toastConfig && (
        <div className="fixed bottom-28 inset-x-0 z-[100] pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom duration-300">
          <div className={`w-[90%] max-w-sm p-4 pointer-events-auto rounded-3xl shadow-xl flex items-start gap-3 ${toastConfig.type === 'error' ? 'bg-red-50 text-red-900 border border-red-100' : 'bg-green-50 text-green-900 border border-green-100'}`}>
            <div className="mt-0.5 flex-shrink-0">
              {toastConfig.type === 'error' ? <AlertCircle size={20} className="text-red-500" /> : <CheckCircle2 size={20} className="text-green-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm tracking-tight">{toastConfig.title}</h3>
              {toastConfig.desc && <p className="text-xs opacity-80 mt-1 leading-relaxed">{toastConfig.desc}</p>}
            </div>
            <button onClick={() => setToastConfig(null)} className="p-1 opacity-50 hover:opacity-100 transition-opacity flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { Download, Mail, Loader2, Calendar, CheckCircle, AlertCircle, Eye, X } from 'lucide-react';
import api from '../api';

const ReportSection = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [previewUrl, setPreviewUrl] = useState(null);

  // Cleanup memory on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const getPresetDates = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'ytd':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }
    
    // Format to YYYY-MM-DD
    // Note: getMonth() is 0-indexed, but Date formats handle timezone carefully, 
    // it is safer to construct ISO strings without time offset.
    const pad = (n) => n.toString().padStart(2, '0');
    setStartDate(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`);
    setEndDate(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`);
    setStatus({ type: '', message: '' });
  };

  const validateDates = () => {
    if (!startDate || !endDate) {
      setStatus({ type: 'error', message: 'Please select both start and end dates.' });
      return false;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setStatus({ type: 'error', message: 'Start date cannot be after end date.' });
      return false;
    }
    return true;
  };

  const handlePreviewPdf = async () => {
    if (!validateDates()) return;
    
    setLoadingPreview(true);
    setStatus({ type: '', message: '' });
    
    try {
      const response = await api.get(`/reports/download?startDate=${startDate}&endDate=${endDate}`, {
        responseType: 'blob'
      });
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      setStatus({ type: 'success', message: 'PDF generated for preview.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'An error occurred generating the preview.' });
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validateDates()) return;
    
    setLoadingPdf(true);
    setStatus({ type: '', message: '' });
    
    try {
      const response = await api.get(`/reports/download?startDate=${startDate}&endDate=${endDate}`, {
        responseType: 'blob'
      });
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setStatus({ type: 'success', message: 'PDF downloaded successfully.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'An error occurred during download.' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (!validateDates()) return;
    
    setLoadingEmail(true);
    setStatus({ type: '', message: '' });
    
    try {
      await api.post(`/reports/send-email?startDate=${startDate}&endDate=${endDate}`);
      
      setStatus({ type: 'success', message: 'Report sent to your email successfully.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || error.message || 'An error occurred sending the email.' });
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 p-8 rounded-2xl shadow-sm mb-8 w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Financial Summary & Statements</h2>
          <p className="text-gray-500 dark:text-gray-400">Generate and export detailed financial records</p>
        </div>
      </div>

      {status.message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 mb-6 border ${
          status.type === 'error' 
            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
        }`}>
          {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">Quick Filters:</span>
        <button 
          onClick={() => getPresetDates('thisMonth')}
          className="text-sm px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          This Month
        </button>
        <button 
          onClick={() => getPresetDates('lastMonth')}
          className="text-sm px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Last Month
        </button>
        <button 
          onClick={() => getPresetDates('ytd')}
          className="text-sm px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Year to Date
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-200 dark:border-slate-700/60 pt-6">
        <button
          onClick={handlePreviewPdf}
          disabled={loadingPreview || loadingPdf || loadingEmail}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loadingPreview ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
          View / Preview PDF
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={loadingPreview || loadingPdf || loadingEmail}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-900/30 py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loadingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          Download PDF
        </button>
        <button
          onClick={handleSendEmail}
          disabled={loadingPreview || loadingPdf || loadingEmail}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/30 py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loadingEmail ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
          Send to Email
        </button>
      </div>

      {previewUrl && (
        <div className="mt-8 border border-gray-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-900 flex flex-col">
          <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700/60">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PDF Preview</span>
            <button 
              onClick={closePreview}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              <X size={16} /> Close Preview
            </button>
          </div>
          <iframe 
            src={previewUrl} 
            className="w-full h-[600px] border-none"
            title="PDF Preview"
          />
        </div>
      )}
    </div>
  );
};

export default ReportSection;

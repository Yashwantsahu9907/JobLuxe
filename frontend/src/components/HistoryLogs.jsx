import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Download, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Papa from 'papaparse';
import ConfirmModal from './ConfirmModal';

const HistoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs', err);
    }
  };

  const handleClearLogs = async () => {
    try {
      await axios.delete('/api/logs');
      setLogs([]);
      toast.success('Logs cleared');
    } catch (err) {
      toast.error('Failed to clear logs');
    }
  };

  const handleDownload = async () => {
    try {
      const res = await axios.get('/api/logs/all');
      const csv = Papa.unparse(res.data.map(l => ({
        Campaign: l.campaignId,
        Recipient: l.recipient,
        Subject: l.subject,
        Status: l.status,
        Error: l.errorMsg || '',
        SentAt: new Date(l.sentAt).toLocaleString()
      })));
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'campaign_logs.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Log CSV downloaded');
    } catch (err) {
      toast.error('Failed to generate log CSV');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Delivery History</h2>
          <p className="text-sm text-slate-500 mt-1">Review the status of recently processed emails.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <Download size={16} /> Download CSV
          </button>
          <button 
            onClick={() => setIsClearModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm">
              <th className="py-3 px-6 font-semibold border-b border-slate-200">Recipient</th>
              <th className="py-3 px-6 font-semibold border-b border-slate-200">Subject</th>
              <th className="py-3 px-6 font-semibold border-b border-slate-200">Status</th>
              <th className="py-3 px-6 font-semibold border-b border-slate-200 hidden md:table-cell">Date & Time</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-500">
                  No logs available.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-slate-800">{log.recipient}</td>
                  <td className="py-3 px-6 text-slate-600 truncate max-w-xs">{log.subject}</td>
                  <td className="py-3 px-6">
                    {log.status === 'success' ? (
                      <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-max text-xs font-semibold">
                        <CheckCircle size={14} /> Delivered
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full w-max text-xs font-semibold" title={log.errorMsg}>
                        <XCircle size={14} /> Failed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-slate-500 hidden md:table-cell">
                    {new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearLogs}
        title="Clear History"
        message="Are you sure you want to clear all email delivery history? This action cannot be undone."
        confirmText="Clear All Logs"
      />
    </div>
  );
};

export default HistoryLogs;

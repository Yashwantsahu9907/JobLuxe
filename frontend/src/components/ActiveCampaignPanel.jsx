import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, Square, Activity } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';

const ActiveCampaignPanel = () => {
  const [statusData, setStatusData] = useState(null);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);

  useEffect(() => {
    // Poll status every second
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('/api/campaigns/status');
        setStatusData(res.data);
      } catch (err) {
        console.error('Error fetching status', err);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePause = async () => {
    await axios.post('/api/campaigns/pause');
  };

  const handleResume = async () => {
    await axios.post('/api/campaigns/resume');
  };

  const handleStop = async () => {
    try {
      await axios.post('/api/campaigns/stop');
      toast.success('Campaign stopped');
    } catch (err) {
      toast.error('Failed to stop campaign');
    }
  };

  if (!statusData || (statusData.status === 'idle' && statusData.total === 0)) {
    return null; // Not active
  }

  const { status, total, sent, failed, progress } = statusData;

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isStopped = status === 'stopped';

  let statusColor = 'text-slate-600';
  if (isRunning) statusColor = 'text-green-600';
  if (isPaused) statusColor = 'text-orange-500';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isRunning ? 'bg-green-100' : 'bg-slate-100'}`}>
            <Activity className={statusColor} size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Active Campaign Tracking</h3>
            <p className={`text-sm font-medium capitalize ${statusColor}`}>
              Status: {status}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isRunning && (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors font-medium text-sm"
            >
              <Pause size={16} /> Pause
            </button>
          )}
          {isPaused && (
            <button
              onClick={handleResume}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors font-medium text-sm"
            >
              <Play size={16} /> Resume
            </button>
          )}
          {(isRunning || isPaused) && (
            <button
              onClick={() => setIsStopModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-medium text-sm"
            >
              <Square size={16} /> Stop
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-2 text-slate-600 font-medium">
          <span>Progress ({progress}%)</span>
          <span>{sent + failed} / {total} Emails Processed</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-green-600 text-sm font-semibold uppercase tracking-wider mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-700">{sent}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-red-600 text-sm font-semibold uppercase tracking-wider mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-700">{failed}</p>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isStopModalOpen}
        onClose={() => setIsStopModalOpen(false)}
        onConfirm={handleStop}
        title="Stop Campaign"
        message="Are you sure you want to stop the active campaign? This will halt all pending emails."
        confirmText="Stop Campaign"
      />
    </div>
  );
};

export default ActiveCampaignPanel;

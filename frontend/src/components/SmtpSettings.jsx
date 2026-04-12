import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Mail, KeyRound, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const SmtpSettings = () => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({ user: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get('/api/smtp');
      setAccounts(res.data);
    } catch (err) {
      toast.error('Failed to fetch SMTP credentials');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.user || !formData.password) {
      return toast.error('Email and App Password are required');
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.user)) {
      return toast.error('Invalid email format');
    }

    // App Password strictly 16 chars, letters and numbers only
    const passRegex = /^[a-zA-Z0-9]{16}$/;
    if (!passRegex.test(formData.password)) {
      return toast.error('App Password must be exactly 16 characters long (letters and numbers only).');
    }

    setIsLoading(true);
    try {
      await axios.post('/api/smtp', formData);
      toast.success('SMTP account saved securely');
      setFormData({ user: '', password: '' });
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/smtp/${id}`);
      toast.success('SMTP account removed');
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="text-blue-600" /> SMTP Configuration
          </h2>
          <p className="text-sm text-slate-500 mt-1">Encrypt and manage your sending credentials to seamlessly toggle sender emails.</p>
        </div>
        
        <div className="p-6 lg:flex lg:gap-8">
          <form onSubmit={handleCreate} className="lg:w-1/3 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">SMTP User (Email)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">SMTP App Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="16-character app password"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Stored using AES-256-CBC encryption.</p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user) || !/^[a-zA-Z0-9]{16}$/.test(formData.password)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium transition-colors shadow-sm active:scale-95"
            >
              <Plus size={18} /> {isLoading ? 'Saving...' : 'Add SMTP Account'}
            </button>
          </form>

          <div className="lg:w-2/3 mt-8 lg:mt-0">
            <h3 className="text-md font-semibold text-slate-800 mb-4 border-b pb-2">Active Accounts</h3>
            {accounts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-500 bg-slate-50">
                No configured credentials yet. Add one to start sending campaigns.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map(acc => (
                  <div key={acc._id} className="relative group bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-green-100 text-green-600 p-2 rounded-lg shrink-0">
                         <CheckCircle2 size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate" title={acc.user}>{acc.user}</p>
                        <p className="text-xs text-slate-500">Encrypted Setup</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(acc._id)}
                      className="text-slate-400 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors shrink-0"
                      title="Delete credential"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmtpSettings;

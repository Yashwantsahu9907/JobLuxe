import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Mail, History, FileText, Send, Settings, LogOut } from 'lucide-react';
import ActiveCampaignPanel from './ActiveCampaignPanel';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64  bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl  font-bold text-slate-800 flex items-center gap-2">
            <Send className=" text-green-600" />
            JobLuxe
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Mail size={20} />
            New Campaign
          </NavLink>
          <NavLink
            to="/templates"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <FileText size={20} />
            Templates
          </NavLink>
          <NavLink
            to="/logs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <History size={20} />
            History Logs
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Settings size={20} />
            SMTP Settings
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center px-8 z-10 sticky top-0">
          <h2 className="text-lg font-medium text-slate-800">Admin Panel</h2>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors font-medium"
          >
            <LogOut size={16} /> Logout
          </button>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-6xl mx-auto space-y-8">
            <ActiveCampaignPanel />
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

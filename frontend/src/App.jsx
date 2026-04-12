import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './components/DashboardLayout';
import CampaignCreator from './components/CampaignCreator';
import HistoryLogs from './components/HistoryLogs';
import TemplateManager from './components/TemplateManager';
import SmtpSettings from './components/SmtpSettings';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout><CampaignCreator /></DashboardLayout></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><DashboardLayout><HistoryLogs /></DashboardLayout></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><DashboardLayout><TemplateManager /></DashboardLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SmtpSettings /></DashboardLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

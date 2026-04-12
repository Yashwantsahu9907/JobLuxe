import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { UploadCloud, Play, FileText, ChevronDown } from 'lucide-react';

const CampaignCreator = () => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [emailCount, setEmailCount] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get('/api/smtp');
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to fetch SMTP accounts');
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error('Failed to fetch templates');
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsAnalyzing(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await axios.post('/api/campaigns/analyze-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setEmailCount(res.data.totalEmails);
      } catch (err) {
        console.error('Failed to analyze file:', err);
        toast.error('Could not extract emails from this file');
        setEmailCount(0);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value;
    if (!templateId) return;
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !subject || !content) {
      toast.error("Please fill all fields and upload a file.");
      return;
    }
    if (!selectedAccount) {
      toast.error("Please select a sender account.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    formData.append('content', content);
    formData.append('smtpAccountId', selectedAccount);

    try {
      await axios.post('/api/campaigns/start', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Campaign started successfully!');
      // Reset form
      setFile(null);
      setSubject('');
      setContent('');
      setSelectedAccount('');
      setEmailCount(0);
      if(fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create New Campaign</h2>
        <p className="text-slate-500 mt-1">Upload your audience and compose your email.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Audience File (CSV, PDF, DOCX, XLSX, TXT)</label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer"
               onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mx-auto text-slate-400 mb-3" size={32} />
            {file ? (
              <div>
                <p className="text-slate-800 font-medium">{file.name}</p>
                <p className={`text-sm font-medium mt-1 ${isAnalyzing ? 'text-blue-500 animate-pulse' : 'text-green-600'}`}>
                  {isAnalyzing ? 'Analyzing file...' : `${emailCount} valid emails found`}
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Click to upload file (PDF, DOCX, XLSX, CSV, TXT) or drag and drop</p>
            )}
            <input 
              type="file" 
              accept=".csv,.pdf,.docx,.xlsx,.txt" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject Line */}
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Subject</label>
            <input 
              type="text" 
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-slate-800 placeholder-slate-400"
              placeholder="Exciting news inside..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Template Selection */}
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Load Template</label>
            <div className="relative">
              <select 
                className="w-full border border-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white text-slate-800 cursor-pointer"
                onChange={handleTemplateSelect}
                defaultValue=""
              >
                <option value="" disabled>Select a saved template...</option>
                {templates.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>
          
          {/* Senders Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Sender Account</label>
            <div className="relative">
              <select 
                className="w-full border border-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white text-slate-800 cursor-pointer"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="" disabled>Select an authenticated SMTP user...</option>
                {accounts.map(acc => (
                  <option key={acc._id} value={acc._id}>{acc.user}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        {/* Email Content (Rich Text) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email Content (HTML)</label>
          <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={setContent} 
              className="h-64 sm:h-80"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                  [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                  ['link', 'image', 'video'],
                  ['clean'],
                  [{ 'color': [] }, { 'background': [] }],
                  [{ 'align': [] }],
                ],
              }}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-8 sm:pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white shadow-md transition-all ${
              isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
            }`}
          >
            {isSubmitting ? 'Starting...' : (
              <>
                <Play size={18} />
                Launch Campaign
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignCreator;

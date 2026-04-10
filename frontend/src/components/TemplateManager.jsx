import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Save, Plus, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error('Error fetching templates', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !subject || !content) {
      toast.error("All fields are required");
      return;
    }

    try {
      await axios.post('/api/templates', { name, subject, content });
      toast.success('Template saved successfully!');
      setName('');
      setSubject('');
      setContent('');
      setIsFormVisible(false);
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/templates/${id}`);
      fetchTemplates();
      toast.success('Template deleted');
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Email Templates</h2>
          <p className="text-slate-500 text-sm mt-1">Design and save reusable HTML emails.</p>
        </div>
        <button 
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all font-medium shadow-md hover:shadow-lg"
        >
          {isFormVisible ? 'Cancel' : <><Plus size={18} /> New Template</>}
        </button>
      </div>

      {isFormVisible && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Template Internal Name</label>
              <input 
                type="text" 
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                placeholder="e.g. Newsletter Welcome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Default Subject Line</label>
              <input 
                type="text" 
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                placeholder="Welcome to our platform!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Template Content</label>
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-shadow bg-white">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                className="h-64 sm:h-80"
              />
            </div>
          </div>

          <div className="pt-8 sm:pt-4 flex justify-end">
            <button 
              type="submit" 
              className="flex items-center gap-2 px-8 py-3.5 bg-green-600 text-white hover:bg-green-700 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg active:scale-95"
            >
              <Save size={18} /> Save Template
            </button>
          </div>
        </form>
      )}

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.map(t => (
          <div key={t._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group flex flex-col h-full relative">
            <button 
              onClick={() => setDeleteModal({ isOpen: true, id: t._id })}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Delete Template"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-1 pr-8">{t.name}</h3>
            <p className="text-sm font-medium text-slate-500 mb-4 truncate text-ellipsis">Subject: {t.subject}</p>
            
            <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 overflow-hidden relative">
              <div dangerouslySetInnerHTML={{ __html: t.content }} className="text-xs text-slate-600 line-clamp-6 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>
        ))}
        {templates.length === 0 && !isFormVisible && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
            <p className="text-slate-500 font-medium pb-2">No templates found.</p>
            <p className="text-sm text-slate-400">Click "New Template" to create your first design.</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete Template"
      />
    </div>
  );
};

export default TemplateManager;

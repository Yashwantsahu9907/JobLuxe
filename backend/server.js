const express = require('express');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const csvParser = require('csv-parser');
const stream = require('stream');
const { extractEmailsFromFile } = require('./utils/emailExtractor');

const queueManager = require('./queueManager');
const Log = require('./models/Log');
const Template = require('./models/Template');
const SmtpCredential = require('./models/SmtpCredential');
const { encrypt, decrypt } = require('./utils/encryption');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error: ', err));

// Multer setup for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// ----------------------------------------------------
// Authentication API
// ----------------------------------------------------
const jwt = require('jsonwebtoken');
const authMiddleware = require('./utils/auth');

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '12h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Protect all following /api routes
app.use('/api/campaigns', authMiddleware);
app.use('/api/logs', authMiddleware);
app.use('/api/templates', authMiddleware);
app.use('/api/smtp', authMiddleware);

// ----------------------------------------------------
// Campaigns API
// ----------------------------------------------------

app.post('/api/campaigns/start', upload.single('file'), async (req, res) => {
  try {
    const { subject, content, smtpAccountId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'File is required' });
    if (!subject || !content) return res.status(400).json({ error: 'Subject and content are required' });
    if (!smtpAccountId) return res.status(400).json({ error: 'Sender account (SMTP) is required' });

    // Find and decrypt SMTP credential
    let smtpUser, smtpPass;
    try {
      const account = await SmtpCredential.findById(smtpAccountId);
      if (!account) return res.status(404).json({ error: 'Selected SMTP account not found' });
      smtpUser = account.user;
      smtpPass = decrypt(account.password);
      
      if (!smtpPass) return res.status(500).json({ error: 'Failed to decrypt SMTP password for chosen account' });
    } catch (err) {
      return res.status(500).json({ error: 'Error fetching SMTP account' });
    }

    try {
      const results = await extractEmailsFromFile(file.buffer, file.mimetype, file.originalname);
      
      if (results.length === 0) {
        return res.status(400).json({ error: 'No valid emails found in the uploaded file' });
      }

      queueManager.start(results, subject, content, smtpUser, smtpPass);
      return res.status(200).json({ 
        message: 'Campaign started successfully', 
        totalEmails: results.length,
        campaignId: queueManager.campaignId,
      });
    } catch (err) {
      console.error('Extraction error:', err);
      return res.status(400).json({ error: err.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/campaigns/analyze-file', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'File is required' });

    try {
      const results = await extractEmailsFromFile(file.buffer, file.mimetype, file.originalname);
      return res.status(200).json({ 
        totalEmails: results.length,
        emails: results // Optional: could be used for preview
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/campaigns/pause', (req, res) => {
  try {
    queueManager.pause();
    res.json({ message: 'Campaign paused', status: queueManager.getStatus() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/campaigns/resume', (req, res) => {
  try {
    queueManager.resume();
    res.json({ message: 'Campaign resumed', status: queueManager.getStatus() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/campaigns/stop', (req, res) => {
  try {
    queueManager.stop();
    res.json({ message: 'Campaign stopped', status: queueManager.getStatus() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/campaigns/status', (req, res) => {
  res.json(queueManager.getStatus());
});

// ----------------------------------------------------
// Logs API
// ----------------------------------------------------

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await Log.find().select('-content').sort({ sentAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.get('/api/logs/all', async (req, res) => {
  try {
    const logs = await Log.find().select('-content').sort({ sentAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.get('/api/logs/:id', async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch log detail' });
  }
});

app.delete('/api/logs', async (req, res) => {
  try {
    await Log.deleteMany({});
    res.json({ message: 'Logs cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// ----------------------------------------------------
// Templates API
// ----------------------------------------------------

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const { name, subject, content } = req.body;
    if (!name || !subject || !content) {
      return res.status(400).json({ error: 'Name, subject, and content are required' });
    }
    const template = new Template({ name, subject, content });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save template' });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Template.findByIdAndDelete(id);
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ----------------------------------------------------
// SMTP Credentials API
// ----------------------------------------------------

app.get('/api/smtp', async (req, res) => {
  try {
    const accounts = await SmtpCredential.find().select('-password').sort({ createdAt: -1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SMTP accounts' });
  }
});

app.post('/api/smtp', async (req, res) => {
  try {
    // Strictly accept only user and password fields
    const { user, password } = req.body;
    
    if (!user || !password) {
      return res.status(400).json({ error: 'SMTP user and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const passRegex = /^[a-zA-Z0-9]{16}$/;
    if (!passRegex.test(password)) {
      return res.status(400).json({ error: 'App Password must be exactly 16 characters long and contain only letters and numbers' });
    }

    const existing = await SmtpCredential.findOne({ user });
    if (existing) {
      return res.status(400).json({ error: 'An SMTP account with this email already exists' });
    }

    const encryptedPassword = encrypt(password);
    const account = new SmtpCredential({ user, password: encryptedPassword });
    await account.save();
    
    res.status(201).json({ _id: account._id, user: account.user, createdAt: account.createdAt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save SMTP account' });
  }
});

app.delete('/api/smtp/:id', async (req, res) => {
  try {
    await SmtpCredential.findByIdAndDelete(req.params.id);
    res.json({ message: 'SMTP account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete SMTP account' });
  }
});

// ----------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
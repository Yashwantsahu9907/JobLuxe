const nodemailer = require('nodemailer');
const Log = require('./models/Log');
require('dotenv').config();

class QueueManager {
  constructor() {
    this.status = 'idle'; // idle, running, paused, stopped
    this.total = 0;
    this.sent = 0;
    this.failed = 0;
    this.emails = [];
    this.subject = '';
    this.content = '';
    this.campaignId = null;
    this.currentIndex = 0;
    this.delayMs = parseInt(process.env.EMAIL_DELAY_MS) || 3000;
    
    const port = process.env.SMTP_PORT || 465;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: port == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      logger: true, // Enable built-in logger
      debug: true   // Include SMTP traffic in the logs
    });
  }

  start(emails, subject, content, smtpUser, smtpPass) {
    if (this.status === 'running') {
      throw new Error('A campaign is already running');
    }

    // Override transporter with selected credentials
    if (smtpUser && smtpPass) {
      this.activeSmtpUser = smtpUser;
      const port = process.env.SMTP_PORT || 465;
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: port == 465, 
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        },
        logger: true, // Enable built-in logger
        debug: true   // Include SMTP traffic in the logs
      });
    }
    this.emails = emails;
    this.subject = subject;
    this.content = content;
    this.total = emails.length;
    this.sent = 0;
    this.failed = 0;
    this.currentIndex = 0;
    this.campaignId = `camp_${Date.now()}`;
    this.status = 'running';
    
    this.processNext();
  }

  pause() {
    if (this.status !== 'running') {
      throw new Error('No campaign is running to pause');
    }
    this.status = 'paused';
  }

  resume() {
    if (this.status !== 'paused') {
      throw new Error('Campaign is not paused');
    }
    this.status = 'running';
    this.processNext();
  }

  stop() {
    if (this.status === 'idle' || this.status === 'stopped') {
      throw new Error('No active campaign to stop');
    }
    this.status = 'stopped';
    this.reset();
  }

  getStatus() {
    return {
      status: this.status,
      total: this.total,
      sent: this.sent,
      failed: this.failed,
      progress: this.total === 0 ? 0 : Math.round(((this.sent + this.failed) / this.total) * 100),
      campaignId: this.campaignId
    };
  }

  reset() {
    // Keep stats but transition to stopped/idle
    this.status = 'idle';
    this.emails = [];
    this.currentIndex = 0;
  }

  async processNext() {
    if (this.status !== 'running') return;
    
    if (this.currentIndex >= this.emails.length) {
      this.status = 'idle';
      console.log('Campaign finished');
      return;
    }

    const email = this.emails[this.currentIndex];
    this.currentIndex++;

    try {
      const mailOptions = {
        from: this.activeSmtpUser || process.env.SMTP_USER,
        to: email,
        subject: this.subject,
        html: this.content,
      };

      await this.transporter.sendMail(mailOptions);
      this.sent++;
      
      // Log success
      await Log.create({
        campaignId: this.campaignId,
        recipient: email,
        subject: this.subject,
        content: this.content,
        status: 'success',
      });
      
    } catch (error) {
      this.failed++;
      console.error(`\n--- NODEMAILER ERROR ---`);
      console.error(`Failed to send email to ${email}`);
      console.error(`Error Code: ${error.code}`);
      console.error(`Error Message: ${error.message}`);
      console.error(error);
      console.error(`------------------------\n`);
      
      // Log failure
      await Log.create({
        campaignId: this.campaignId,
        recipient: email,
        subject: this.subject,
        content: this.content,
        status: 'failed',
        errorMsg: error.message,
      });
    }

    // Delay before next
    if (this.status === 'running') {
      setTimeout(() => {
        this.processNext();
      }, this.delayMs);
    }
  }
}

module.exports = new QueueManager();

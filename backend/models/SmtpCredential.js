const mongoose = require('mongoose');

const smtpCredentialSchema = new mongoose.Schema({
  user: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SmtpCredential', smtpCredentialSchema);

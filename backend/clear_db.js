const mongoose = require('mongoose');

async function clearDB() {
  try {
    await mongoose.connect('mongodb+srv://Jobluxe:JobLuxe123@jobluxe.spjspjw.mongodb.net/jobluxe?retryWrites=true&w=majority');
    const SmtpCredential = require('./models/SmtpCredential');
    await SmtpCredential.deleteMany({});
    console.log('Cleared all SMTP Credentials from DB');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clearDB();

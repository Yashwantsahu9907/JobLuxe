const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb+srv://Jobluxe:JobLuxe123@jobluxe.spjspjw.mongodb.net/jobluxe?retryWrites=true&w=majority');
    const SmtpCredential = require('./backend/models/SmtpCredential');
    const accounts = await SmtpCredential.find();
    for (const acc of accounts) {
      console.log(`Account: ${acc.user}, Raw Password length: ${acc.password.length}, Password includes :? ${acc.password.includes(':')}`);
      console.log(`Raw Password: ${acc.password}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

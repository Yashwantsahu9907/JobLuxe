require('dotenv').config();
const mongoose = require('mongoose');
const Log = require('./models/Log');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const logs = await Log.find({ status: 'failed' }).sort({ sentAt: -1 }).limit(5);
  console.log("LAST 5 FAILURES:");
  logs.forEach(l => console.log(l.errorMsg));
  mongoose.disconnect();
}
check();

require('dotenv').config();
const mongoose = require('mongoose');
const Log = require('./models/Log');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const logs = await Log.find({ status: 'failed' }).sort({ sentAt: -1 }).limit(10);
  console.log("LAST 10 FAILURES FULL DETAILS:");
  logs.forEach(l => {
     console.log(l.sentAt, "=>", l.errorMsg);
  });
  mongoose.disconnect();
}
check();

const fs = require('fs');

async function debugCall() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in, got token');

    // 2. Fetch SMTP accounts
    const smtpRes = await fetch('http://localhost:5000/api/smtp', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const smtpData = await smtpRes.json();
    
    if (smtpData.length === 0) {
      console.log('No SMTP accounts found');
      return;
    }
    const smtpAccountId = smtpData[0]._id;
    console.log('Using SMTP Account ID:', smtpAccountId);

    // 3. Create dummy file
    fs.writeFileSync('test.csv', 'email\ntest@example.com\n');

    // 4. Try starting a campaign
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync('test.csv')]);
    formData.append('file', blob, 'test.csv');
    formData.append('subject', 'Test Subject');
    formData.append('content', '<p>Test Content</p>');
    formData.append('smtpAccountId', smtpAccountId);

    const startRes = await fetch('http://localhost:5000/api/campaigns/start', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const startText = await startRes.text();
    console.log('Status Base:', startRes.status);
    console.log('Response:', startText);

  } catch (err) {
    console.error('Network Error:', err.message);
  }
}

debugCall();

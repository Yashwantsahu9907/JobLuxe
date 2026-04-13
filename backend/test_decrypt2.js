const crypto = require('crypto');
function getSecureKey(RAW_KEY) {
  return crypto.createHash('sha256').update(String(RAW_KEY)).digest();
}

function tryDecrypt(text, RAW_KEY) {
  try {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', getSecureKey(RAW_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    console.log("SUCCESS WITH KEY:", JSON.stringify(RAW_KEY), "->", decrypted.toString());
    process.exit(0);
  } catch (error) {
    // ignore
  }
}

const cipher1 = "77943771f9041d62b60d94f2c3be560e:7d3c30bdf50d74065d2450762ed343491051e925daa425e7f06d910844fe6103";

const baseKey = "my_super_secret_email_key_9876";

const chars = ['', ' ', '  ', '   ', '\n', '\r', '\r\n', '\t'];
for (const prefix of chars) {
  for (const suffix of chars) {
    tryDecrypt(cipher1, prefix + baseKey + suffix);
  }
}
tryDecrypt(cipher1, "default_fallback_secret_key_1234");
tryDecrypt(cipher1, "default_fallback_secret_key_1234\n");
tryDecrypt(cipher1, "default_fallback_secret_key_1234\r\n");

console.log('No key worked.');

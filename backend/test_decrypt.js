require('dotenv').config();
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
    console.log("Success with key:", RAW_KEY, "->", decrypted.toString());
  } catch (error) {
    // ignore
  }
}

const cipher1 = "77943771f9041d62b60d94f2c3be560e:7d3c30bdf50d74065d2450762ed343491051e925daa425e7f06d910844fe6103";

tryDecrypt(cipher1, "my_super_secret_email_key_9876   ");


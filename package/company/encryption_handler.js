const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
let key = 'MySuperSecretKey';
key = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);

module.exports
    = class EncrpytionHandler {
        constructor() {

        }
        Encrypt = (buffer) => {
            // Create an initialization vector
            const iv = crypto.randomBytes(16);
            // Create a new cipher using the algorithm, key, and iv
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            // Create the new (encrypted) buffer
            const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
            return result;
        }
        Decrypt = (encrypted) => {
            // Get the iv: the first 16 bytes
            const iv = encrypted.slice(0, 16);
            // Get the rest
            encrypted = encrypted.slice(16);
            // Create a decipher
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            // Actually decrypt it
            const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            return result;
        }
    }

const plain = Buffer.from('Hello world');

const encrypted = encrypt(plain);
console.log('Encrypted:', encrypted.toString());

const decrypted = decrypt(encrypted);
console.log('Decrypted:', decrypted.toString());



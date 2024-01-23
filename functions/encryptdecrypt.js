import crypto from 'crypto';

const FIXED_IV = Buffer.from([0x40, 0x71, 0x13, 0x41, 0x2c, 0x82, 0x88, 0x1f, 0x9c, 0xff, 0x28, 0xa4, 0x0b, 0xda, 0x05, 0x95]);

// Function to encrypt text
function encrypt(text, salt) {
    const secretKey = crypto.createHash('md5').update(salt).digest();
    const cipher = crypto.createCipheriv('aes-128-cbc', secretKey, FIXED_IV);
    const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    return encrypted;
}

// Function to decrypt text
function decrypt(text, salt) {
    try {
        const secretKey = crypto.createHash('md5').update(salt).digest();
        const decipher = crypto.createDecipheriv('aes-128-cbc', secretKey, FIXED_IV);
        const decrypted = decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
        return decrypted;
    } catch (err) {
        return false;
    }
}

export { encrypt, decrypt };

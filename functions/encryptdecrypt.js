import crypto from 'crypto';

// Function to encrypt text
function encrypt(text, salt) {
    const secretKey = crypto.createHash('sha256').update(salt).digest();
    const iv = crypto.randomBytes(16); // Generate a random IV (initialization vector)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

// Function to decrypt text
function decrypt(text, salt) {
    const secretKey = crypto.createHash('sha256').update(salt).digest();
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export { encrypt, decrypt };

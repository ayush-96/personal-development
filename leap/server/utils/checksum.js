const crypto = require('crypto');
const fs = require('fs').promises;

/**
 * Calculate SHA-256 checksum of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} SHA-256 checksum in hex format (64 characters)
 */
async function calculateFileChecksum(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * Calculate SHA-256 checksum of a buffer
 * @param {Buffer} buffer - Buffer to hash
 * @returns {string} SHA-256 checksum in hex format (64 characters)
 */
function calculateBufferChecksum(buffer) {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    return hashSum.digest('hex');
}

module.exports = {
    calculateFileChecksum,
    calculateBufferChecksum
};


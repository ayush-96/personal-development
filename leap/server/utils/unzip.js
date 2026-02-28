const extract = require('extract-zip');
const fs = require('fs');
const path = require('path');

/**
 * unzip the zip file and remove the original file
 * @param {string} zipPath - the path of the zip file
 * @param {string} outputDir - the path of the output directory
 * @returns {Promise<void>} return resolved state, throw an error if failed
 */

async function extractAndRemoveZip(zipPath, outputDir) {
  try {
    await extract(zipPath, { dir: outputDir });
    await fs.promises.unlink(zipPath);
  } catch (err) {
    console.error('Error during unzip or remove:', err);
    throw err;
  }
}

module.exports = { extractAndRemoveZip };
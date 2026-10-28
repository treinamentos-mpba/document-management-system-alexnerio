const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const configuredStorageDirectory = process.env.STORAGE_DIR || 'storage';
const storageDirectory = path.isAbsolute(configuredStorageDirectory)
  ? configuredStorageDirectory
  : path.resolve(backendRoot, configuredStorageDirectory);

function positiveIntegerFromEnv(name, defaultValue) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }

  return value;
}

module.exports = {
  maxFileSizeBytes: positiveIntegerFromEnv('MAX_FILE_SIZE_BYTES', 10485760),
  storageDirectory,
};
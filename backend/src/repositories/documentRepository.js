const fs = require('node:fs');
const { access } = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const config = require('../config');

fs.mkdirSync(config.storageDirectory, { recursive: true });

const documents = new Map();

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    callback(null, config.storageDirectory);
  },
  filename(_request, _file, callback) {
    callback(null, randomUUID());
  },
});

function create(document) {
  documents.set(document.id, document);
  return { ...document };
}

function findAll() {
  return Array.from(documents.values(), (document) => ({ ...document }));
}

async function findDownloadById(id) {
  const document = documents.get(id);
  if (!document) {
    return null;
  }

  const filePath = path.join(config.storageDirectory, document.storageName);
  try {
    await access(filePath, fs.constants.R_OK);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }

  return { document: { ...document }, filePath };
}

module.exports = {
  create,
  findAll,
  findDownloadById,
  storage,
};
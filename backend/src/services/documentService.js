const path = require('node:path');
const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function toPublicDocument(document) {
  const { storageName, mimeType, ...publicDocument } = document;
  return publicDocument;
}

function createDocument(file, owner) {
  const originalName = path.basename(file.originalname.replace(/\\/g, '/')) || 'document';
  const document = documentRepository.create({
    id: randomUUID(),
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: typeof owner === 'string' && owner.length > 0 ? owner : null,
    storageName: file.filename,
    mimeType: file.mimetype,
  });

  return toPublicDocument(document);
}

function listDocuments() {
  return documentRepository
    .findAll()
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
    .map(toPublicDocument);
}

async function findDownloadById(id) {
  try {
    const result = await documentRepository.findDownloadById(id);
    if (!result) {
      return null;
    }

    return {
      document: toPublicDocument(result.document),
      filePath: result.filePath,
      mimeType: result.document.mimeType,
    };
  } catch (error) {
    error.code = 'STORAGE_ERROR';
    throw error;
  }
}

module.exports = {
  createDocument,
  findDownloadById,
  listDocuments,
};
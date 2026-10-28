const documentService = require('../services/documentService');

function sendError(response, status, code, message) {
  return response.status(status).json({
    error: { code, message },
  });
}

function upload(request, response) {
  if (!request.file) {
    return sendError(response, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  const document = documentService.createDocument(request.file, request.body.owner);
  return response.status(201).json({ data: document });
}

function list(_request, response) {
  return response.status(200).json({ data: documentService.listDocuments() });
}

async function download(request, response, next) {
  const result = await documentService.findDownloadById(request.params.id);
  if (!result) {
    return sendError(response, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  const mimeTypePattern = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i;
  const mimeType = mimeTypePattern.test(result.mimeType || '')
    ? result.mimeType
    : 'application/octet-stream';

  response.setHeader('Content-Type', mimeType);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  return response.download(result.filePath, result.document.originalName, (error) => {
    if (!error) {
      return;
    }
    if (error.code === 'ENOENT' && !response.headersSent) {
      sendError(response, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      return;
    }
    if (response.headersSent) {
      response.destroy(error);
      return;
    }

    error.code = 'STORAGE_ERROR';
    next(error);
  });
}

module.exports = {
  download,
  list,
  upload,
};
const express = require('express');
const multer = require('multer');
const config = require('../config');
const documentController = require('../controllers/documentController');
const documentRepository = require('../repositories/documentRepository');

const router = express.Router();
const uploadFile = multer({
  storage: documentRepository.storage,
  limits: { fileSize: config.maxFileSizeBytes },
}).single('file');

function receiveUpload(request, response, next) {
  uploadFile(request, response, (error) => {
    if (!error) {
      next();
      return;
    }
    if (!(error instanceof multer.MulterError)) {
      error.code = 'STORAGE_ERROR';
    }
    next(error);
  });
}

router.post('/upload', receiveUpload, documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;
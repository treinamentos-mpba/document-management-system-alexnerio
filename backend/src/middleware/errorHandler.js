const multer = require('multer');

function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return response.status(413).json({
        error: { code: 'FILE_TOO_LARGE', message: 'O arquivo excede o limite permitido.' },
      });
    }

    return response.status(400).json({
      error: { code: 'INVALID_UPLOAD', message: 'A requisição de upload é inválida.' },
    });
  }

  if (error.code === 'STORAGE_ERROR' || error.syscall) {
    return response.status(500).json({
      error: { code: 'STORAGE_ERROR', message: 'Não foi possível acessar o armazenamento.' },
    });
  }

  return response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno.' },
  });
}

module.exports = errorHandler;
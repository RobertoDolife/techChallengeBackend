const ApiError = require('../utils/ApiError');

/**
 * Middleware para tratamento centralizado de erros
 * Deve ser o último middleware da aplicação
 */
const errorHandler = (err, req, res, next) => {
  // Log do erro para debug
  console.error('🚨 Erro capturado:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Se for um ApiError customizado
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Erros do Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      error: 'Erro de validação',
      details: errors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Registro duplicado',
      details: err.errors.map(e => e.message)
    });
  }

  // Erros do JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expirado'
    });
  }

  // Erros do Multer
  if (err.name === 'MulterError') {
    let message = 'Erro no upload do arquivo';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Arquivo muito grande. Máximo: 5MB';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Muitos arquivos';
    }
    return res.status(400).json({
      success: false,
      error: message
    });
  }

  // Erro genérico (500)
  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      message: err.message,
      stack: err.stack 
    })
  });
};

/**
 * Middleware para capturar erros assíncronos
 * Wrapper para funções async
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  asyncHandler
};

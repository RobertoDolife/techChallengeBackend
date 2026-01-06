const jwt = require('jsonwebtoken');
const { env } = require('../common/env');
const ApiError = require('../utils/ApiError');

/**
 * Middleware que verifica se o usuário está autenticado
 */
exports.verificarToken = (req, res, next) => {
  try {
    // Buscar token no header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw ApiError.unauthorized('Token não fornecido');
    }

    // Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw ApiError.unauthorized('Formato de token inválido');
    }

    const token = parts[1];

    // Verificar e decodificar token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Adicionar dados do usuário na requisição
    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      admin: decoded.admin
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expirado'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Token inválido'));
    }
    next(err);
  }
};

/**
 * Middleware que verifica se o usuário é admin
 */
exports.verificarAdmin = (req, res, next) => {
  if (!req.usuario || !req.usuario.admin) {
    return next(ApiError.forbidden('Acesso negado. Apenas administradores.'));
  }
  next();
};

/**
 * Middleware que verifica se o usuário é dono do recurso ou admin
 */
exports.verificarProprietario = (model) => {
  return async (req, res, next) => {
    try {
      const recursoId = req.params.id;
      const recurso = await model.findByPk(recursoId);

      if (!recurso) {
        throw ApiError.notFound('Recurso não encontrado');
      }

      // Admin pode tudo
      if (req.usuario.admin) {
        return next();
      }

      // Verifica se é o dono
      if (recurso.usuario_id !== req.usuario.id) {
        throw ApiError.forbidden('Você não tem permissão para modificar este recurso');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

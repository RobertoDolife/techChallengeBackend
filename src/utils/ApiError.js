/**
 * Classe customizada para erros da API
 * Facilita o tratamento e padronização de erros
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Erros de validação (400)
   */
  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  /**
   * Erros de autenticação (401)
   */
  static unauthorized(message = 'Não autorizado') {
    return new ApiError(401, message);
  }

  /**
   * Erros de permissão (403)
   */
  static forbidden(message = 'Acesso negado') {
    return new ApiError(403, message);
  }

  /**
   * Erros de recurso não encontrado (404)
   */
  static notFound(message = 'Recurso não encontrado') {
    return new ApiError(404, message);
  }

  /**
   * Erros de conflito (409)
   */
  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  /**
   * Erros internos do servidor (500)
   */
  static internal(message = 'Erro interno do servidor', details = null) {
    return new ApiError(500, message, details);
  }
}

module.exports = ApiError;

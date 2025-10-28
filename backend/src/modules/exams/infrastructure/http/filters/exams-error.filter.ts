import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestError,
  InternalServerError,
} from '../../../../../shared/handler/errors';
import {
  responseBadRequest,
  responseUnauthorized,
  responseForbidden,
  responseNotFound,
  responseConflict,
  responseTooManyRequest,
  responseInternalServerError,
} from '../../../../../shared/handler/http.handler';

@Catch() 
export class ExamsErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExamsErrorFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const cid = (req.headers['x-correlation-id'] as string) ?? '';
    const path = (req as any).originalUrl || req.url || '';

    if (exception instanceof BadRequestError) {
      this.logger.warn(`[${cid}] BadRequestError: ${exception.message} - ${path}`);
      return res.status(HttpStatus.BAD_REQUEST)
        .json(responseBadRequest(exception.message, cid, 'Error en validacion', path));
    }
    if (exception instanceof UnauthorizedError) {
      this.logger.warn(`[${cid}] UnauthorizedError: ${exception.message} - ${path}`);
      return res.status(HttpStatus.UNAUTHORIZED)
        .json(responseUnauthorized(exception.message, cid, 'Falta token o inválido', path));
    }
    if (exception instanceof ForbiddenError) {
      this.logger.warn(`[${cid}] ForbiddenError: ${exception.message} - ${path}`);
      return res.status(HttpStatus.FORBIDDEN)
        .json(responseForbidden(exception.message, cid, 'Acceso denegado', path));
    }
    if (exception instanceof NotFoundError) {
      this.logger.warn(`[${cid}] NotFoundError: ${exception.message} - ${path}`);
      return res.status(HttpStatus.NOT_FOUND)
        .json(responseNotFound(exception.message, cid, 'Recurso no encontrado', path));
    }
    if (exception instanceof ConflictError) {
      this.logger.warn(`[${cid}] ConflictError: ${exception.message} - ${path}`);
      return res.status(HttpStatus.CONFLICT)
        .json(responseConflict(exception.message, cid, 'Conflicto', path));
    }
    if (exception instanceof TooManyRequestError) {
      this.logger.warn(`[${cid}] TooManyRequestError: ${exception.message} - ${path}`);
      return res.status(HttpStatus.TOO_MANY_REQUESTS)
        .json(responseTooManyRequest(exception.message, cid, 'Demasiadas solicitudes', path));
    }
    if (exception instanceof InternalServerError) {
      this.logger.error(`[${cid}] InternalServerError: ${exception.message} - ${path}`, exception.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(responseInternalServerError(exception.message, cid, 'Error interno', path));
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus?.() ?? 500;
      const payload = exception.getResponse?.() as any;
      const message = (Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message) || exception.message || 'Error';

      this.logger.warn(`[${cid}] HttpException(${status}): ${message} - ${path}`);

      if (status === 400) return res.status(400).json(responseBadRequest(message, cid, 'Error en validacion', path));
      if (status === 401) return res.status(401).json(responseUnauthorized(message, cid, 'Falta token o inválido', path));
      if (status === 403) return res.status(403).json(responseForbidden(message, cid, 'Acceso denegado', path));
      if (status === 404) return res.status(404).json(responseNotFound(message, cid, 'Recurso no encontrado', path));
      if (status === 409) return res.status(409).json(responseConflict(message, cid, 'Conflicto', path));
      if (status === 429) return res.status(429).json(responseTooManyRequest(message, cid, 'Demasiadas solicitudes', path));
      return res.status(500).json(responseInternalServerError(message, cid, 'Error interno', path));
    }

    const msg = (exception?.message ?? 'Error interno').toString();
    this.logger.error(`[${cid}] UnhandledException: ${msg} - ${path}`, exception?.stack);
    return res.status(500).json(responseInternalServerError(msg, cid, 'Error interno', path));
  }
}

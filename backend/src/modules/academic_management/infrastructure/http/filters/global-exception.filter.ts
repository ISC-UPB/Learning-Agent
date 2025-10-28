import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
  responseAlreadyCreated,
  responseConflict,
  responseForbidden,
  responseInternalServerError,
  responseNotFound,
} from 'src/shared/handler/http.handler';

import {
  AlreadyCreatedError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'src/shared/handler/errors';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const path = request.url;
    const description = `${request.method} ${request.url}`;
    const message = exception.message || 'Unexpected error';

    
    this.logger.error(
      `[${request.method}] ${request.url} -> ${message}`,
      exception.stack,
    );

    
    if (exception instanceof NotFoundError) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .json(responseNotFound(message, 'Sin implementar', description, path));
    }

    if (exception instanceof ForbiddenError) {
      return response
        .status(HttpStatus.FORBIDDEN)
        .json(responseForbidden(message, 'Sin implementar', description, path));
    }

    if (exception instanceof ConflictError) {
      return response
        .status(HttpStatus.CONFLICT)
        .json(responseConflict(message, 'Sin implementar', description, path));
    }

    if (exception instanceof AlreadyCreatedError) {
      return response
        .status(HttpStatus.CONFLICT)
        .json(responseAlreadyCreated(message, 'Sin implementar', description, path));
    }

    
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();
      return response.status(status).json({
        statusCode: status,
        message: (errorResponse as any).message || message,
        description,
        path,
      });
    }

    
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        responseInternalServerError(message, 'Sin implementar', description, path),
      );
  }
}

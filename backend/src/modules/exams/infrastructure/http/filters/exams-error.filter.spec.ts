import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ExamsErrorFilter } from '../filters/exams-error.filter';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from '../../../../../shared/handler/errors';

describe('ExamsErrorFilter', () => {
  let filter: ExamsErrorFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExamsErrorFilter],
    }).compile();

    filter = module.get<ExamsErrorFilter>(ExamsErrorFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      headers: { 'x-correlation-id': 'test-cid' },
      url: '/api/exams',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as ArgumentsHost;
  });

  it('should handle BadRequestError with 400 status', () => {
    const error = new BadRequestError('Invalid input');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid input',
        error: 'Error en validacion',
      })
    );
  });

  it('should handle NotFoundError with 404 status', () => {
    const error = new NotFoundError('Exam not found');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Exam not found',
        error: 'Recurso no encontrado',
      })
    );
  });

  it('should handle ConflictError with 409 status', () => {
    const error = new ConflictError('Exam already exists');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: 'Exam already exists',
        error: 'Conflicto',
      })
    );
  });

  it('should handle UnauthorizedError with 401 status', () => {
    const error = new UnauthorizedError('Invalid token');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid token',
        error: 'Falta token o inválido',
      })
    );
  });

  it('should handle ForbiddenError with 403 status', () => {
    const error = new ForbiddenError('Access denied');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Access denied',
        error: 'Acceso denegado',
      })
    );
  });

  it('should handle generic errors with 500 status', () => {
    const error = new Error('Unexpected error');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Unexpected error',
        error: 'Error interno',
      })
    );
  });

  it('should use correlation id from headers', () => {
    const error = new BadRequestError('Test error');
    mockRequest.headers = { 'x-correlation-id': 'custom-cid' };

    filter.catch(error, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'custom-cid',
      })
    );
  });

  it('should handle missing correlation id', () => {
    const error = new BadRequestError('Test error');
    mockRequest.headers = {};

    filter.catch(error, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: '',
      })
    );
  });
});
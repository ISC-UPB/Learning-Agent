import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

export class RepositoryErrorHandler {
  static handle(error: any, context: string): never {
    const code = error?.code;

    switch (code) {
      case 'P2002':
        throw new ConflictException(`${context}: registro duplicado.`);
      case 'P2003':
        throw new BadRequestException(`${context}: referencia inexistente.`);
      case 'P2025':
        throw new NotFoundException(`${context}: registro no encontrado.`);
      default:
        throw new InternalServerErrorException(
          `${context}: error inesperado.`,
        );
    }
  }
}

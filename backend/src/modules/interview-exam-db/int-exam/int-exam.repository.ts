import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
  CreateInterviewQuestionDto,
  UpdateInterviewQuestionDto,
} from '../dtos/interview-exam.dto';
import { IntExamRepositoryPort } from '../domain/ports/int-exam.repository.port';
import { RepositoryErrorHandler } from '../infrastructure/persistence/repository-error.handler';

@Injectable()
export class IntExamRepository implements IntExamRepositoryPort {
  private readonly logger = new Logger(IntExamRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createInterviewQuestionDto: CreateInterviewQuestionDto) {
    try {
      const question = await this.prisma.interviewQuestion.create({
        data: {
          courseId: createInterviewQuestionDto.courseId,
          docId: createInterviewQuestionDto.docId,
          json: createInterviewQuestionDto.json,
          type: createInterviewQuestionDto.type,
        },
        include: {
          course: true,
          document: true,
        },
      });

      this.logger.log(`Pregunta de entrevista creada: ${question.id}`);
      return question;
    } catch (error) {
      this.logger.error('Error al crear pregunta de entrevista', error.stack);
      RepositoryErrorHandler.handle(error, 'IntExamRepository.create');
    }
  }

  async findAll() {
    this.logger.log('Obteniendo todas las preguntas de entrevista');
    return this.prisma.interviewQuestion.findMany({
      include: {
        course: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    this.logger.log(`Buscando pregunta de entrevista con ID ${id}`);
    const question = await this.prisma.interviewQuestion.findUnique({
      where: { id },
      include: {
        course: true,
        document: true,
      },
    });

    if (!question) {
      this.logger.warn(`Pregunta con ID ${id} no encontrada`);
      RepositoryErrorHandler.handle({ code: 'P2025' }, 'IntExamRepository.findOne');
    }

    return question;
  }

  async findByCourseId(courseId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    this.logger.log(`Buscando preguntas por curso ${courseId}`);

    const [questions, total] = await Promise.all([
      this.prisma.interviewQuestion.findMany({
        where: { courseId },
        include: { course: true, document: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.interviewQuestion.count({ where: { courseId } }),
    ]);

    return {
      data: questions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByDocId(docId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    this.logger.log(`Buscando preguntas por documento ${docId}`);

    const [questions, total] = await Promise.all([
      this.prisma.interviewQuestion.findMany({
        where: { docId },
        include: { course: true, document: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.interviewQuestion.count({ where: { docId } }),
    ]);

    return {
      data: questions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByCourseAndDocument(courseId: string, docId: string) {
    this.logger.log(`Buscando preguntas por curso ${courseId} y documento ${docId}`);
    return this.prisma.interviewQuestion.findMany({
      where: { courseId, docId },
      include: { course: true, document: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCourseAndDocumentAndType(courseId: string, docId: string, type: string) {
    this.logger.log(`Buscando preguntas por curso ${courseId}, documento ${docId} y tipo ${type}`);
    return this.prisma.interviewQuestion.findMany({
      where: { courseId, docId, type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateInterviewQuestionDto: UpdateInterviewQuestionDto) {
    try {
      const updated = await this.prisma.interviewQuestion.update({
        where: { id },
        data: {
          json: updateInterviewQuestionDto.json,
          lastUsedAt: updateInterviewQuestionDto.lastUsedAt,
        },
        include: { course: true, document: true },
      });

      this.logger.log(`Pregunta de entrevista actualizada: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error al actualizar pregunta ${id}`, error.stack);
      RepositoryErrorHandler.handle(error, 'IntExamRepository.update');
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.prisma.interviewQuestion.delete({ where: { id } });
      this.logger.log(`Pregunta de entrevista eliminada: ${id}`);
      return deleted;
    } catch (error) {
      this.logger.error(`Error al eliminar pregunta ${id}`, error.stack);
      RepositoryErrorHandler.handle(error, 'IntExamRepository.remove');
    }
  }

  async markAsUsed(id: string) {
    try {
      const updated = await this.prisma.interviewQuestion.update({
        where: { id },
        data: { lastUsedAt: new Date() },
        include: { course: true, document: true },
      });

      this.logger.log(`Pregunta marcada como usada: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error al marcar pregunta ${id} como usada`, error.stack);
      RepositoryErrorHandler.handle(error, 'IntExamRepository.markAsUsed');
    }
  }

  async getRecentlyUsed(limit = 10) {
    this.logger.log('Obteniendo preguntas usadas recientemente');
    return this.prisma.interviewQuestion.findMany({
      where: { lastUsedAt: { not: null } },
      include: { course: true, document: true },
      orderBy: { lastUsedAt: 'desc' },
      take: limit,
    });
  }

  async getRecent(limit = 10) {
    this.logger.log('Obteniendo preguntas más recientes');
    return this.prisma.interviewQuestion.findMany({
      include: { course: true, document: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

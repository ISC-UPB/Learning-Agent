import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
  CreateChatHistoryDto,
  UpdateChatHistoryDto,
} from '../dtos/interview-exam.dto';
import { RepositoryErrorHandler } from '../infrastructure/persistence/repository-error.handler';

@Injectable()
export class ChatHistoryRepository {
  private readonly logger = new Logger(ChatHistoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createChatHistoryDto: CreateChatHistoryDto) {
    try {
      const record = await this.prisma.chatHistory.create({
        data: {
          studentId: createChatHistoryDto.studentId,
          docId: createChatHistoryDto.docId,
          question: createChatHistoryDto.question,
          response: createChatHistoryDto.response,
          uses: 1,
        },
        include: {
          student: true,
          document: true,
        },
      });

      this.logger.log(`ChatHistory creado: ${record.id}`);
      return record;
    } catch (error) {
      this.logger.error('Error al crear ChatHistory', error.stack);
      RepositoryErrorHandler.handle(error, 'ChatHistoryRepository.create');
    }
  }

  async findAll() {
    this.logger.log('Obteniendo todas las preguntas de ChatHistory');
    return this.prisma.chatHistory.findMany({
      include: {
        student: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.chatHistory.findUnique({
      where: { id },
      include: {
        student: true,
        document: true,
      },
    });

    if (!question) {
      this.logger.warn(`ChatHistory con ID ${id} no encontrado`);
      RepositoryErrorHandler.handle({ code: 'P2025' }, 'ChatHistoryRepository.findOne');
    }

    return question;
  }

  async findByStudentId(studentId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    this.logger.log(`Buscando ChatHistory por estudiante ${studentId}`);

    const [questions, total] = await Promise.all([
      this.prisma.chatHistory.findMany({
        where: { studentId },
        include: { student: true, document: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatHistory.count({ where: { studentId } }),
    ]);

    return {
      data: questions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByDocId(docId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    this.logger.log(`Buscando ChatHistory por documento ${docId}`);

    const [questions, total] = await Promise.all([
      this.prisma.chatHistory.findMany({
        where: { docId },
        include: { student: true, document: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatHistory.count({ where: { docId } }),
    ]);

    return {
      data: questions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByStudentAndDocument(studentId: string, docId: string) {
    this.logger.log(`Buscando ChatHistory por estudiante ${studentId} y documento ${docId}`);
    return this.prisma.chatHistory.findMany({
      where: { studentId, docId },
      include: { student: true, document: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByQuestion(question: string) {
    this.logger.log(`Buscando ChatHistory por pregunta "${question}"`);
    return this.prisma.chatHistory.findFirst({
      where: { question },
      include: { student: true, document: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateChatHistoryDto: UpdateChatHistoryDto) {
    try {
      const updated = await this.prisma.chatHistory.update({
        where: { id },
        data: { uses: updateChatHistoryDto.uses },
        include: { student: true, document: true },
      });

      this.logger.log(`ChatHistory actualizado: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error al actualizar ChatHistory ${id}`, error.stack);
      RepositoryErrorHandler.handle(error, 'ChatHistoryRepository.update');
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.prisma.chatHistory.delete({ where: { id } });
      this.logger.log(`ChatHistory eliminado: ${id}`);
      return deleted;
    } catch (error) {
      this.logger.error(`Error al eliminar ChatHistory ${id}`, error.stack);
      RepositoryErrorHandler.handle(error, 'ChatHistoryRepository.remove');
    }
  }

  async markAsUsed(id: string) {
    try {
      const updated = await this.prisma.chatHistory.update({
        where: { id },
        data: { lastUsedAt: new Date() },
        include: { student: true, document: true },
      });

      this.logger.log(`ChatHistory marcado como usado: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error al marcar ChatHistory ${id} como usado`, error.stack);
      RepositoryErrorHandler.handle(error, 'ChatHistoryRepository.markAsUsed');
    }
  }

  async getRecentlyUsed(limit = 10) {
    this.logger.log('Obteniendo ChatHistory usados recientemente');
    return this.prisma.chatHistory.findMany({
      where: { lastUsedAt: { not: null } },
      include: { student: true, document: true },
      orderBy: { lastUsedAt: 'desc' },
      take: limit,
    });
  }

  async getRecent(limit = 10) {
    this.logger.log('Obteniendo ChatHistory recientes');
    return this.prisma.chatHistory.findMany({
      include: { student: true, document: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async cleanupOldChatHistory(days = 7): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    this.logger.log(`Iniciando limpieza de ChatHistory anterior a ${cutoffDate.toISOString()}`);

    try {
      const result = await this.prisma.chatHistory.deleteMany({
        where: {
          OR: [
            { createdAt: { lt: cutoffDate } },
            { uses: { gte: 100 } },
          ],
        },
      });

      this.logger.log(`Limpieza completada: ${result.count} registros eliminados`);
      return { deletedCount: result.count };
    } catch (error) {
      this.logger.error('Error en limpieza de ChatHistory', error.stack);
      RepositoryErrorHandler.handle(error, 'ChatHistoryRepository.cleanupOldChatHistory');
    }
  }
}

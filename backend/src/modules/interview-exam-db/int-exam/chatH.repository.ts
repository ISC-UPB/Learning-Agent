import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
  CreateChatHistoryDto,
  UpdateChatHistoryDto,
} from '../dtos/interview-exam.dto';

@Injectable()
export class ChatHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createChatHistoryDto: CreateChatHistoryDto) {
    try {
      return await this.prisma.chatHistory.create({
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
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe una pregunta de entrevista con estos datos',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'El curso o documento referenciado no existe',
        );
      }
      throw error;
    }
  }

  async findAll() {
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
      throw new NotFoundException(
        `Pregunta de entrevista con ID ${id} no encontrada`,
      );
    }

    return question;
  }

  async findByStudentId(studentId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      this.prisma.chatHistory.findMany({
        where: { studentId },
        include: {
          student: true,
          document: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatHistory.count({ where: { studentId } }),
    ]);

    return {
      data: questions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByDocId(docId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      this.prisma.chatHistory.findMany({
        where: { docId },
        include: {
          student: true,
          document: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatHistory.count({ where: { docId } }),
    ]);

    return {
      data: questions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByStudentAndDocument(studentId: string, docId: string) {
    return this.prisma.chatHistory.findMany({
      where: {
        studentId,
        docId,
      },
      include: {
        student: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findByQuestion(question: string) {
    return this.prisma.chatHistory.findFirst({
      where: {
        question,
      },
      include: {
        student: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async update(id: string, updateChatHistoryDto: UpdateChatHistoryDto) {
    try {
      return await this.prisma.chatHistory.update({
        where: { id },
        data: {
          uses: updateChatHistoryDto.uses
        },
        include: {
          student: true,
          document: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Usos con el ID ${id} no encontrada`,
        );
      }
      throw error;
    }
  }
  async remove(id: string) {
    try {
      return await this.prisma.chatHistory.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Pregunta de chat con ID ${id} no encontrada`,
        );
      }
      throw error;
    }
  }

  async markAsUsed(id: string) {
    try {
      return await this.prisma.chatHistory.update({
        where: { id },
        data: {
          lastUsedAt: new Date(),
        },
        include: {
          student: true,
          document: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Pregunta de chat con ID ${id} no encontrada`,
        );
      }
      throw error;
    }
  }

  async getRecentlyUsed(limit: number = 10) {
    return this.prisma.chatHistory.findMany({
      where: {
        lastUsedAt: {
          not: null,
        },
      },
      include: {
        student: true,
        document: true,
      },
      orderBy: { lastUsedAt: 'desc' },
      take: limit,
    });
  }

  async getRecent(limit: number = 10) {
    return this.prisma.chatHistory.findMany({
      include: {
        student: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
   async cleanupOldChatHistory(days: number = 7): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    console.log(`Eliminando chatHistory anterior a: ${cutoffDate.toISOString()}`);

    try {
      const result = await this.prisma.chatHistory.deleteMany({
        where: {
          OR: [
            {
              createdAt: {
                lt: cutoffDate, 
              }
            },
            {
              uses: {
                gte: 100,
              }
            }
          ]
        },
      });

      console.log(`Limpieza completada: ${result.count} registros eliminados`);

      return { deletedCount: result.count };
    } catch (error) {
      console.error('Error en limpieza de chatHistory:', error);
      throw error;
    }
  }
}

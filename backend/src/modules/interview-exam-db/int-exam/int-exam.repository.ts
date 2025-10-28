import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
  CreateInterviewQuestionDto,
  UpdateInterviewQuestionDto,
} from '../dtos/interview-exam.dto';

@Injectable()
export class IntExamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInterviewQuestionDto: CreateInterviewQuestionDto) {
    try {
      return await this.prisma.interviewQuestion.create({
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
    return this.prisma.interviewQuestion.findMany({
      include: {
        course: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.interviewQuestion.findUnique({
      where: { id },
      include: {
        course: true,
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

  async findByCourseId(courseId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      this.prisma.interviewQuestion.findMany({
        where: { courseId },
        include: {
          course: true,
          document: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.interviewQuestion.count({ where: { courseId } }),
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
      this.prisma.interviewQuestion.findMany({
        where: { docId },
        include: {
          course: true,
          document: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.interviewQuestion.count({ where: { docId } }),
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

  async findByCourseAndDocument(courseId: string, docId: string) {
    return this.prisma.interviewQuestion.findMany({
      where: {
        courseId,
        docId,
      },
      include: {
        course: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    updateInterviewQuestionDto: UpdateInterviewQuestionDto,
  ) {
    try {
      return await this.prisma.interviewQuestion.update({
        where: { id },
        data: {
          json: updateInterviewQuestionDto.json,
          lastUsedAt: updateInterviewQuestionDto.lastUsedAt,
        },
        include: {
          course: true,
          document: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Pregunta de entrevista con ID ${id} no encontrada`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.interviewQuestion.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Pregunta de entrevista con ID ${id} no encontrada`,
        );
      }
      throw error;
    }
  }

  async markAsUsed(id: string) {
    try {
      return await this.prisma.interviewQuestion.update({
        where: { id },
        data: {
          lastUsedAt: new Date(),
        },
        include: {
          course: true,
          document: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Pregunta de entrevista con ID ${id} no encontrada`,
        );
      }
      throw error;
    }
  }

  async getRecentlyUsed(limit: number = 10) {
    return this.prisma.interviewQuestion.findMany({
      where: {
        lastUsedAt: {
          not: null,
        },
      },
      include: {
        course: true,
        document: true,
      },
      orderBy: { lastUsedAt: 'desc' },
      take: limit,
    });
  }

  async getRecent(limit: number = 10) {
    return this.prisma.interviewQuestion.findMany({
      include: {
        course: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
  async findByCourseAndDocumentAndType(courseId: string, docId: string, type: string) {
    return this.prisma.interviewQuestion.findMany({
      where: {
        courseId,
        docId,
        type,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { InterviewQuestion } from '../../domain/entities/interview-question.entity';
import { InterviewQuestionMapper, InterviewQuestionRawData } from '../../domain/mappers/interview-question.mapper';
import { InterviewQuestionRepositoryPort } from '../../domain/ports/interview-question.repository.port';
import {
  CreateInterviewQuestionDto,
  UpdateInterviewQuestionDto,
} from '../../dtos/interview-exam.dto';

@Injectable()
export class PrismaInterviewQuestionRepository implements InterviewQuestionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(question: InterviewQuestion): Promise<InterviewQuestion> {
    try {
      const rawData = InterviewQuestionMapper.toPersistence(question);
      const created = await this.prisma.interviewQuestion.create({
        data: {
          id: rawData.id,
          courseId: rawData.courseId,
          docId: rawData.docId,
          type: rawData.type,
          json: rawData.json as any,
          lastUsedAt: rawData.lastUsedAt,
          createdAt: rawData.createdAt,
        },
        include: {
          course: true,
          document: true,
        },
      }) as InterviewQuestionRawData;
      return InterviewQuestionMapper.toDomain(created);
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

  async findAll(): Promise<InterviewQuestion[]> {
    const questions = await this.prisma.interviewQuestion.findMany({
      include: {
        course: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as InterviewQuestionRawData[];
    return InterviewQuestionMapper.toDomainArray(questions);
  }

  async findOne(id: string): Promise<InterviewQuestion> {
    const question = await this.prisma.interviewQuestion.findUnique({
      where: { id },
      include: {
        course: true,
        document: true,
      },
    }) as InterviewQuestionRawData;

    if (!question) {
      throw new NotFoundException(
        `Pregunta de entrevista con ID ${id} no encontrada`,
      );
    }

    return InterviewQuestionMapper.toDomain(question);
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
      }) as Promise<InterviewQuestionRawData[]>,
      this.prisma.interviewQuestion.count({ where: { courseId } }),
    ]);

    return {
      data: InterviewQuestionMapper.toDomainArray(questions),
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
      }) as Promise<InterviewQuestionRawData[]>,
      this.prisma.interviewQuestion.count({ where: { docId } }),
    ]);

    return {
      data: InterviewQuestionMapper.toDomainArray(questions),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByCourseAndDocument(courseId: string, docId: string): Promise<InterviewQuestion[]> {
    const questions = await this.prisma.interviewQuestion.findMany({
      where: {
        courseId,
        docId,
      },
      include: {
        course: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as InterviewQuestionRawData[];
    return InterviewQuestionMapper.toDomainArray(questions);
  }

  async update(id: string, questionData: Partial<InterviewQuestion>): Promise<InterviewQuestion> {
    try {
      const updated = await this.prisma.interviewQuestion.update({
        where: { id },
        data: {
          json: questionData.json,
          lastUsedAt: questionData.lastUsedAt,
        },
        include: {
          course: true,
          document: true,
        },
      }) as InterviewQuestionRawData;
      return InterviewQuestionMapper.toDomain(updated);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Pregunta de entrevista con ID ${id} no encontrada`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.interviewQuestion.delete({
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

  async markAsUsed(id: string): Promise<InterviewQuestion> {
    try {
      const updated = await this.prisma.interviewQuestion.update({
        where: { id },
        data: {
          lastUsedAt: new Date(),
        },
        include: {
          course: true,
          document: true,
        },
      }) as InterviewQuestionRawData;
      return InterviewQuestionMapper.toDomain(updated);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Pregunta de entrevista con ID ${id} no encontrada`,
        );
      }
      throw error;
    }
  }

  async getRecentlyUsed(limit: number = 10): Promise<InterviewQuestion[]> {
    const questions = await this.prisma.interviewQuestion.findMany({
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
    }) as InterviewQuestionRawData[];
    return InterviewQuestionMapper.toDomainArray(questions);
  }

  async getRecent(limit: number = 10): Promise<InterviewQuestion[]> {
    const questions = await this.prisma.interviewQuestion.findMany({
      include: {
        course: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as InterviewQuestionRawData[];
    return InterviewQuestionMapper.toDomainArray(questions);
  }

  async findByCourseAndDocumentAndType(courseId: string, docId: string, type: string): Promise<InterviewQuestion[]> {
    const questions = await this.prisma.interviewQuestion.findMany({
      where: {
        courseId,
        docId,
        type,
      },
      include: {
        course: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as InterviewQuestionRawData[];
    return InterviewQuestionMapper.toDomainArray(questions);
  }
}
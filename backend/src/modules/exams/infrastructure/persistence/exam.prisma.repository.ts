import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { ExamRepositoryPort } from '../../domain/ports/exam.repository.port';
import { Exam } from '../../domain/entities/exam.entity';
import { ExamFactory } from '../../domain/factories/exam.factory';
import { ExamStatus } from '../../domain/constants/exam.constants';
import { DistributionDto } from '../../infrastructure/http/dtos/distribution.dto';
import { DocumentChunkDto } from '../../infrastructure/http/dtos/document-chunk.dto';

@Injectable()
export class PrismaExamRepository implements ExamRepositoryPort {
  private readonly logger = new Logger(PrismaExamRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(exam: Exam): Promise<Exam> {
    const created = await this.prisma.exam.create({
      data: {
        id: exam.id,
        title: exam.title,
        status: exam.status,
        classId: exam.classId,
        difficulty: exam.difficulty.getValue(),
        attempts: exam.attempts.getValue(),
        timeMinutes: exam.timeMinutes.getValue(),
        reference: exam.reference,
      },
    });

    return ExamFactory.rehydrate({
      id: created.id,
      title: created.title,
      status: created.status as ExamStatus,
      classId: created.classId,
      difficulty: created.difficulty,
      attempts: created.attempts,
      timeMinutes: created.timeMinutes,
      reference: created.reference,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  async createExamWithDependencies(data: {
    exam: Exam;
    distributions: DistributionDto[];
    chunks: DocumentChunkDto[];
  }): Promise<Exam> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.exam.create({
        data: {
          id: data.exam.id,
          title: data.exam.title,
          status: data.exam.status,
          classId: data.exam.classId,
          difficulty: data.exam.difficulty.getValue(),
          attempts: data.exam.attempts.getValue(),
          timeMinutes: data.exam.timeMinutes.getValue(),
          reference: data.exam.reference,
        },
      });

      if (data.distributions.length > 0) {
        await (tx as any).examDistribution.createMany({
          data: data.distributions.map((d) => ({
            ...d,
            examId: created.id,
          })),
        });
      }


      if (data.chunks.length > 0) {
        await tx.documentChunk.createMany({
          data: data.chunks.map((c) => ({
            ...c,
            examId: created.id,
          })),
        });
      }

      return ExamFactory.rehydrate({
        id: created.id,
        title: created.title,
        status: created.status as ExamStatus,
        classId: created.classId,
        difficulty: created.difficulty,
        attempts: created.attempts,
        timeMinutes: created.timeMinutes,
        reference: created.reference,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  }

  async findByIdOwned(id: string, teacherId: string): Promise<Exam | null> {
    const found = await this.prisma.exam.findFirst({
      where: {
        id,
        class: { course: { teacherId } },
      },
    });

    if (!found) return null;

    return ExamFactory.rehydrate({
      id: found.id,
      title: found.title,
      status: found.status as ExamStatus,
      classId: found.classId,
      difficulty: found.difficulty,
      attempts: found.attempts,
      timeMinutes: found.timeMinutes,
      reference: found.reference,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    });
  }

  async listByClassOwned(classId: string, teacherId: string): Promise<Exam[]> {
    const rows = await this.prisma.exam.findMany({
      where: {
        classId,
        class: { course: { teacherId } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return rows.map((r) =>
      ExamFactory.rehydrate({
        id: r.id,
        title: r.title,
        status: r.status as ExamStatus,
        classId: r.classId,
        difficulty: r.difficulty,
        attempts: r.attempts,
        timeMinutes: r.timeMinutes,
        reference: r.reference,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }),
    );
  }

  async updateMetaOwned(
    id: string,
    teacherId: string,
    patch: Partial<Pick<Exam, 'title' | 'status' | 'classId'>>,
  ): Promise<Exam> {
    const owned = await this.prisma.exam.findFirst({
      where: { id, class: { course: { teacherId } } },
      select: { id: true, classId: true },
    });

    if (!owned) {
      this.logger.warn(
        `updateMetaOwned: examen no encontrado o ajeno. id=${id}, teacherId=${teacherId}`,
      );
      const fallback = await this.prisma.exam.findUnique({ where: { id } });
      if (!fallback) throw new Error('Exam not found');

      return ExamFactory.rehydrate({
        id: fallback.id,
        title: fallback.title,
        status: fallback.status as ExamStatus,
        classId: fallback.classId,
        difficulty: fallback.difficulty,
        attempts: fallback.attempts,
        timeMinutes: fallback.timeMinutes,
        reference: fallback.reference,
        createdAt: fallback.createdAt,
        updatedAt: fallback.updatedAt,
      });
    }

    let nextClassId = patch.classId;
    if (nextClassId) {
      const target = await this.prisma.classes.findFirst({
        where: { id: nextClassId, course: { teacherId } },
        select: { id: true },
      });

      if (!target) {
        this.logger.warn(
          `updateMetaOwned: classId destino no pertenece al docente. classId=${nextClassId}, teacherId=${teacherId}. Se ignora el cambio.`,
        );
        nextClassId = undefined;
      }
    }

    const updated = await this.prisma.exam.update({
      where: { id },
      data: {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(nextClassId !== undefined ? { classId: nextClassId } : {}),
        updatedAt: new Date(),
      },
    });

    return ExamFactory.rehydrate({
      id: updated.id,
      title: updated.title,
      status: updated.status as ExamStatus,
      classId: updated.classId,
      difficulty: updated.difficulty,
      attempts: updated.attempts,
      timeMinutes: updated.timeMinutes,
      reference: updated.reference,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  }

  async teacherOwnsClass(classId: string, teacherId: string): Promise<boolean> {
    const owns = await this.prisma.classes.count({
      where: { id: classId, course: { teacherId } },
    });
    return owns > 0;
  }

  async deleteOwned(id: string, teacherId: string): Promise<void> {
    await this.prisma.exam.deleteMany({
      where: { id, class: { course: { teacherId } } },
    });
  }
}

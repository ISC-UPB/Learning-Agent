import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class DeadLetterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: {
    jobId: string;
    documentId: string;
    jobType: string;
    payload?: any;
    errorMessage?: string;
    attempts: number;
  }) {
    return this.prisma.deadLetter.create({ data });
  }

  async findAll(options?: { skip?: number; take?: number }) {
    const { skip, take } = options || {};
    return this.prisma.deadLetter.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return this.prisma.deadLetter.count();
  }

  async clear() {
    return this.prisma.deadLetter.deleteMany();
  }
}

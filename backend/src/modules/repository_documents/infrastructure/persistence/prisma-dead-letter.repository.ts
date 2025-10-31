import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class DeadLetterRepository {
  async save(data: {
    jobId: string;
    documentId: string;
    jobType: string;
    payload?: any;
    errorMessage?: string;
    attempts: number;
  }) {
    return prisma.deadLetter.create({
      data,
    });
  }

  async findAll() {
    return prisma.deadLetter.findMany();
  }

  async clear() {
    return prisma.deadLetter.deleteMany();
  }
}

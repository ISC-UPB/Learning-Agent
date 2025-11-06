import { Test, TestingModule } from '@nestjs/testing';
import { IntExamRepository } from './int-exam.repository';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateInterviewQuestionDto, UpdateInterviewQuestionDto } from '../dtos/interview-exam.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('IntExamRepository (unit)', () => {
  let service: IntExamRepository;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      interviewQuestion: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntExamRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<IntExamRepository>(IntExamRepository);
  });

  afterEach(() => jest.resetAllMocks());

  it('create should persist and return the created question', async () => {
    const dto: CreateInterviewQuestionDto = {
      courseId: 'course-1',
      docId: 'doc-1',
      type: 'open_question',
      json: { q: 'hello' },
    };

    const created = { id: 'id-1', ...dto };
    mockPrisma.interviewQuestion.create.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(mockPrisma.interviewQuestion.create).toHaveBeenCalledWith({
      data: {
        courseId: dto.courseId,
        docId: dto.docId,
        json: dto.json,
        type: dto.type,
      },
      include: { course: true, document: true },
    });

    expect(result).toBe(created);
  });

  it('create should throw ConflictException on unique constraint (P2002)', async () => {
    const dto: CreateInterviewQuestionDto = {
      courseId: 'course-1',
      docId: 'doc-1',
      type: 'open_question',
    };

    const err: any = new Error('unique');
    err.code = 'P2002';
    mockPrisma.interviewQuestion.create.mockRejectedValue(err);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('findOne should return question when found', async () => {
    const found = { id: 'id-2', courseId: 'c', docId: 'd' };
    mockPrisma.interviewQuestion.findUnique.mockResolvedValue(found);

    const res = await service.findOne('id-2');
    expect(mockPrisma.interviewQuestion.findUnique).toHaveBeenCalledWith({
      where: { id: 'id-2' },
      include: { course: true, document: true },
    });
    expect(res).toBe(found);
  });

  it('findOne should throw NotFoundException when not found', async () => {
    mockPrisma.interviewQuestion.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findByCourseId returns paginated results and meta', async () => {
    const questions = [{ id: 'q1' }, { id: 'q2' }];
    mockPrisma.interviewQuestion.findMany.mockResolvedValue(questions);
    mockPrisma.interviewQuestion.count.mockResolvedValue(2);

    const res = await service.findByCourseId('course-1', 1, 10);
    expect(res).toHaveProperty('data', questions);
    expect(res).toHaveProperty('meta');
    expect(res.meta.total).toBe(2);
    expect(mockPrisma.interviewQuestion.findMany).toHaveBeenCalled();
  });

  it('update should throw NotFoundException when prisma throws P2025', async () => {
    const err: any = new Error('not found');
    err.code = 'P2025';
    mockPrisma.interviewQuestion.update.mockRejectedValue(err);

    const dto: UpdateInterviewQuestionDto = { json: { a: 1 } };
    await expect(service.update('nope', dto)).rejects.toBeInstanceOf(NotFoundException);
  });
});


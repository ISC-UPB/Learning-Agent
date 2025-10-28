import { PrismaExamRepository } from '../infrastructure/persistence/exam.prisma.repository';
import { ExamFactory } from '../domain/factories/exam.factory';
import { EXAM_STATUS } from '../domain/constants/exam.constants';

const prismaMock = {
  exam: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
  },
  classes: {
    count: jest.fn(),
    findFirst: jest.fn(),
  },
};

describe(' PrismaExamRepository', () => {
  let repository: PrismaExamRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaExamRepository(prismaMock as any);
  });

  const validExamProps = {
    title: 'Physics Midterm',
    classId: 'class-123',
    difficulty: 'medio',
    attempts: 2,
    timeMinutes: 60,
    status: EXAM_STATUS.GUARDADO,
    reference: 'REF-101',
  };

  //  HAPPY PATH TESTS

  it('should create and return an Exam (happy path)', async () => {
    const exam = ExamFactory.create(validExamProps);

    prismaMock.exam.create.mockResolvedValueOnce({
      ...validExamProps,
      id: exam.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await repository.create(exam);

    expect(prismaMock.exam.create).toHaveBeenCalledTimes(1);
    expect(result.title).toBe(validExamProps.title);
    expect(result.difficulty.getValue()).toBe('medio');
  });

  it('should find an exam owned by a teacher', async () => {
    prismaMock.exam.findFirst.mockResolvedValueOnce({
      id: 'exam-1',
      title: 'Physics Midterm',
      status: EXAM_STATUS.GUARDADO,
      classId: 'class-123',
      difficulty: 'medio',
      attempts: 2,
      timeMinutes: 60,
      reference: 'REF-101',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await repository.findByIdOwned('exam-1', 'teacher-1');

    expect(result).not.toBeNull();
    expect(result?.title).toBe('Physics Midterm');
  });

 
  it('should throw when creating exam with invalid attempts', () => {
    const invalidProps = { ...validExamProps, attempts: 0 };

    expect(() => ExamFactory.create(invalidProps as any)).toThrow();

  });

  it('should return null if exam not found in findByIdOwned', async () => {
    prismaMock.exam.findFirst.mockResolvedValueOnce(null);

    const result = await repository.findByIdOwned('invalid-id', 'teacher-1');
    expect(result).toBeNull();
  });
});

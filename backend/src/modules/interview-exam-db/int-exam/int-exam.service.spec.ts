import { Test, TestingModule } from '@nestjs/testing';
import { IntExamService } from './int-exam.repository';

describe('IntExamService', () => {
  let service: IntExamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntExamService],
    }).compile();

    service = module.get<IntExamService>(IntExamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

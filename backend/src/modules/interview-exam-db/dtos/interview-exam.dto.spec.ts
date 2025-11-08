import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateInterviewQuestionDto,
  UpdateInterviewQuestionDto,
  CreateChatHistoryDto,
  UpdateChatHistoryDto,
} from './interview-exam.dto';

describe('CreateInterviewQuestionDto', () => {
  it('should validate a correct DTO', async () => {
    const dto = plainToInstance(CreateInterviewQuestionDto, {
      courseId: '123e4567-e89b-12d3-a456-426614174000',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'multiple_selection',
      json: { foo: 'bar' },
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when courseId is missing', async () => {
    const dto = plainToInstance(CreateInterviewQuestionDto, {
      docId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'multiple_selection',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('courseId');
  });

  it('should fail when courseId is not a UUID', async () => {
    const dto = plainToInstance(CreateInterviewQuestionDto, {
      courseId: 'invalid-uuid',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'multiple_selection',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('courseId');
  });

  it('should fail when docId is missing', async () => {
    const dto = plainToInstance(CreateInterviewQuestionDto, {
      courseId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'multiple_selection',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('docId');
  });

  it('should fail when docId is not a UUID', async () => {
    const dto = plainToInstance(CreateInterviewQuestionDto, {
      courseId: '123e4567-e89b-12d3-a456-426614174000',
      docId: 'not-a-uuid',
      type: 'multiple_selection',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('docId');
  });

  it('should fail when type is missing', async () => {
    const dto = plainToInstance(CreateInterviewQuestionDto, {
      courseId: '123e4567-e89b-12d3-a456-426614174000',
      docId: '123e4567-e89b-12d3-a456-426614174001',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('type');
  });

  it('should fail when type is invalid', async () => {
    const dto = plainToInstance(CreateInterviewQuestionDto, {
      courseId: '123e4567-e89b-12d3-a456-426614174000',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'invalid_type',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('type');
  });

  it('should accept all valid types', async () => {
    const validTypes = [
      'multiple_selection',
      'double_selection',
      'open_question',
    ];

    for (const type of validTypes) {
      const dto = plainToInstance(CreateInterviewQuestionDto, {
        courseId: '123e4567-e89b-12d3-a456-426614174000',
        docId: '123e4567-e89b-12d3-a456-426614174001',
        type,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should allow optional json field', async () => {
    const dto = plainToInstance(CreateInterviewQuestionDto, {
      courseId: '123e4567-e89b-12d3-a456-426614174000',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'multiple_selection',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('UpdateInterviewQuestionDto', () => {
  it('should validate an empty DTO (all fields optional)', async () => {
    const dto = plainToInstance(UpdateInterviewQuestionDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with json field', async () => {
    const dto = plainToInstance(UpdateInterviewQuestionDto, {
      json: { updated: true },
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with lastUsedAt as Date', async () => {
    const dto = plainToInstance(UpdateInterviewQuestionDto, {
      lastUsedAt: new Date(),
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string date to Date object', async () => {
    const dto = plainToInstance(UpdateInterviewQuestionDto, {
      lastUsedAt: '2024-01-01T00:00:00Z',
    });

    expect(dto.lastUsedAt).toBeInstanceOf(Date);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid date format', async () => {
    const dto = plainToInstance(UpdateInterviewQuestionDto, {
      lastUsedAt: 'invalid-date',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('lastUsedAt');
  });
});

describe('CreateChatHistoryDto', () => {
  it('should validate a correct DTO', async () => {
    const dto = plainToInstance(CreateChatHistoryDto, {
      studentId: '123e4567-e89b-12d3-a456-426614174000',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      question: 'What is the capital of France?',
      response: 'Paris',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when studentId is missing', async () => {
    const dto = plainToInstance(CreateChatHistoryDto, {
      docId: '123e4567-e89b-12d3-a456-426614174001',
      question: 'What is the capital of France?',
      response: 'Paris',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('studentId');
  });

  it('should fail when studentId is not a UUID', async () => {
    const dto = plainToInstance(CreateChatHistoryDto, {
      studentId: 'not-a-uuid',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      question: 'What is the capital?',
      response: 'Paris',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('studentId');
  });

  it('should fail when docId is missing', async () => {
    const dto = plainToInstance(CreateChatHistoryDto, {
      studentId: '123e4567-e89b-12d3-a456-426614174000',
      question: 'What is the capital of France?',
      response: 'Paris',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('docId');
  });

  it('should fail when docId is not a UUID', async () => {
    const dto = plainToInstance(CreateChatHistoryDto, {
      studentId: '123e4567-e89b-12d3-a456-426614174000',
      docId: 'invalid-uuid',
      question: 'What is the capital?',
      response: 'Paris',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('docId');
  });

  it('should fail when question is missing', async () => {
    const dto = plainToInstance(CreateChatHistoryDto, {
      studentId: '123e4567-e89b-12d3-a456-426614174000',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      response: 'Paris',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('question');
  });

  it('should fail when question is not a string', async () => {
    const dto = plainToInstance(CreateChatHistoryDto, {
      studentId: '123e4567-e89b-12d3-a456-426614174000',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      question: 12345,
      response: 'Paris',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('question');
  });

  it('should fail when response is missing', async () => {
    const dto = plainToInstance(CreateChatHistoryDto, {
      studentId: '123e4567-e89b-12d3-a456-426614174000',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      question: 'What is the capital of France?',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('response');
  });

  it('should fail when response is not a string', async () => {
    const dto = plainToInstance(CreateChatHistoryDto, {
      studentId: '123e4567-e89b-12d3-a456-426614174000',
      docId: '123e4567-e89b-12d3-a456-426614174001',
      question: 'What is the capital?',
      response: { answer: 'Paris' },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('response');
  });
});

describe('UpdateChatHistoryDto', () => {
  it('should validate an empty DTO (all fields optional)', async () => {
    const dto = plainToInstance(UpdateChatHistoryDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate with valid uses number', async () => {
    const dto = plainToInstance(UpdateChatHistoryDto, {
      uses: 5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when uses is negative', async () => {
    const dto = plainToInstance(UpdateChatHistoryDto, {
      uses: -1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('uses');
  });

  it('should fail when uses is not an integer', async () => {
    const dto = plainToInstance(UpdateChatHistoryDto, {
      uses: 3.14,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('uses');
  });

  it('should fail when uses is not a number', async () => {
    const dto = plainToInstance(UpdateChatHistoryDto, {
      uses: 'five',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('uses');
  });

  it('should accept zero as valid uses', async () => {
    const dto = plainToInstance(UpdateChatHistoryDto, {
      uses: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

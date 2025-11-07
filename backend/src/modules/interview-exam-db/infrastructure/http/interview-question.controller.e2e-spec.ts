import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { InterviewQuestionController } from './interview-question.controller';

describe('InterviewQuestionController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [InterviewQuestionController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /interview-questions', () => {
    it('should accept valid data', () => {
      return request(app.getHttpServer())
        .post('/interview-questions')
        .send({
          courseId: '123e4567-e89b-12d3-a456-426614174000',
          docId: '123e4567-e89b-12d3-a456-426614174001',
          type: 'multiple_selection',
          json: { foo: 'bar' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('Interview question would be created');
          expect(res.body.data.courseId).toBe('123e4567-e89b-12d3-a456-426614174000');
        });
    });

    it('should reject when courseId is missing', () => {
      return request(app.getHttpServer())
        .post('/interview-questions')
        .send({
          docId: '123e4567-e89b-12d3-a456-426614174001',
          type: 'multiple_selection',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('courseId');
        });
    });

    it('should reject when courseId is not a UUID', () => {
      return request(app.getHttpServer())
        .post('/interview-questions')
        .send({
          courseId: 'invalid-uuid',
          docId: '123e4567-e89b-12d3-a456-426614174001',
          type: 'multiple_selection',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('courseId');
        });
    });

    it('should reject when type is invalid', () => {
      return request(app.getHttpServer())
        .post('/interview-questions')
        .send({
          courseId: '123e4567-e89b-12d3-a456-426614174000',
          docId: '123e4567-e89b-12d3-a456-426614174001',
          type: 'invalid_type',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('type');
        });
    });

    it('should accept valid type variations', () => {
      const validTypes = ['multiple_selection', 'double_selection', 'open_question'];
      
      return Promise.all(
        validTypes.map((type) =>
          request(app.getHttpServer())
            .post('/interview-questions')
            .send({
              courseId: '123e4567-e89b-12d3-a456-426614174000',
              docId: '123e4567-e89b-12d3-a456-426614174001',
              type,
            })
            .expect(201)
        )
      );
    });
  });

  describe('PATCH /interview-questions/:id', () => {
    it('should accept valid update data', () => {
      return request(app.getHttpServer())
        .patch('/interview-questions/123')
        .send({
          json: { updated: true },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('123');
        });
    });

    it('should accept date string and transform to Date', () => {
      return request(app.getHttpServer())
        .patch('/interview-questions/123')
        .send({
          lastUsedAt: '2024-01-01T00:00:00Z',
        })
        .expect(200);
    });

    it('should reject invalid date format', () => {
      return request(app.getHttpServer())
        .patch('/interview-questions/123')
        .send({
          lastUsedAt: 'invalid-date',
        })
        .expect(400);
    });

    it('should accept empty body (all fields optional)', () => {
      return request(app.getHttpServer())
        .patch('/interview-questions/123')
        .send({})
        .expect(200);
    });
  });
});

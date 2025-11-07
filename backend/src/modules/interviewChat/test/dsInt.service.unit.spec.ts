import { Test, TestingModule } from '@nestjs/testing';
import { DsIntService } from '../infrastructure/dsInt.service';
import { LLM_PORT } from 'src/modules/llm/tokens';
import { PROMPT_TEMPLATE_PORT } from 'src/modules/prompt-template/tokens';
import { GetDocumentContentUseCase } from 'src/modules/repository_documents/application/queries/get-document-content.usecase';

describe('DsIntService (unit)', () => {
  let service: DsIntService;
  let mockLlm: any;
  let mockPrompt: any;
  let mockRepo: any;
  let mockGetDoc: any;

  beforeEach(async () => {
    mockLlm = { complete: jest.fn() };
    mockPrompt = { render: jest.fn() };
    mockRepo = {
      findByCourseAndDocumentAndType: jest.fn(),
      create: jest.fn(),
    };
    mockGetDoc = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DsIntService,
        { provide: LLM_PORT, useValue: mockLlm },
        { provide: PROMPT_TEMPLATE_PORT, useValue: mockPrompt },
        { provide: 'INTERVIEW_QUESTION_REPOSITORY', useValue: mockRepo },
        { provide: GetDocumentContentUseCase, useValue: mockGetDoc },
      ],
    }).compile();

    service = module.get<DsIntService>(DsIntService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a random question from repo when available and random > 0.5', async () => {
    const repoQuestions = [
      { json: { question: 'q1' } },
      { json: { question: 'q2' } },
    ];
    mockRepo.findByCourseAndDocumentAndType.mockResolvedValue(repoQuestions);

    // Force Math.random to > 0.5 to take DB path
    const mathSpy = jest.spyOn(Math, 'random').mockReturnValue(0.6);

    const res = await service.generateQuestion('course-1', 'doc-1');

    expect(mockRepo.findByCourseAndDocumentAndType).toHaveBeenCalledWith(
      'course-1',
      'doc-1',
      'open_question',
    );
    // Should return one of the repo question jsons
    expect([{ question: 'q1' }, { question: 'q2' }]).toContainEqual(res as any);
    expect(mockGetDoc.execute).not.toHaveBeenCalled();
    expect(mockPrompt.render).not.toHaveBeenCalled();
    expect(mockLlm.complete).not.toHaveBeenCalled();

    mathSpy.mockRestore();
  });

  it('calls LLM and persists question when repo empty or random <= 0.5', async () => {
    mockRepo.findByCourseAndDocumentAndType.mockResolvedValue([]);
    mockGetDoc.execute.mockResolvedValue({ contenido: 'doc content' });
    mockPrompt.render.mockResolvedValue('rendered-prompt');
    const aiResponse = { text: JSON.stringify({ question: 'ai-generated' }) };
    mockLlm.complete.mockResolvedValue(aiResponse);

    // Force Math.random to <= 0.5 to take AI path
    jest.spyOn(Math, 'random').mockReturnValue(0.4);

    const res = await service.generateQuestion('course-1', 'doc-1');

    expect(mockGetDoc.execute).toHaveBeenCalledWith({ docId: 'doc-1' });
    expect(mockPrompt.render).toHaveBeenCalled();
    expect(mockLlm.complete).toHaveBeenCalled();
    expect(mockRepo.create).toHaveBeenCalled();
    expect(res).toEqual({ question: 'ai-generated' });
  });
});

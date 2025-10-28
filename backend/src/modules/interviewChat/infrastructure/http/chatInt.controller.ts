import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  DoubleOptionResponse,
  MultipleSelectionResponse,
} from 'src/modules/reinforcement/infrastructure/http/dto/response';
import { DsIntService } from '../dsInt.service';
import { ChatAnswer } from './dto/generate-advice';
import { QuestionResponse } from './dto/question-response';

interface CoachingResponse {
  generated_question: string;
  user_response: string;
  coaching_advice: string;
}

@Controller('chatint')
export class ChatIntController {
  constructor(private readonly dsService: DsIntService) {}
  @Get('question')
  async generateQuestion(
    @Query('courseId') courseId: string,
    @Query('docId') docId: string,
  ): Promise<QuestionResponse> {
    console.log('courseId:', courseId);
    console.log('docId:', docId);
    return this.dsService.generateQuestion(courseId, docId);
  }

  // Get advice for an answer
  @Post('advice')
  async generateAdvice(
    @Body() chatAnswer: ChatAnswer,
  ): Promise<CoachingResponse> {
    console.log('answer:', chatAnswer);
    const respDs = await this.dsService.generateAdvise(
      chatAnswer.question,
      chatAnswer.answer,
      chatAnswer.topic,
    );
    return respDs;
  }
  @Get('multipleSelection')
  async generateMultipleSelection(
    @Query('courseId') courseId: string,
    @Query('docId') docId: string,
  ): Promise<MultipleSelectionResponse> {
    return await this.dsService.generateMultipleSelection(courseId, docId);
  }
  @Get('doubleOption')
  async generateDoubleOption(
    @Query('courseId') courseId: string,
    @Query('docId') docId: string,
  ): Promise<DoubleOptionResponse> {
    return await this.dsService.generatedoubleOption(courseId, docId);
  }
}

import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ChatRequest } from './dto/chat-request';
import { ChatResponse } from './dto/response';
import { DsService } from '../ds.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly dsService: DsService) {}

  @Post()
  @HttpCode(200)
  async chatWithIA(@Body() dto: ChatRequest): Promise<ChatResponse> {
    const response = await this.dsService.generateResponse(
      dto.question,
      dto.studentId,
      dto.docId,
    );
    return response;
  }
  @Get()
  @HttpCode(200)
  async getChatHistory(
    @Query('studentId') studentId: string,
    @Query('docId') docId: string,
  ): Promise<ChatResponse[]> {
    const response = await this.dsService.findByStudentAndDocument(
      studentId,
      docId,
    );
    return response;
  }
}

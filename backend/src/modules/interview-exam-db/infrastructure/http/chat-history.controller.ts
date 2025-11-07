import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateChatHistoryDto,
  UpdateChatHistoryDto,
} from '../../dtos/interview-exam.dto';

@Controller('chat-history')
export class ChatHistoryController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateChatHistoryDto) {
    return {
      message: 'Chat history would be created',
      data: createDto,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateChatHistoryDto,
  ) {
    return {
      message: `Chat history ${id} would be updated`,
      data: updateDto,
    };
  }
}

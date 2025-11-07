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
  CreateInterviewQuestionDto,
  UpdateInterviewQuestionDto,
} from '../../dtos/interview-exam.dto';

@Controller('interview-questions')
export class InterviewQuestionController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateInterviewQuestionDto) {
    return {
      message: 'Interview question would be created',
      data: createDto,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInterviewQuestionDto,
  ) {
    return {
      message: `Interview question ${id} would be updated`,
      data: updateDto,
    };
  }
}

import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { DeadLetterRepository } from '../persistence/prisma-dead-letter.repository';

@Controller('admin')
export class AdminDeadLettersController {
  constructor(private readonly deadLetterRepo: DeadLetterRepository) {}

  @Get('dead-letters')
  async getDeadLetters(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    const safePage = Number.isNaN(Number(page)) || page < 1 ? 1 : page;
    const safeLimit = Number.isNaN(Number(limit)) || limit < 1 ? 20 : limit;

    const skip = (safePage - 1) * safeLimit;
    const take = safeLimit;

    const [data, total] = await Promise.all([
      this.deadLetterRepo.findAll({ skip, take }),
      this.deadLetterRepo.count(),
    ]);

    return {
      page: safePage,
      limit: safeLimit,
      total,
      data,
    };
  }
}

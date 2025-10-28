import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoginUseCase } from '../../application/commands/login.usecase';
import { RefreshUseCase } from '../../application/commands/refresh.usecase';
import { LogoutUseCase } from '../../application/commands/logout.usecase';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt.guard';
import { GetMeUseCase } from '../../application/queries/get-me.usecase';
import { RequestInfoService } from '../request-info.service';

type AccessPayload = { sub: string; email: string; sid?: string };
type AuthRequest = Request & { user: AccessPayload };
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshUseCase,
    private readonly logout: LogoutUseCase,
    private readonly meUc: GetMeUseCase,
    private readonly requestInfoService: RequestInfoService,
  ) {}

  @Post('login')
  @HttpCode(200)
  loginEndpoint(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Headers('user-agent') ua?: string,
  ) {
    const clientInfo = this.requestInfoService.extractClientInfo(req, ua);
    return this.login.execute({
      ...dto,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
  }

  @Post('refresh')
  @HttpCode(200)
  refreshEndpoint(@Body() dto: RefreshDto) {
    return this.refresh.execute(dto);
  }

  @Post('logout')
  @HttpCode(200)
  logoutEndpoint(@Body() dto: RefreshDto) {
    return this.logout.execute(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthRequest) {
    return this.meUc.execute({ userId: req.user.sub });
  }
}

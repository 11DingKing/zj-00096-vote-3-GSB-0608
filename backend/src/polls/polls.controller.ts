import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Ip, Res, Put, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { VoteDto } from './dto/vote.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PollStatus } from '../common/enums/poll-status.enum';

@ApiTags('polls')
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CREATOR)
  create(@Body() createPollDto: CreatePollDto, @Request() req) {
    return this.pollsService.create(createPollDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.pollsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pollsService.findOne(+id);
  }

  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.pollsService.getResults(+id);
  }

  @Post(':id/vote')
  vote(
    @Param('id') id: string,
    @Body() voteDto: VoteDto,
    @Request() req,
    @Ip() ip: string,
  ) {
    const userId = req.user?.userId || null;
    return this.pollsService.vote(+id, voteDto, userId, ip);
  }

  @Get(':id/has-voted')
  @ApiQuery({ name: 'browserFingerprint', required: false })
  hasVoted(
    @Param('id') id: string,
    @Query('browserFingerprint') browserFingerprint: string,
    @Request() req,
    @Ip() ip: string,
  ) {
    const userId = req.user?.userId || null;
    return this.pollsService.hasVoted(+id, userId, browserFingerprint || '', ip);
  }

  @Get(':id/export')
  @ApiQuery({ name: 'details', required: false, type: Boolean })
  exportCsv(
    @Param('id') id: string,
    @Query('details') details: string,
    @Res() res: Response,
  ) {
    return this.pollsService.exportCsv(+id, res, details === 'true');
  }

  @Put(':id/status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: PollStatus },
    @Request() req,
  ) {
    return this.pollsService.updateStatus(+id, body.status, req.user.userId, req.user.role);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.pollsService.remove(+id, req.user.userId, req.user.role);
  }
}

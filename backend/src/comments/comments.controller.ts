import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('polls/:id/comments')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  create(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ) {
    return this.commentsService.create(+id, createCommentDto, req.user.userId);
  }

  @Get('polls/:id/comments')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.commentsService.findAllByPollId(+id, parseInt(page), parseInt(limit));
  }

  @Post('comments/:id/like')
  like(@Param('id') id: string) {
    return this.commentsService.like(+id);
  }
}

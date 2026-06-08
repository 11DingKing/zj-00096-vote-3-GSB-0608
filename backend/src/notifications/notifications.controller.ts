import { Controller, Get, Put, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  findAll(@Request() req) {
    return this.notificationsService.findAllByUserId(req.user.userId);
  }

  @Get('unread-count')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  @Put(':id/read')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(+id, req.user.userId);
  }

  @Put('read-all')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}

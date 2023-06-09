import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { SchedulesCommentsService } from './schedules-comments.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUserFromAccessToken } from '../auth/get-user-from-access-token.decorator';
import { CreateSchedulesCommentDto } from './dto/create-schedules-comment.dto';
import { SchedulesComment } from './entities/schedules-comment.entity';

@ApiTags('여행 일정 댓글 (Schedules Comments)')
@Controller()
export class SchedulesCommentsController {
  constructor(
    private readonly schedulesCommentsService: SchedulesCommentsService,
  ) {}

  @Post('/schedules/:scheduleId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '여행 일정 댓글 작성',
    description: '여행 일정에 대해 댓글을 작성합니다.',
  })
  @ApiParam({
    name: 'scheduleId',
    type: 'number',
    description: '여행 일정 ID 를 전달하세요.',
    example: 45,
  })
  @ApiBody({
    type: CreateSchedulesCommentDto,
    description: '댓글 내용을 입력하세요.',
  })
  @ApiCreatedResponse({ description: '등록된 댓글 및 사용자 정보' })
  createScheduleComment(
    @GetUserFromAccessToken() user,
    @Param('scheduleId', ParseIntPipe) schedule_id: number,
    @Body(ValidationPipe)
    createSchedulesCommentDto: CreateSchedulesCommentDto,
  ): Promise<SchedulesComment> {
    const result = this.schedulesCommentsService.createScheduleComment(
      user.id,
      schedule_id,
      createSchedulesCommentDto,
    );
    return result;
  }

  @Get('/schedules/:scheduleId/comments')
  @ApiOperation({
    summary: '특정 여행 일정의 댓글 목록 조회',
    description: '특정 여행 일정의 댓글 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'scheduleId',
    type: 'number',
    description: '여행 ID 를 전달하세요.',
    example: 1,
  })
  @ApiOkResponse({
    description: '해당 여행 일의 전체 댓글 목록',
    type: [SchedulesComment],
  })
  getCommentsByScheduleId(
    @Param('scheduleId', ParseIntPipe) schedule_id: number,
  ): Promise<SchedulesComment[]> {
    return this.schedulesCommentsService.getCommentsByScheduleId(schedule_id);
  }

  @Get('/schedules/comments/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '로그인한 사용자가 여행 일정에 작성한 댓글 정보를 조회한다.',
    description:
      '로그인한 사용자가 여행 일정에 작성한 댓글 목록 및 여행 일정 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '해당 사용자의 전체 댓글 목록',
    type: [SchedulesComment],
  })
  getCommentsByUserId(
    @GetUserFromAccessToken() user,
  ): Promise<SchedulesComment[]> {
    return this.schedulesCommentsService.getCommentsByUserId(user.id);
  }
}

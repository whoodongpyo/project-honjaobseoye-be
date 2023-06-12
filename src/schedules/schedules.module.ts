import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesRepository } from './schedules.repository';
import { SchedulesDetailRepository } from './schedules-detail.repository';
import { SchedulesLikesRepository } from '../schedules-likes/schedules-likes.repository';
import { SchedulesCommentsRepository } from '../schedules-comments/schedules-comments.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchedulesRepository, SchedulesDetailRepository]),
  ],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    SchedulesRepository,
    SchedulesDetailRepository,
    SchedulesLikesRepository,
    SchedulesCommentsRepository,
  ],
  exports: [SchedulesModule],
})
export class SchedulesModule {}

import { DataSource, DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateScheduleDetailDto } from './dto/create-schedule-detail.dto';
import { ScheduleDetail } from './entities/schedule-detail.entity';

@Injectable()
export class SchedulesDetailRepository extends Repository<ScheduleDetail> {
  constructor(private dataSource: DataSource) {
    super(ScheduleDetail, dataSource.createEntityManager());
  }

  async createScheduleDetail(
    createScheduleDetailDto: CreateScheduleDetailDto,
  ): Promise<Omit<ScheduleDetail, 'idx'>> {
    const scheduleDetail = this.create(createScheduleDetailDto);

    await this.save(scheduleDetail);

    const { idx, ...result } = scheduleDetail;

    return result;
  }

  async deleteScheduleDetailsById(schedule_id: number): Promise<DeleteResult> {
    const result = await this.delete({ schedule_id });
    return result;
  }
}

import { DataSource, Repository } from 'typeorm';
import { Destination } from './entities/destination.entity';
import { Injectable, Logger } from '@nestjs/common';
import { CreateDestinationDto } from './dto/create-destination.dto';

@Injectable()
export class DestinationsRepository extends Repository<Destination> {
  constructor(private dataSource: DataSource) {
    super(Destination, dataSource.createEntityManager());
  }

  async insertDestinations(
    destinationsToInsert: CreateDestinationDto[],
  ): Promise<void> {
    const promises = destinationsToInsert.map(async (destination) => {
      const data = await this.create(destination);
      await this.save(data);
    });

    const result = await Promise.allSettled(promises);
    Logger.log(result);
  }

  /**
   * 여행지 목록을 카테고리, 타이틀로 검색한 결과를 전달한다.
   * TODO : pagination 추가하기
   *
   * @param categoryIds
   * @param title
   */
  async searchDestinationsWithLikesAndComments(
    categoryIds,
    title,
  ): Promise<any> {
    // 여행지 목록을 좋아요, 댓글과 함께 조회한다.
    const query = this.createQueryBuilder('destination')
      .select('destination')
      .leftJoin('destination.destination_comments', 'destinations_comment')
      .addSelect([
        'destinations_comment.comment_id',
        'destinations_comment.comment',
        'destinations_comment.created_at',
        'destinations_comment.updated_at',
      ])
      .where('destination.title LIKE :title', {
        title: `%${title}%`,
      })
      .leftJoin('destinations_comment.user', 'comments_user')
      .addSelect([
        'comments_user.id',
        'comments_user.nickname',
        'comments_user.profile_image',
      ])
      .leftJoin('destination.destination_likes', 'destination_likes')
      .addSelect([
        'destination_likes.destination_id',
        'destination_likes.user_id',
        'destination_likes.is_liked',
        'destination_likes.created_at',
        'destination_likes.updated_at',
      ])
      .leftJoin('destination_likes.user', 'likes_user')
      .addSelect([
        'likes_user.id',
        'likes_user.nickname',
        'likes_user.profile_image',
      ]);

    if (categoryIds.length > 0) {
      query.andWhere('destination.category_id IN (:...categoryIds)', {
        categoryIds,
      });
    }

    return await query.getMany();
  }

  /**
   * 특정 여행지 정보를 좋아요, 댓글과 함께 전달한다.
   * TODO: 좋아요, 댓글을 조회하는 API 는 분리할 것.
   *
   * @param destination_id
   */
  async getDestinationWithLikesAndComments(
    destination_id: number,
  ): Promise<any> {
    return await this.createQueryBuilder('destination')
      .select('destination')
      .leftJoin('destination.destination_comments', 'destinations_comment')
      .addSelect([
        'destinations_comment.comment_id',
        'destinations_comment.comment',
        'destinations_comment.created_at',
        'destinations_comment.updated_at',
      ])
      .where('destination.id = :destination_id', { destination_id })
      .leftJoin('destinations_comment.user', 'comments_user')
      .addSelect([
        'comments_user.id',
        'comments_user.nickname',
        'comments_user.profile_image',
      ])
      .leftJoin('destination.destination_likes', 'destination_likes')
      .addSelect([
        'destination_likes.destination_id',
        'destination_likes.user_id',
        'destination_likes.is_liked',
        'destination_likes.created_at',
        'destination_likes.updated_at',
      ])
      .leftJoin('destination_likes.user', 'likes_user')
      .addSelect([
        'likes_user.id',
        'likes_user.nickname',
        'likes_user.profile_image',
      ])
      .getOne();
  }

  /**
   * 메인 화면에서 사용할 여행지 인기순 조회
     TODO : '좋아요' 순으로 정렬하여 전달해야 한다.
   * @param count
   */
  async getDestinationsRanking(count: number): Promise<Destination[]> {
    const destinations = await this.find({
      take: count,
    });

    return destinations;
  }
}

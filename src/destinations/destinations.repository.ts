import { DataSource, In, Repository } from 'typeorm';
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

  async getAllDestinations(): Promise<Destination[]> {
    const destinations = await this.find();
    return destinations;
  }

  async getDestinationsByCategoryIds(
    categoryIds: number[],
  ): Promise<{ totalCount: number; result: Destination[] }> {
    const destinations = await this.find({
      where: {
        category_id: In(categoryIds),
      },
    });
    const destinationsCount = destinations.length;

    return {
      totalCount: destinationsCount,
      result: destinations,
    };
  }

  async getDestination(destinationId: number): Promise<Destination> {
    const destination = await this.findOne({
      where: {
        id: destinationId,
      },
    });

    return destination;
  }

  async getDestinationWithReview(destinationId: number): Promise<any> {
    // 여행지 정보를 댓글과 함께 조회한다.
    return await this.createQueryBuilder('destination')
      .select('destination')
      .leftJoin('destination.destination_comments', 'destinations_comment')
      .addSelect([
        'destinations_comment.comment_id',
        'destinations_comment.comment',
        'destinations_comment.created_at',
        'destinations_comment.updated_at',
      ])
      .leftJoin('destinations_comment.user', 'user')
      .addSelect(['user.id', 'user.nickname', 'user.profile_image'])
      .where('destination.id = :destinationId', { destinationId })
      .getOne();
  }

  async getDestinationsWithReview(skip: number, take: number): Promise<any> {
    // 여행지 목록을 댓글과 함께 조회한다.
    return await this.createQueryBuilder('destination')
      .select('destination')
      .leftJoin('destination.destination_comments', 'destinations_comment')
      .addSelect([
        'destinations_comment.comment_id',
        'destinations_comment.comment',
        'destinations_comment.created_at',
        'destinations_comment.updated_at',
      ])
      .leftJoin('destinations_comment.user', 'user')
      .addSelect(['user.id', 'user.nickname', 'user.profile_image'])
      .skip(skip)
      .take(take)
      .getMany();
  }

  // TODO :test 후 지울 것
  async getDestinationsWithLikesAndComments(): Promise<any> {
    // 여행지 목록을 좋아요, 댓글과 함께 조회한다.
    return await this.createQueryBuilder('destination')
      .select('destination')
      .leftJoin('destination.destination_comments', 'destinations_comment')
      .addSelect([
        'destinations_comment.comment_id',
        'destinations_comment.comment',
        'destinations_comment.created_at',
        'destinations_comment.updated_at',
      ])
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
      .getMany();
  }

  // TODO :test 후 지울 것
  async getDestinationWithLikesAndComments(
    destination_id: number,
  ): Promise<any> {
    // 여행지 목록을 좋아요, 댓글과 함께 조회한다.
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

  async getDestinationsRanking(count: number): Promise<Destination[]> {
    // TODO : 추후에 '좋아요' 순으로 정렬하여 조회해야 한다.
    const destinations = await this.find({
      take: count,
    });

    return destinations;
  }
}

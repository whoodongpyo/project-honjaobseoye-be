import { Injectable, Logger } from '@nestjs/common';
import { DestinationsRepository } from './destinations.repository';
import { Destination } from './entities/destination.entity';
import { CreateDestinationDto } from './dto/create-destination.dto';

import { promises as fs } from 'fs';

@Injectable()
export class DestinationsService {
  constructor(private destinationsRepository: DestinationsRepository) {}

  async fetchData(): Promise<void> {
    const baseUrl =
      'https://apis.data.go.kr/B551011/KorService1/areaBasedList1';
    const serviceKey =
      'gYxeW4UBcFMVnEbeclSlXiybRNht4DCVRd5g7YeF8ippmVNRo9bc1rwDyu%2Fz8OT7yVPSy0%2BrLZ3LtaDUsIHrvg%3D%3D';
    const numOfRows = '3000';
    const pageNo = '1';
    const mobileOS = 'ETC';
    const mobileApp = 'AppTest';
    const _type = 'json';
    const listYN = 'Y';
    const arrange = 'A';
    const areaCode = '39';

    const url = `${baseUrl}?serviceKey=${serviceKey}&numOfRows=${numOfRows}&pageNo=${pageNo}&MobileOS=${mobileOS}&MobileApp=${mobileApp}&_type=${_type}&listYN=${listYN}&arrange=${arrange}&areaCode=${areaCode}`;

    try {
      const response = await fetch(url);
      const result = await response.json();
      const data = result.response.body.items.item;

      // API 응답 결과를 별도의 JSON 파일로 생성하기
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile('./data/destinations.json', jsonData);
    } catch (error) {
      Logger.error(error);
    }
  }

  async getDestinationIdsFromJSON(): Promise<void> {
    const data: string = await fs.readFile('./data/destinations.json', 'utf-8');
    const destinations = JSON.parse(data);

    const destinationIds = destinations.map(({ contentid, title }) => ({
      contentid,
      title,
    }));

    const jsonData = JSON.stringify(destinationIds, null, 2);
    await fs.writeFile('destination-ids.json', jsonData);
  }

  async fetchDestinationsWithOverview() {
    const data: string = await fs.readFile(
      './data/destination-ids.json',
      'utf-8',
    );
    const destinationIds = JSON.parse(data);

    const destinations = [];

    try {
      for (let i = 1; i <= 300; i++) {
        const { contentid, title } = destinationIds[i];
        const url = `https://apis.data.go.kr/B551011/KorService1/detailCommon1?serviceKey=gYxeW4UBcFMVnEbeclSlXiybRNht4DCVRd5g7YeF8ippmVNRo9bc1rwDyu%2Fz8OT7yVPSy0%2BrLZ3LtaDUsIHrvg%3D%3D&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${contentid}&defaultYN=Y&firstImageYN=Y&addrinfoYN=Y&mapinfoYN=Y&overviewYN=Y&numOfRows=10&pageNo=1`;

        const response = await fetch(url);
        const result = await response.json();
        const dataWithOverview = result.response.body.items.item[0];

        Logger.log(dataWithOverview);
        destinations.push(dataWithOverview);
      }

      const jsonData = JSON.stringify(destinations, null, 2);
      await fs.writeFile(
        './data/destinations-with-overview-1-300.json',
        jsonData,
      );
    } catch (e) {
      Logger.error(e.message());
    }
  }

  async transformDestinationsToInsert(): Promise<void> {
    const data: string = await fs.readFile(
      './data/destinations-with-overview-1-300.json',
      'utf-8',
    );
    const destinations = JSON.parse(data);

    const destinationsToInsert: CreateDestinationDto[] = destinations.map(
      (data) => {
        return {
          id: Number(data.contentid),
          category_id: Number(data.contenttypeid),
          title: data.title,
          homepage: data.homepage,
          tel: data.tel,
          image1: data.firstimage,
          image2: data.firstimage2,
          addr1: data.addr1,
          addr2: data.addr2,
          zipcode: data.zipcode,
          mapx: data.mapx,
          mapy: data.mapy,
          overview: data.overview,
        };
      },
    );

    const jsonData = JSON.stringify(destinationsToInsert, null, 2);

    try {
      await fs.writeFile('./data/destinations-to-insert-1-300.json', jsonData);
    } catch (error) {
      Logger.error(error);
    }
  }

  async insertDestinations(): Promise<void> {
    const data: string = await fs.readFile(
      './data/destinations-to-insert-1-300.json',
      'utf-8',
    );
    const destinationsToInsert = JSON.parse(data);

    try {
      await this.destinationsRepository.insertDestinations(
        destinationsToInsert,
      );
    } catch (e) {
      Logger.error(e.message());
    }
  }

  // TODO: 여행지 검색 (카테고리와 여행지 타이틀)
  async searchDestinationsWithLikesAndComments(
    categoryIds,
    title,
  ): Promise<any> {
    // categoryIds 를 배열로 변경
    let parsedCategoryIds;
    if (categoryIds === '') {
      parsedCategoryIds = [];
    } else {
      parsedCategoryIds = categoryIds
        .split(',')
        .map(Number)
        .filter((number) => !isNaN(number));
    }

    const destinations =
      await this.destinationsRepository.searchDestinationsWithLikesAndComments(
        parsedCategoryIds,
        title,
      );

    const result = destinations.map((destination) => {
      const { destination_likes } = destination;
      // is_liked 가 false 인 항목들을 제외한다.
      const new_destination_likes = destination_likes.filter(
        ({ is_liked }) => is_liked === true,
      );
      const destination_likes_count = new_destination_likes.length;

      return {
        ...destination,
        comment_count: destination.destination_comments.length,
        destination_likes: new_destination_likes,
        destination_likes_count,
      };
    });

    return {
      total_count: result.length,
      destinations: result,
    };
  }

  async getDestinationWithLikesAndComments(
    destination_id: number,
  ): Promise<any> {
    const destination =
      await this.destinationsRepository.getDestinationWithLikesAndComments(
        destination_id,
      );

    const { destination_likes } = destination;

    // is_liked 가 false 인 항목들을 제외한다.
    const new_destination_likes = destination_likes.filter(
      ({ is_liked }) => is_liked === true,
    );
    const destination_likes_count = new_destination_likes.length;

    return {
      ...destination,
      comment_count: destination.destination_comments.length,
      destination_likes: new_destination_likes,
      destination_likes_count,
    };
  }

  getDestinationsRanking(count: number): Promise<Destination[]> {
    const destinations =
      this.destinationsRepository.getDestinationsRanking(count);

    return destinations;
  }
}

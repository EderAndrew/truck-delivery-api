import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { geocode } from 'opencage-api-client';

@Injectable()
export class GeocodingService {
  async getCoordinates(
    address: string,
  ): Promise<{ latitude: number; longitude: number }> {
    const data = await geocode({
      q: address,
      no_annotations: 1,
      limit: 1,
    });

    if (data.status.code !== 200) {
      throw new InternalServerErrorException(
        `OpenCage error: ${data.status.message}`,
      );
    }

    if (!data.total_results) {
      throw new InternalServerErrorException('Endereço não encontrado');
    }

    const { lat, lng } = data.results[0].geometry;
    return { latitude: lat, longitude: lng };
  }
}

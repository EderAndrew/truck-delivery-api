/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeocodingService {
  private baseUrl = process.env.OPENCAGE_API_URL as string;

  async getCoordinates(address: string) {
    const response = await axios.get(this.baseUrl, {
      params: {
        q: address,
        key: process.env.OPENCAGE_API_KEY,
        limit: 1,
      },
    });

    const result = response.data.results[0];

    if (!result) {
      throw new Error('Endereço não encontrado');
    }

    return {
      latitude: result.geometry.lat,
      longitude: result.geometry.lng,
    };
  }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import type { LineString, Point } from 'geojson';

export interface GraphHopperRoute {
  route: LineString;
  distance_m: number;
  duration_s: number;
}

@Injectable()
export class GraphHopperService {
  private readonly baseUrl =
    process.env.GRAPHHOPPER_BASE_URL ?? 'https://graphhopper.com/api/1';
  private readonly apiKey = process.env.GRAPHHOPPER_API_KEY;

  async getRoute(
    origin: Point,
    destination: Point,
    profile: string,
  ): Promise<GraphHopperRoute> {
    const [oLon, oLat] = origin.coordinates;
    const [dLon, dLat] = destination.coordinates;

    // URLSearchParams correctly serializes repeated keys: point=lat,lon&point=lat,lon
    const params = new URLSearchParams();
    params.append('point', `${oLat},${oLon}`);
    params.append('point', `${dLat},${dLon}`);
    params.append('profile', profile);
    params.append('points_encoded', 'false');
    if (this.apiKey) params.append('key', this.apiKey);

    const response = await axios.get(
      `${this.baseUrl}/route?${params.toString()}`,
    );

    const path = response.data.paths?.[0];
    if (!path) {
      throw new InternalServerErrorException('GraphHopper returned no route');
    }

    return {
      route: path.points as LineString,
      distance_m: path.distance as number,
      duration_s: Math.round((path.time as number) / 1000),
    };
  }
}

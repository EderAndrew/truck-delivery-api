export interface GeoJsonPoint {
  type: 'Point';
  /** [longitude, latitude] */
  coordinates: [number, number];
}

export interface GeoJsonLineString {
  type: 'LineString';
  /** Array of [longitude, latitude] pairs */
  coordinates: [number, number][];
}

export interface RegionSearchRequest {
  selectList: number[][];
  selectPopular: number[];
  recentPosition: { lat: number; lng: number };
  distanceSensitivity: number;
  version?: number;
  country?: string;
}

export interface TopPopularPlace {
  name: string;
  photo: string;
  lat: number;
  lng: number;
}

export interface RegionRecommendation {
  name: string;
  takenDay: number;
  photo: string;
  tendency: string[];
  topPopularPlaceList: TopPopularPlace[];
}

export interface RegionSearchState {
  request: RegionSearchRequest;
  response: RegionRecommendation[];
  error?: { code: number; message: string };
  loading: boolean;
}

export const initialRegionSearchState: RegionSearchState = {
  request: {
    selectList: [],
    selectPopular: [],
    recentPosition: { lat: 0, lng: 0 },
    distanceSensitivity: -1,
    version: 2,
    country: 'Korea',
  },
  response: [],
  error: undefined,
  loading: false,
};
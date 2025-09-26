export interface TopPopularPlace {
  name: string;
  photo: string;
  lat: number;
  lng: number;
}

export interface PlaceResult {
  name: string;
  takenDay: number;
  photo: string;
  tendency: string[];
  topPopularPlaceList: TopPopularPlace[];
}
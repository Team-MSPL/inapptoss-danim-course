export const useDistance = ({
  departure,
  arrival,
}: {
  departure: DistanceType;
  arrival: DistanceType;
}) => {
  const dLat = (departure.lat - arrival.lat) * (Math.PI / 180);
  const dLon = (departure.lng - arrival.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(departure.lat * (Math.PI / 180)) *
      Math.cos(arrival.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = 6371 * c;
  // const distance = Math.ceil(6371 * c); // 두 지점 간의 거리 (단위: km)
  return distance;
};

export interface DistanceType {
  lat: number;
  lng: number;
}

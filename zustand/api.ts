import axiosAuth from "../redux/api";


export async function postRegionSearch(rawData: any) {
  const data = {
    selectList: rawData.selectList,
    selectPopular: rawData.selectPopular,
    recentPosition: rawData.recentPosition,
    distanceSensitivity: rawData.distanceSensitivity,
    version: rawData.version,
    country: rawData.country,
  };
  console.log(data);
  const response = await axiosAuth.post('/regionSearch/run', data);
  return response.data;
}
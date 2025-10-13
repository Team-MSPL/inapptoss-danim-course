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

export async function getRecentSelectList() {
  const response = await axiosAuth.get('/user/recentSelectList');
  return response.data;
}

export async function patchRecentSelectList(recentSelectList: any) {
  const data = {
    recentSelectList: recentSelectList,
  };
  const response = await axiosAuth.patch('/user/recentSelectList', data);
  return response.data;
}
import axiosAuth from "../redux/api";


export async function postRegionSearch(data: any) {
  const url = "https://danimdatabase.com/regionSearch/run";
  const response = await axiosAuth.post(url, data);
  return response.data;
}
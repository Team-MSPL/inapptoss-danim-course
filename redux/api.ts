import axios from "axios";
// import { store } from "../src/store";

const API_ROUTE = "http://3.37.54.226";
const API_ROUTE_RELEASE = "https://danimdatabase.com";
const axiosAuth = axios.create({
  baseURL: API_ROUTE,
  headers: {
    "content-type": "application/json",
    withCredentials: true,
  },
  timeout: 5000,
});
axiosAuth.defaults.headers.Authorization = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyVG9rZW4iOiIwMDA0NzYuMTIzMTIyMy4wNjI1IiwiX2lkIjoiNjY4ZGUxNWRlYzU5NDIzMWE0Zjg3OTMwIiwiaWF0IjoxNzU2MTA5ODc4LCJleHAiOjE3NzE2NjE4Nzh9.h2F458SqfxFhvhVdpMBHMPocypnG9XdGYY0EdPHZcD0`;
axiosAuth.interceptors.response.use(
  (response) => {
    // if (!store.getState().networkSlice.serverConn) {
    // 	store.dispatch(networkSliceActions.setServerConn(true));
    // }
    console.log("aa");
    return response;
  },
  (error) => {
    console.log("aba");
    // if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
    // 	store.dispatch(networkSliceActions.setServerConn(false));
    // } else {
    // 	store.dispatch(networkSliceActions.setServerConn(true));
    // }
    throw error;
  }
);
export default axiosAuth;

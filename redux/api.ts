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

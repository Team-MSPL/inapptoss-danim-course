import { appsInToss } from "@apps-in-toss/framework/plugins";
import { defineConfig } from "react-native-bedrock/config";
import { env } from "@apps-in-toss/framework";

export default defineConfig({
  appName: "danim-course",
  plugins: [
    appsInToss({
      brand: {
        displayName: "danim-course", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
        primaryColor: "#3182F6", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
        icon: "https://danim.me/square_logo.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
        bridgeColorMode: "basic",
      },
      permissions: [],
    }),
    env({
      // 구글 서치 API키
      GOOGLE_API_KEY: "AIzaSyA_nsvAajvyiWj-FeJO6u1-yZYsOBkoPOk",

      // api 라우터
      API_ROUTE: "http://3.37.54.226",
      // api 릴리즈 서버
      API_ROUTE_RELEASE: "https://danimdatabase.com",

      // Google Signin 키
      Google_Signin_Key:
          "70367155908-li7to5i4bq75mpog69prtpmo7t7hnq5e.apps.googleusercontent.com",

      // 네이버 api 키
      NAVER_API_KEY: "Xxpwy1KKSKJ1CmgX7iKDUdWrwUmXMxuMdHAHSb4v",
      // 네이버 api 키 id
      NAVER_API_KEY_id: "m51j8hlfow",

      // 카카오 Rest api 키
      KAKAO_REST_API_KEY: "7dcbff3c20877747849dacb808c37bc2",
      // 카카오 네이티브 키
      KAKAO_NATIVE_KEY: "1059586e7b1423286b1a1a37606f9786",

      // 구글 애드몹 광고 키
      Google_Ads_Key: "ca-app-pub-1677695109210729/8209411556",
      // 구글 애드몹 배너 안드로이드 키
      Google_Ads_Banner_Android: "ca-app-pub-1677695109210729/3719792156",

      // 투어 api 키
      Tour_API_KEY:
          "J7laKTTThB5SZdBdab6YA4Nam%2BgRrYc%2FXdqAzSQ%2FDUhLxMWFSUxBVbrn6WDpvTauz4oW2phb3ojdk9YmlZMPww%3D%3D",

      // ios 쿠폰을 위한 userId 암호화 크립토 키
      CRYPTO_KEY: "danimaabcdadanimacbdaadanimadacb",

      // 트립어드바이저 api 키
      Tripadvisor_KEy: "02F5B2FD8DAD4CFBA7C2D77F11FD9BD8",
    }),
  ],
});

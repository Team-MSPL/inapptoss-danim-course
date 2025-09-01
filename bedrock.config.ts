import { appsInToss } from "@apps-in-toss/framework/plugins";
import { defineConfig } from "react-native-bedrock/config";

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
  ],
});

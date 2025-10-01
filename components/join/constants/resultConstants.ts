import {Dimensions} from "react-native";

const { width: windowWidth } = Dimensions.get('window');
export const CARD_WIDTH = windowWidth - 48;
export const CARD_BORDER_RADIUS = 18;
export const CARD_MARGIN_BOTTOM = 32;

export const DAY_TAB_LIST = [
  { label: '1박 2일 추천', takenDay: 1 },
  { label: '3박 4일 추천', takenDay: 3 },
];
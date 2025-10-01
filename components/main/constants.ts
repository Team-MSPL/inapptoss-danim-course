import { Icon } from '@toss-design-system/react-native';
import React from 'react';

export const TAB_ITEMS = [
  { label: '홈', icon: 'icon-home-mono' },
  { label: '내 여행', icon: 'icon-plane-mono' },
  // { label: '여행 상품', icon: 'icon-shopping-bag-mono' },
  { label: '내 정보', icon: 'icon-user-mono' },
];

export const DUMMY_PRODUCTS = [
  {
    product: {
      _id: 'dummy1',
      sellingProductName: '나트랑 패키지 4박6일',
      sellingProductType: 'package',
      sellingProductContent: '나트랑, 무이네, 달랏 인기 명소 포함',
      sellingProductImage: ['https://placehold.co/128x128?text=상품1'],
      sellingProductPrice: 799000,
      sellingProductPeriod: 6,
      sellingProductRating: 4.8,
      sellingProductReviewCount: 123,
      sellingProductCountry: '베트남',
      sellingProductRegion: ['나트랑', '무이네', '달랏'],
      sellingProductPlaceList: ['쩐꾸옥 사원', '공항'],
      sellingProductCompany: '(주)수호천사컴퍼니',
      sellingProductLink: 'https://example.com/product/1',
      sellingProductLinkClickCount: 0,
    },
    matchCount: 1,
    similarity: 0.6,
  },
  {
    product: {
      _id: 'dummy2',
      sellingProductName: '다낭 핵심투어',
      sellingProductType: 'package',
      sellingProductContent: '다낭, 호이안, 바나힐 포함',
      sellingProductImage: ['https://placehold.co/128x128?text=상품2'],
      sellingProductPrice: 599000,
      sellingProductPeriod: 4,
      sellingProductRating: 4.2,
      sellingProductReviewCount: 98,
      sellingProductCountry: '베트남',
      sellingProductRegion: ['다낭', '호이안', '바나힐'],
      sellingProductPlaceList: ['호이안 구시가지', '바나힐'],
      sellingProductCompany: '(주)수호천사컴퍼니',
      sellingProductLink: 'https://example.com/product/2',
      sellingProductLinkClickCount: 0,
    },
    matchCount: 1,
    similarity: 0.7,
  },
];

export const INFO_MENU = [
  // {
  //   key: 'reservation',
  //   label: '내 예약',
  //   icon: 'icon-order-paper',
  //   onPressNav: '/info/my-reservation',
  // },
  // {
  //   key: 'wishlist',
  //   label: '관심 상품',
  //   icon: 'icon-heart-red',
  //   onPressNav: '/info/my-wishlist',
  // },
  {
    key: 'inquiry',
    label: '문의하기',
    icon: 'icon-user-two-blue-tab',
    onPressNav: '/info/my-inquiry',
  },
  // {
  //   key: 'guide',
  //   label: '이용 안내',
  //   icon: 'icon-pencil',
  //   onPressNav: '/info/my-guide',
  // },
];

export const INQUIRY_MENU = [
  {
    key: 'one-on-one',
    label: '1:1 문의하기',
    icon: 'icon-open-chat-bubble-question',
    onPressNav: '/info/one-on-one-inquiry',
  },
  {
    key: 'my-inquiry-list',
    label: '내 문의',
    icon: 'icon-document-my',
    onPressNav: '/info/my-inquiry-list',
  },
];

import { useDispatch } from 'react-redux';
import { useAppSelector } from 'store';
import { regionSearchActions } from '../redux/regionSearchSlice';

// 순서/구성: list와 photo 배열 개수 및 순서 100% 일치!
export const tendencyData = [
  {
    title: '누구와 떠나시나요?',
    multi: true,
    list: ['나홀로', '연인과', '친구와', '가족과', '효도', '자녀와', '반려동물과'],
    photo: [
      'icon-person-default-man',
      'https://static.toss.im/2d-emojis/png/4x/u1F491.png',
      'https://static.toss.im/2d-emojis/png/4x/u1F468_u1F3FC_u200D_u1F91D_u200D_u1F468_u1F3FB.png',
      'https://static.toss.im/2d-emojis/png/4x/u1F468_u200D_u1F469_u200D_u1F467_u200D_u1F466.png',
      'icon-emoji-grandparents',
      'icon-child',
      'https://static.toss.im/2d-emojis/png/4x/u1F9AE.png',
    ],
  },
  {
    title: '테마는 무엇인가요?',
    multi: true,
    list: ['힐링', '활동적인', '배움이 있는', '맛있는', '교통이 편한', '알뜰한'],
    photo: [
      'https://static.toss.im/2d-emojis/png/4x/u1F331.png', // 힐링 🌱
      'https://static.toss.im/2d-emojis/png/4x/u1F93F.png', // 활동적인 🤿
      'https://static.toss.im/2d-emojis/png/4x/u1F4A1.png', // 배움이 있는 💡
      'https://static.toss.im/2d-emojis/png/4x/u1F37D.png', // 맛있는 🍽️
      'https://static.toss.im/2d-emojis/png/4x/u1F6E3.png', // 교통이 편한 🛣️
      'https://static.toss.im/2d-emojis/png/4x/u1F4B5.png', // 알뜰한 💸
    ],
  },
  {
    title: '무엇을 하고싶으신가요?',
    multi: true,
    list: ['레저 스포츠', '산책', '드라이브', '이색체험', '쇼핑', '시티투어'],
    photo: [
      'https://static.toss.im/2d-emojis/png/4x/u1F6B4.png', // 레저 스포츠 🚴
      'https://static.toss.im/2d-emojis/png/4x/u1F6B6.png', // 산책 🚶
      'https://static.toss.im/2d-emojis/png/4x/u1F698.png', // 드라이브 🚗
      'https://static.toss.im/2d-emojis/png/4x/u1F3C3.png', // 이색체험 🪂(없으면 달리기)
      'https://static.toss.im/2d-emojis/png/4x/u1F6CD.png', // 쇼핑 🛍️
      'https://static.toss.im/2d-emojis/png/4x/u1F3E2.png', // 시티투어 🏢
    ],
  },
  {
    title: '가고 싶은 장소는 어디인가요?',
    multi: true,
    list: [
      '바다',
      '산',
      '실내여행지',
      '문화시설',
      '사진 명소',
      '유적지',
      '박물관',
      '전통',
      '공원',
      '사찰',
      '성지',
    ],
    photo: [
      'https://static.toss.im/2d-emojis/png/4x/u1F30A.png', // 바다 🌊
      'https://static.toss.im/2d-emojis/png/4x/u1F3D4.png', // 산 ⛰️
      'https://static.toss.im/2d-emojis/png/4x/u1F3E2.png', // 실내여행지 🏢
      'https://static.toss.im/2d-emojis/png/4x/u1F3AD.png', // 문화시설 🎭
      'https://static.toss.im/2d-emojis/png/4x/u1F4F7.png', // 사진 명소 📷
      'https://static.toss.im/2d-emojis/png/4x/u1F3DB.png', // 유적지 🏛️
      'https://static.toss.im/2d-emojis/png/4x/u1F3A8.png', // 박물관 🎨
      'https://static.toss.im/2d-emojis/png/4x/u1F3EF.png', // 전통 🏯
      'https://static.toss.im/2d-emojis/png/4x/u1F3DE.png', // 공원 🏞️
      'https://static.toss.im/2d-emojis/png/4x/u1F54B.png', // 사찰 🕌
      'https://static.toss.im/2d-emojis/png/4x/u1F54C.png', // 성지 🕍
    ],
  },
  {
    title: '계절은 언제가 좋으신가요?',
    multi: true,
    list: ['봄', '여름', '가을', '겨울'],
    photo: [
      'https://static.toss.im/2d-emojis/png/4x/u1F33C.png', // 봄
      'https://static.toss.im/2d-emojis/png/4x/u1F3DD.png', // 여름
      'https://static.toss.im/2d-emojis/png/4x/u1F341.png', // 가을
      'https://static.toss.im/2d-emojis/png/4x/u2744.png', // 겨울
    ],
  },
];

export const useRegionTendencyHandler = () => {
  // 최상위에서 한번만 호출!
  const selectList = useAppSelector((state) => state.regionSearchSlice.request.selectList ?? []);
  // regionSearchSlice.request도 최상위에서 받아오기
  const regionRequest = useAppSelector((state) => state.regionSearchSlice.request);
  const dispatch = useDispatch();

  const handleButtonClick = ({ index, item }: { index: number; item: number }) => {
    // 선택값 toggle
    const updatedCategory = [
      ...(selectList[index] ?? Array(tendencyData[index].list.length).fill(0)),
    ];
    updatedCategory[item] = updatedCategory[item] === 1 ? 0 : 1;
    // 전체 selectList 갱신
    const newSelectList = [...selectList];
    newSelectList[index] = updatedCategory;
    dispatch(
      regionSearchActions.setRequest({
        ...regionRequest,
        selectList: newSelectList,
      }),
    );
  };

  return { tendencyData, handleButtonClick };
};

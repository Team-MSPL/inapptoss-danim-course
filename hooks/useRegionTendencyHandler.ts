import { useDispatch } from 'react-redux';
import { useAppSelector } from 'store';
import { regionSearchActions} from "../redux/regionSearchSlice";

// 새로운 성향 데이터 (사진 등 추가 가능)
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
    // photo: [...],
  },
  {
    title: '무엇을 하고싶으신가요?',
    multi: true,
    list: ['레저 스포츠', '산책', '드라이브코스', '이색체험', '쇼핑', '시티투어', '역사 여행'],
    // photo: [...],
  },
  {
    title: '어떤 자연/문화가 좋으신가요?',
    multi: true,
    list: ['바다', '산', '자연경관', '문화시설', '사진 명소', '전통'],
    // photo: [...],
  },
  {
    title: '계절은 언제가 좋으신가요?',
    multi: true,
    list: ['봄', '여름', '가을', '겨울'],
    photo: [
      'https://static.toss.im/2d-emojis/png/4x/u1F33C.png', // 봄
      'https://static.toss.im/2d-emojis/png/4x/u1F3DD.png', // 여름
      'https://static.toss.im/2d-emojis/png/4x/u1F341.png', // 가을
      'https://static.toss.im/2d-emojis/png/4x/u2744.png',  // 겨울
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
    const updatedCategory = [...(selectList[index] ?? Array(tendencyData[index].list.length).fill(0))];
    updatedCategory[item] = updatedCategory[item] === 1 ? 0 : 1;
    // 전체 selectList 갱신
    const newSelectList = [...selectList];
    newSelectList[index] = updatedCategory;
    dispatch(regionSearchActions.setRequest({
      ...regionRequest, // **최상위에서 받아온 regionRequest 사용**
      selectList: newSelectList,
    }));
  };

  return { tendencyData, handleButtonClick };
};
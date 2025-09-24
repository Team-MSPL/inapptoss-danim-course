import { useDispatch } from 'react-redux';
import { useAppSelector } from 'store';
import { regionSearchActions} from "../redux/regionSearchSlice";

// 새로운 성향 데이터 (사진 등 추가 가능)
export const tendencyData = [
  {
    title: '누구와 떠나시나요?',
    multi: true,
    list: ['나홀로', '연인과', '친구와', '가족과', '효도', '자녀와'],
    // photo: [...], // 필요시 추가
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
    // photo: [...],
  }
];

export const useRegionTendencyHandler = () => {
  // regionSearchSlice에서 selectList 가져옴
  const selectList = useAppSelector((state) => state.regionSearchSlice.request.selectList ?? []);
  const dispatch = useDispatch();

  // 버튼 클릭 핸들러
  const handleButtonClick = ({ index, item }: { index: number; item: number }) => {
    // 선택값 toggle
    const updatedCategory = [...(selectList[index] ?? Array(tendencyData[index].list.length).fill(0))];
    updatedCategory[item] = updatedCategory[item] === 1 ? 0 : 1;
    // 전체 selectList 갱신
    const newSelectList = [...selectList];
    newSelectList[index] = updatedCategory;
    dispatch(regionSearchActions.setRequest({
      ...useAppSelector((state) => state.regionSearchSlice.request),
      selectList: newSelectList,
    }));
  };

  return { tendencyData, handleButtonClick };
};
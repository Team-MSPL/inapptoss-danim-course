import { AnyAction, combineReducers, configureStore, Reducer } from '@reduxjs/toolkit';
import travelSliceReducer from '../redux/travle-slice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-bedrock/native/@react-native-async-storage/async-storage';

const persistConfig = {
  key: 'root',
  // version: 1,
  storage: AsyncStorage,
};
const appReducer = combineReducers({
  travelSlice: travelSliceReducer,
});

const rootReducer: Reducer = (state: RootState, action: AnyAction) => {
  //const exceptionKeys = ['hasLaunched', 'hasPermissionGranted'];
  // if (action.type === 'user/logout/fulfilled') {
  // 	// 로그아웃 시 로컬스토리지 초기화
  // 	AsyncStorage.getAllKeys().then((allKeys) => {
  // 		const removeKeys = allKeys.filter((k) => !exceptionKeys.some((ek) => ek === k));
  // 		AsyncStorage.multiRemove(removeKeys);
  // 	});
  // 	const settingState = state.setting;
  // 	state = { setting: settingState } as RootState;
  // }

  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof appReducer>;
type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

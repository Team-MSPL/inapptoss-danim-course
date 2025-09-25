import { colors, ProgressBar } from '@toss-design-system/react-native';
import { CustomColor } from '../utill/custom-color';
import { routeStack } from '../utill/route-stack';
import { useNavigation } from '@granite-js/react-native';

export const CustomProgressBar = () => {
  const navigation = useNavigation();
  const stepList = Object.keys(routeStack).filter(
    (key) => key !== '/title' && key !== '/finalCheck',
  );
  const index = stepList.indexOf(navigation.getState()?.routes?.at(-1)?.name.split('/enroll')[1]);

  return (
    <ProgressBar
      progress={((index + 1) / (Object.keys(routeStack).length - 2)) * 100}
      size="light"
      color={colors.blue500}
      style={{ marginBottom: 10, marginHorizontal: 24 }}
    />
  );
};

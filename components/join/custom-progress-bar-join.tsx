import { colors, ProgressBar } from '@toss-design-system/react-native';

type CustomProgressBarJoinProps = {
  currentIndex: number;
};

export const CustomProgressBarJoin = ({ currentIndex }: CustomProgressBarJoinProps) => {
  const stackLength = 8;
  return (
    <ProgressBar
      progress={((currentIndex + 1) / (stackLength - 2)) * 100}
      size="light"
      color={colors.blue500}
      style={{ marginBottom: 10, marginHorizontal: 24 }}
    />
  );
};

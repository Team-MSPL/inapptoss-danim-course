import { colors, Text, Top } from "@toss-design-system/react-native";

export const StepText = ({ subTitle1, subTitle2, title }) => {
  return (
    <Top
      title={
        <Text typography="st5" fontWeight="semibold" color={colors.grey900}>
          {title}
          {/* 성향을 토대로 다님 AI가 추천을해줘요! */}
        </Text>
      }
      subtitle1={
        <Text typography="t5" fontWeight="medium" color={colors.grey600}>
          {subTitle1}
          {/* 1분만에 다님으로{`\n`} 여행 일정을 추천받아보세요 */}
        </Text>
      }
      subtitle2={
        !!subTitle2 && (
          <Text typography="t7" fontWeight="medium" color={colors.grey500}>
            {subTitle2}
          </Text>
        )
      }
    ></Top>
  );
};

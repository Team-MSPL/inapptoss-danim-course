import { Button, FixedBottomCTA } from "@toss-design-system/react-native";
import { useNavigation } from "react-native-bedrock";
import { routeStack } from "../utill/route-stack";

export const RouteButton = ({ disabled }: { disabled?: boolean }) => {
  const navigation = useNavigation();
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };
  const handleNext = () => {
    navigation.navigate(
      (navigation.getState()?.routes?.at(-1)?.name.split("/enroll")[1] ==
      "/distance"
        ? ""
        : "/enroll") +
        routeStack[
          navigation.getState()?.routes?.at(-1)?.name.split("/enroll")[1]
        ]?.next
    );
  };
  return (
    <FixedBottomCTA.Double
      leftButton={
        <Button type="dark" style="weak" display="block" onPress={handleBack}>
          이전으로
        </Button>
      }
      rightButton={
        <Button
          display="block"
          onPress={handleNext}
          disabled={disabled ?? false}
        >
          다음으로
        </Button>
      }
    />
  );
};

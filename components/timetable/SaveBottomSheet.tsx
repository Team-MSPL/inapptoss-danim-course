import {BottomSheet, Button, colors, Text} from "@toss-design-system/react-native";
import {closeView} from "react-native-bedrock";

type SaveBottomSheetProps = {
    onSave: () => void;
    navigation: any;
    bottomSheet: any;
};

export function SaveBottomSheet({ onSave, navigation, bottomSheet }: SaveBottomSheetProps) {
    return (
        <>
            <Text
                typography="t4"
                fontWeight="bold"
                color={colors.grey800}
                style={{ alignSelf: "center", marginTop: 35 }}
            >
                일정을 저장할까요?
            </Text>
            <Text
                typography="t5"
                fontWeight="regular"
                color={colors.grey600}
                style={{ textAlign: "center" }}
            >
                저장된 일정은 오른쪽 상단 {"\n"}비행기 아이콘에서 볼 수 있어요.
            </Text>
            <BottomSheet.CTA.Double
                leftButton={
                    <Button type="dark" style="weak" display="block" onPress={closeView}>
                        나가기
                    </Button>
                }
                rightButton={
                    <Button
                        type="primary"
                        style="fill"
                        display="block"
                        onPress={() => {
                            bottomSheet.close();
                            onSave();
                            navigation.reset({ index: 0, routes: [{ name: "/" }] });
                        }}
                    >
                        저장 후 나가기
                    </Button>
                }
            />
        </>
    );
}
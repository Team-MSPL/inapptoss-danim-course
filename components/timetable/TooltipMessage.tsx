import {colors, Text} from "@toss-design-system/react-native";
import { View } from "react-native";

export function TooltipMessage() {
    return (
        <View
            style={{
                position: "absolute", right: 38, bottom: 148, padding: 20,
                borderRadius: 12, backgroundColor: colors.white, elevation: 1,
            }}
        >
            <Text typography="t6" fontWeight="bold" color={colors.grey800}>
                수정하려면 클릭하세요
            </Text>
        </View>
    );
}
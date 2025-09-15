import { View } from "react-native";
import {colors, IconButton} from "@toss-design-system/react-native";

type EditButtonProps = {
    onPress: () => void;
};

export function EditButton({ onPress }: EditButtonProps) {
    return (
        <View
            style={{
                position: "absolute",
                right: 30, bottom: 100, width: 48, height: 48,
                borderRadius: 12, backgroundColor: colors.grey200,
            }}
        >
            <IconButton
                name="icon-pencil-mono"
                variant="clear"
                onPress={onPress}
            />
        </View>
    );
}
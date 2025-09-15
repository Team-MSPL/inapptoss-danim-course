import { View } from "react-native";
import {Button, colors, IconButton, Tooltip } from "@toss-design-system/react-native";

type EditButtonProps = {
    onPress: () => void;
    showTooltip?: boolean;
};

export function EditButton({ onPress, showTooltip }: EditButtonProps) {
    return (
        <View
            style={{
                position: "absolute",
                right: 30,
                bottom: 150,
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.grey200,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <View style={{position: 'absolute', bottom: 48, right: 96}}>
                <Tooltip
                    message="수정하려면 클릭하세요"
                    open={showTooltip}
                    placement="top"
                    offset={10}
                    messageAlign="center"
                    motionVariant="weak"
                    strategy="absolute"
                    contentPositionByRatio={1}
                >
                    <View style={{ position: 'absolute', left: 48}}>
                        <IconButton
                            name="icon-pencil-mono"
                            variant="clear"
                            onPress={onPress}
                        />
                    </View>
                </Tooltip>
            </View>
        </View>
    );
}
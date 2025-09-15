import { View, Text, StyleSheet } from "react-native";
import { colors, Tooltip } from "@toss-design-system/react-native";

export function TooltipMessage() {
    return (
        <View style={styles.container}>
            <View style={styles.bubble}>
                <Text style={styles.text}>수정하려면 클릭하세요</Text>
            </View>
            <View style={styles.arrow} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    bubble: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 2,
    },
    text: {
        color: colors.grey800,
        fontSize: 15,
        fontWeight: "500",
    },
    arrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 12,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: colors.white,
        marginTop: -2,
    },
});
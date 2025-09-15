import React from "react";
import { Modal, View, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { Tooltip, ListRow } from "@toss-design-system/react-native";

type GuideModalProps = {
    visible: boolean;
    showGuideTooltip: boolean;
    onClose: () => void;
};

export default function GuideModal({ visible, showGuideTooltip, onClose }: GuideModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    {/* 툴팁 위치 */}
                    <View style={styles.tooltipContainer}>
                        {showGuideTooltip && (
                            <Tooltip
                                open={true}
                                size={187}
                                placement="bottom"
                                offset={10}
                                messageAlign="center"
                                message={'안녕하세요. 김토스입니다.'}
                                motion={'weak'}
                                onPressOutside={onClose}
                            >
                                <View style={{alignItems: 'center', justifyContent: 'center'}}>
                                    <ListRow.Icon name={"icon-share-dots-mono"} />
                                </View>
                            </Tooltip>
                        )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    tooltipContainer: {
        marginBottom: 240,
        alignItems: "center",
    },
});
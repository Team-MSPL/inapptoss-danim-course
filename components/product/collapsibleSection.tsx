import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, colors, Icon } from "@toss-design-system/react-native";

type Props = {
  title: string;
  open: boolean;
  onToggle: () => void;
  completed?: boolean;
  children?: React.ReactNode;
};

export default function CollapsibleSection({ title, open, onToggle, completed = false, children }: Props) {
  // Controlled component: 내부에서 open 상태를 직접 변경하지 않고, 부모의 onToggle 호출만 함.
  // (애니메이션 등은 부모에서 open prop을 받고 처리하도록 권장)
  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text typography="t5" color={colors.grey800} style={{ marginRight: 8 }}>{title}</Text>
          {completed ? <Icon name="icon-check" size={16} color={colors.blue500} /> : null}
        </View>
        <Icon name={open ? "icon-arrow-up-mono" : "icon-arrow-down-mono"} size={24} color={colors.grey400} />
      </TouchableOpacity>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionBody: {
    paddingBottom: 18,
    paddingTop: 6,
  },
});
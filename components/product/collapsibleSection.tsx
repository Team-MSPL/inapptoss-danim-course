import React from "react";
import {StyleSheet, TouchableOpacity, View} from "react-native";
import {colors, Icon, Text} from "@toss-design-system/react-native";

export function CollapsibleSection({
                              title,
                              open,
                              onToggle,
                              completed,
                              children,
                            }: {
  title: string;
  open: boolean;
  onToggle: () => void;
  completed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text typography="t5" color={colors.grey800} style={{ marginRight: 8 }}>{title}</Text>
          {completed && <Icon name="icon-check" size={16} color={colors.blue500} />}
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
  },
  sectionHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionBody: {
    paddingBottom: 18,
    paddingTop: 6,
  },
});
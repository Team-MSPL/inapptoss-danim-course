import React from "react";
import { View } from "react-native";
import { Text, colors } from "@toss-design-system/react-native";

export default function ModuleShell({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 10, alignItems: "center" }}>
        <View style={{ width: 4, height: 29, backgroundColor: colors.green200, borderRadius: 100 }} />
        <Text typography="t4" fontWeight="medium" style={{ lineHeight: 32 }}>
          {title}
        </Text>
      </View>
      <View>{children}</View>
    </View>
  );
}
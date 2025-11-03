import { StyleSheet } from "react-native";
import { colors } from "@toss-design-system/react-native";

export default StyleSheet.create({
  countrySelect: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  optionRowActive: {
    backgroundColor: colors.blue500,
  },
});
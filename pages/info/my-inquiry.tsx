import {colors, Icon, ListRow, PartnerNavigation, Text} from '@toss-design-system/react-native';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {BedrockRoute, useNavigation} from "react-native-bedrock";
import {INQUIRY_MENU} from "../../components/main/constants";

export const Route = BedrockRoute('/info/my-inquiry', {
  validateParams: (params) => params,
  component: MyInquiry,
});

export default function MyInquiry() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <PartnerNavigation
        title="다님"
        icon={{
          source: {
            uri: 'https://static.toss.im/appsintoss/561/454aa293-9dc9-4c77-9662-c42d09255859.png',
          },
        }}
      ></PartnerNavigation>
      <View style={styles.menuList}>
        {INQUIRY_MENU.map((item) => (
          <ListRow
            key={item.key}
            left={
              <Icon
                name={item.icon}
                size={18}
                style={styles.iconWrapper}
              />
            }
            contents={
              <ListRow.Texts
                type="1RowTypeA"
                top={item.label}
                topProps={{
                  typography: 't5',
                  fontWeight: 'semibold',
                  color: colors.grey700,
                }}
              />
            }
            right={
              <Icon name="icon-arrow-right-mono" size={24} />
            }
            onPress={() => {
              if (item.onPressNav) {
                navigation.navigate(item.onPressNav);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  menuList: {
    marginTop: 18,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  iconWrapper: { width: 36, alignItems: 'center', justifyContent: 'center', marginRight: 16},
});
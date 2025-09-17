import { Icon } from '@toss-design-system/react-native';
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const TAB_ITEMS = [
  { label: '홈', icon: 'home-outline' },
  { label: '내 여행', icon: 'airplane-outline' },
  { label: '여행 상품', icon: 'shopping-outline' },
  { label: '내 정보', icon: 'account-outline' },
];

export default function CustomBottomBar({ currentIndex, onTabPress }) {
  return (
    <View style={styles.container}>
      {TAB_ITEMS.map((item, idx) => (
        <TouchableOpacity
          key={item.label}
          style={styles.tabItem}
          onPress={() => onTabPress(idx)}
          activeOpacity={0.8}
        >
          <Icon
            name={item.icon}
            size={28}
            color={currentIndex === idx ? "#222" : "#bbb"}
          />
          <Text style={[styles.tabLabel, currentIndex === idx && { color: "#222", fontWeight: "bold" }]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
});
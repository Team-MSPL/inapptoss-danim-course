import { Icon } from '@toss-design-system/react-native';
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TAB_ITEMS } from './constants';

type CustomBottomBarProps = {
  currentIndex: number;
  onTabPress: (idx: number) => void;
};

export default function CustomBottomBar({ currentIndex, onTabPress }: CustomBottomBarProps) {
  return (
    <View style={styles.container}>
      {TAB_ITEMS.map((item, idx) => (
        <TouchableOpacity
          key={item.label}
          style={styles.tabItem}
          onPress={() => onTabPress(idx)}
          activeOpacity={0.8}
        >
          <Icon name={item.icon} size={24} color={currentIndex === idx ? '#222' : '#bbb'} />
          <Text
            style={[styles.tabLabel, currentIndex === idx && { color: '#222', fontWeight: 'bold' }]}
          >
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
    bottom: 36,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    paddingHorizontal: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: '500',
    marginTop: 4,
  },
});

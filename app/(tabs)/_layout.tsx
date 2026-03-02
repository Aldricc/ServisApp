import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSheetsAutoSync } from '@/hooks/useSheetsAutoSync';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = '#007AFF';
  const insets = useSafeAreaInsets();

  // Auto sync: polling 10 detik + sync saat app resume
  useSheetsAutoSync();


  // Hardcode tab bar height Android agar tidak tertutup system navigation bar
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 100;
  const tabBarPaddingBottom = Platform.OS === 'ios' ? 28 : 48;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 10,
        },
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Daftar Servis',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Pengaturan',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

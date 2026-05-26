import React from 'react';
import { Tabs } from 'expo-router';
import {
  House,
  ClockCounterClockwise,
  Users,
  GearSix,
} from 'phosphor-react-native';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';

const TAB_ICONS = {
  index: House,
  history: ClockCounterClockwise,
  team: Users,
  settings: GearSix,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Hub',
  history: 'History',
  team: 'Team',
  settings: 'Settings',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: {
          fontFamily: fonts.sans,
          fontSize: 11,
        },
        tabBarShowLabel: true,
        tabBarIcon: ({ color, focused }) => {
          const Icon = TAB_ICONS[route.name as keyof typeof TAB_ICONS];
          if (!Icon) return null;
          return (
            <Icon
              size={22}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          );
        },
        tabBarLabel: TAB_LABELS[route.name] ?? route.name,
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="team" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

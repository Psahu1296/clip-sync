import CustomTabBar from '@/components/CustomTabBar';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Clips',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
        }}
      />
       <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
        }}
        listeners={() => ({
            tabPress: (e) => {
                e.preventDefault(); // Prevent navigation to the empty add screen
            }
        })}
      />
       <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

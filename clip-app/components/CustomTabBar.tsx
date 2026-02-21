import Colors from '@/constants/Colors';
import { hapticFeedback } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const addRouteIndex = state.routes.findIndex(r => r.name === 'add');
  const addRoute = state.routes[addRouteIndex];
  const addOptions = addRoute ? descriptors[addRoute.key].options : null;

  const handlePress = (route: any, isAdd: boolean) => {
    hapticFeedback.light();
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (state.index !== state.routes.indexOf(route) && !event.defaultPrevented) {
      if (isAdd) {
          console.log("Add button pressed");
      } else {
          navigation.navigate(route.name);
      }
    }
  };

  const handleLongPress = (route: any) => {
    hapticFeedback.medium();
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;
            const isAddButton = route.name === 'add';

            if (isAddButton) {
                return (
                    <View key={route.key} style={styles.tabItem} /> // Spacer
                );
            }

            let iconName: any = 'square';
            if (route.name === 'index') iconName = 'clipboard';
            else if (route.name === 'favorites') iconName = 'star';
            else if (route.name === 'sync') iconName = 'phone-portrait';
            else if (route.name === 'settings') iconName = 'settings';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={(options as any).tabBarTestID}
                onPress={() => handlePress(route, false)}
                onLongPress={() => handleLongPress(route)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isFocused && styles.focusedIconContainer]}>
                   {route.name === 'sync' ? (
                     <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 24 }}>
                       <Ionicons 
                          name={isFocused ? "laptop" : "laptop-outline"} 
                          size={20} 
                          color={isFocused ? Colors.dark.tint : Colors.dark.textSecondary} 
                       />
                       <Ionicons 
                          name={isFocused ? "phone-portrait" : "phone-portrait-outline"} 
                          size={14} 
                          color={isFocused ? Colors.dark.tint : Colors.dark.textSecondary} 
                          style={{ marginLeft: -6, marginBottom: -1, backgroundColor: isFocused ? `rgba(13, 147, 242, 0.15)` : 'transparent' }}
                       />
                     </View>
                   ) : (
                     <Ionicons 
                        name={isFocused ? iconName : iconName + '-outline'} 
                        size={24} 
                        color={isFocused ? Colors.dark.tint : Colors.dark.textSecondary} 
                     />
                   )}
                </View>
                <Text style={[styles.label, { color: isFocused ? Colors.dark.tint : Colors.dark.textSecondary }]}>
                  {label as string}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>

      {/* Floating Add Button - Positioned outside the clipped BlurView */}
      {addRoute && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={addOptions?.tabBarAccessibilityLabel}
            onPress={() => handlePress(addRoute, true)}
            onLongPress={() => handleLongPress(addRoute)}
            style={styles.floatingAddButton}
            activeOpacity={0.8}
          >
              <View style={styles.addButton}>
                <Ionicons name="add" size={32} color="#FFF" />
              </View>
          </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  tabBarContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 39, 48, 0.75)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  iconContainer: {
      marginBottom: 4,
      borderRadius: 12,
      padding: 6,
  },
  focusedIconContainer: {
      backgroundColor: 'rgba(13, 147, 242, 0.15)',
      borderRadius: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  floatingAddButton: {
      position: 'absolute',
      top: -25, // Float above the bar
      left: '50%',
      marginLeft: -30, // Half of width
      zIndex: 1001,
  },
  addButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: Colors.dark.tint,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.dark.tint,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 4,
      borderColor: '#101b22', // Match main background
  }
});

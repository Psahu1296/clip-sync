import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as TaskManager from 'expo-task-manager';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from '@/context/AuthContext';
import { ClipboardProvider, Clip } from '@/context/ClipboardContext';
import { QueryProvider } from '@/api';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete_v2';

// Prevent the splash screen from auto-hiding before we're ready
SplashScreen.preventAutoHideAsync();

// Configure Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

// Task definition (for future native builds with background capabilities)
const BACKGROUND_CLIPBOARD_TASK = 'BACKGROUND_CLIPBOARD_TASK';

TaskManager.defineTask(BACKGROUND_CLIPBOARD_TASK, async () => {
  try {
    console.log("[Background Task] Checking clipboard...", new Date().toISOString());

    const content = await Clipboard.getStringAsync();

    if (!content) {
      console.log("[Background Task] No content accessible");
      return;
    }

    const savedClipsJson = await AsyncStorage.getItem('saved-clips');
    let clips: Clip[] = savedClipsJson ? JSON.parse(savedClipsJson) : [];

    // Check if duplicate
    if (clips.length > 0 && clips[0].content === content) {
      console.log("[Background Task] Duplicate content ignored.");
      return;
    }

    // Helper (duplicated from context, ideally shared util)
    const detectType = (c: string): 'url'|'code'|'text' => {
      const urlRegex = /^(http|https):\/\/[^ "]+$/;
      if (urlRegex.test(c)) return 'url';
      if (c.includes('const ') || c.includes('import ') || c.includes('function ')) return 'code';
      return 'text';
    };

    const newClip: Clip = {
      id: Date.now().toString(),
      type: detectType(content),
      content: content,
      timestamp: Date.now(),
      device: 'Background Task',
      isPinned: false,
    };

    clips = [newClip, ...clips];
    await AsyncStorage.setItem('saved-clips', JSON.stringify(clips));

    console.log(`[Background Task] SUCCESS! Saved: ${content.substring(0, 20)}...`);

    // Notify user
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Clip Saved',
        body: content.length > 50 ? content.substring(0, 50) + '...' : content,
      },
      trigger: null,
    });

  } catch (error) {
    console.log("[Background Task] Error:", error);
  }
});

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);

  // Check onboarding status
  useEffect(() => {
    const prepare = async () => {
      try {
        const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        setInitialRoute(onboardingComplete === 'true' ? '(tabs)' : 'permissions-setup');
      } catch (e) {
        setInitialRoute('permissions-setup');
      }
    };
    prepare();
  }, []);

  // Handle errors
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Set app ready when fonts and initial route are determined
  useEffect(() => {
    if (fontsLoaded && initialRoute) {
      setAppIsReady(true);
    }
  }, [fontsLoaded, initialRoute]);

  // Hide splash screen when app is ready
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryProvider>
          <AuthProvider>
            <ClipboardProvider>
              <ThemeProvider value={DarkTheme}>
                <BottomSheetModalProvider>
                  <Stack initialRouteName={initialRoute!}>
                    <Stack.Screen name="permissions-setup" options={{ headerShown: false }} />
                    <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                  </Stack>
                </BottomSheetModalProvider>
              </ThemeProvider>
            </ClipboardProvider>
          </AuthProvider>
        </QueryProvider>
      </GestureHandlerRootView>
    </View>
  );
}

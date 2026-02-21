import Colors from '@/constants/Colors';
import ClipboardAccessibility from '@/modules/ClipboardAccessibility';
import { hapticFeedback } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  isRequired: boolean;
  isEnabled: boolean;
  platform: 'android' | 'ios' | 'all';
}

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete_v2';

export default function PermissionsSetupScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState<PermissionItem[]>([
    {
      id: 'clipboard',
      title: 'Clipboard Access',
      description: 'Required to read and save your copied content',
      icon: 'clipboard-outline',
      isRequired: true,
      isEnabled: false,
      platform: 'all',
    },
    {
      id: 'accessibility',
      title: 'Accessibility Service',
      description: 'Enables background clipboard monitoring even when app is closed',
      icon: 'accessibility-outline',
      isRequired: false,
      isEnabled: false,
      platform: 'android',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Get notified when new clips are saved in background',
      icon: 'notifications-outline',
      isRequired: false,
      isEnabled: false,
      platform: 'all',
    },
  ]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Filter permissions based on platform
  const filteredPermissions = permissions.filter(
    (p) => p.platform === 'all' || p.platform === Platform.OS
  );

  const totalSteps = filteredPermissions.length + 1; // +1 for welcome step

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / (totalSteps - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps]);

  const checkPermissions = useCallback(async () => {
    const updatedPermissions = [...permissions];

    // Check clipboard access
    try {
      await Clipboard.hasStringAsync();
      const clipboardIndex = updatedPermissions.findIndex((p) => p.id === 'clipboard');
      if (clipboardIndex !== -1) {
        updatedPermissions[clipboardIndex].isEnabled = true;
      }
    } catch (e) {
      console.log('Clipboard not accessible');
    }

    // Check accessibility service (Android only)
    if (Platform.OS === 'android') {
      try {
        const isEnabled = await ClipboardAccessibility.isServiceEnabled();
        const accessibilityIndex = updatedPermissions.findIndex((p) => p.id === 'accessibility');
        if (accessibilityIndex !== -1) {
          updatedPermissions[accessibilityIndex].isEnabled = isEnabled;
        }
      } catch (e) {
        console.log('Accessibility check failed');
      }
    }

    // Check notifications
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const notifIndex = updatedPermissions.findIndex((p) => p.id === 'notifications');
      if (notifIndex !== -1) {
        updatedPermissions[notifIndex].isEnabled = status === 'granted';
      }
    } catch (e) {
      console.log('Notification check failed');
    }

    setPermissions(updatedPermissions);
  }, [permissions]);

  useEffect(() => {
    checkPermissions();

    // Re-check when screen regains focus (user returns from settings)
    const interval = setInterval(checkPermissions, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePermissionAction = async (permissionId: string) => {
    hapticFeedback.light();

    switch (permissionId) {
      case 'clipboard':
        // Trigger clipboard access prompt
        await Clipboard.getStringAsync();
        await checkPermissions();
        break;

      case 'accessibility':
        if (Platform.OS === 'android') {
          ClipboardAccessibility.openAccessibilitySettings();
        }
        break;

      case 'notifications':
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          // If denied, could show alert to go to settings
        }
        await checkPermissions();
        break;
    }
  };

  const handleNext = () => {
    hapticFeedback.light();
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      // Animate transition
      slideAnim.setValue(30);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSkip = () => {
    hapticFeedback.light();
    handleNext();
  };

  const handleComplete = async () => {
    hapticFeedback.success();
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace('/(tabs)');
  };

  const renderWelcomeStep = () => (
    <Animated.View
      style={[
        styles.stepContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.welcomeIconContainer}>
        <LinearGradient
          colors={[Colors.dark.tint, '#0a7bd4']}
          style={styles.welcomeIconGradient}
        >
          <Ionicons name="shield-checkmark" size={48} color="#FFF" />
        </LinearGradient>
      </View>

      <Text style={styles.welcomeTitle}>Let's Set Up Permissions</Text>
      <Text style={styles.welcomeSubtitle}>
        ClipSync needs a few permissions to work properly. We'll guide you through each one.
      </Text>

      <View style={styles.permissionPreview}>
        {filteredPermissions.map((permission, index) => (
          <View key={permission.id} style={styles.previewItem}>
            <View style={styles.previewIconContainer}>
              <Ionicons name={permission.icon} size={20} color={Colors.dark.tint} />
            </View>
            <View style={styles.previewTextContainer}>
              <Text style={styles.previewTitle}>{permission.title}</Text>
              <Text style={styles.previewBadge}>
                {permission.isRequired ? 'Required' : 'Recommended'}
              </Text>
            </View>
            {permission.isEnabled && (
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            )}
          </View>
        ))}
      </View>

      <View style={styles.privacyNote}>
        <Ionicons name="lock-closed" size={16} color={Colors.dark.textSecondary} />
        <Text style={styles.privacyNoteText}>
          Your data stays on your device. We never send your clipboard to external servers.
        </Text>
      </View>
    </Animated.View>
  );

  const renderPermissionStep = (permission: PermissionItem) => (
    <Animated.View
      style={[
        styles.stepContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View
        style={[
          styles.permissionIconContainer,
          permission.isEnabled && styles.permissionIconEnabled,
        ]}
      >
        <Ionicons
          name={permission.icon}
          size={48}
          color={permission.isEnabled ? '#34C759' : Colors.dark.tint}
        />
      </View>

      <View style={styles.statusBadge}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: permission.isEnabled ? '#34C759' : '#FF9F0A' },
          ]}
        />
        <Text style={styles.statusText}>
          {permission.isEnabled ? 'Enabled' : 'Not Enabled'}
        </Text>
      </View>

      <Text style={styles.permissionTitle}>{permission.title}</Text>
      <Text style={styles.permissionDescription}>{permission.description}</Text>

      {!permission.isEnabled && (
        <>
          {permission.id === 'accessibility' && Platform.OS === 'android' && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>How to enable:</Text>
              <View style={styles.instructionStep}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  Tap the button below to open Settings
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  Find "ClipSync" or "ClipApp" in the list
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  Toggle the switch to enable
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.instructionNumber}>4</Text>
                <Text style={styles.instructionText}>
                  Return to this app
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.enableButton}
            onPress={() => handlePermissionAction(permission.id)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.dark.tint, '#0a7bd4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enableButtonGradient}
            >
              <Ionicons
                name={permission.id === 'accessibility' ? 'settings-outline' : 'checkmark-circle-outline'}
                size={20}
                color="#FFF"
              />
              <Text style={styles.enableButtonText}>
                {permission.id === 'accessibility' ? 'Open Settings' : 'Enable'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}

      {permission.isEnabled && (
        <View style={styles.enabledContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#34C759" />
          <Text style={styles.enabledText}>All set!</Text>
        </View>
      )}

      {!permission.isRequired && !permission.isEnabled && (
        <Text style={styles.optionalText}>
          This permission is optional. You can enable it later in Settings.
        </Text>
      )}
    </Animated.View>
  );

  const currentPermission =
    currentStep > 0 ? filteredPermissions[currentStep - 1] : null;
  const isLastStep = currentStep === totalSteps - 1;
  const canProceed =
    currentStep === 0 ||
    (currentPermission && (currentPermission.isEnabled || !currentPermission.isRequired));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#101b22', '#0d1419']} style={StyleSheet.absoluteFill} />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} of {totalSteps}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 0 && renderWelcomeStep()}
        {currentPermission && renderPermissionStep(currentPermission)}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {isLastStep ? (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#34C759', '#30B350']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeButtonGradient}
            >
              <Text style={styles.completeButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.footerButtons}>
            {currentStep > 0 && !currentPermission?.isRequired && (
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 0 ? 'Start Setup' : 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101b22',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.tint,
    borderRadius: 2,
  },
  progressText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
  },
  // Welcome Step
  welcomeIconContainer: {
    marginBottom: 32,
  },
  welcomeIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  permissionPreview: {
    width: '100%',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 24,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 147, 242, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewTextContainer: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  previewBadge: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  // Permission Step
  permissionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(13, 147, 242, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(13, 147, 242, 0.3)',
  },
  permissionIconEnabled: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionDescription: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.tint,
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.tint,
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    overflow: 'hidden',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 22,
  },
  enableButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  enableButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  enableButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  enabledContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  enabledText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 12,
  },
  optionalText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Footer
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skipButtonText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.dark.tint,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

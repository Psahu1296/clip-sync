import Colors from '@/constants/Colors';
import ClipboardAccessibility from '@/modules/ClipboardAccessibility';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AccessibilitySetupScreen() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkAccessibilityStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const enabled = await ClipboardAccessibility.isServiceEnabled();
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error checking accessibility status:', error);
      setIsEnabled(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkAccessibilityStatus();
    }, [checkAccessibilityStatus])
  );

  const openAccessibilitySettings = () => {
    if (Platform.OS === 'android') {
      ClipboardAccessibility.openAccessibilitySettings();
    } else {
      Alert.alert(
        'iOS Not Supported',
        'Accessibility Services for clipboard monitoring are only available on Android. On iOS, please use the Shortcuts automation method instead.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderStep = (number: number, text: string, subtext?: string) => (
    <View style={styles.stepContainer}>
      <View style={styles.stepNumberContainer}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepText}>{text}</Text>
        {subtext && <Text style={styles.stepSubtext}>{subtext}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
          title: 'Accessibility Service',
          headerShown: true,
          headerBackTitle: 'Settings',
      }} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerIcon}>
            <Ionicons name="accessibility" size={60} color={Colors.dark.tint} />
        </View>

        <Text style={styles.title}>Background Clipboard Access</Text>
        
        {Platform.OS === 'android' ? (
          <>
            <Text style={styles.description}>
              Enable the ClipApp Accessibility Service to automatically capture clipboard content even when the app is closed.
            </Text>

            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Service Status</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: isEnabled ? '#34C759' : '#FF3B30' }]} />
                  <Text style={styles.statusText}>{isEnabled ? 'Enabled' : 'Disabled'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="shield-checkmark" size={24} color="#FF9F0A" />
              <Text style={styles.warningText}>
                This app uses Accessibility Services only to monitor clipboard changes. We never access or store any other data from your device.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Setup Instructions</Text>
              
              {renderStep(1, 'Tap "Open Accessibility Settings" below')}
              {renderStep(2, 'Find "ClipApp" in the list of services')}
              {renderStep(3, 'Toggle the switch to enable the service')}
              {renderStep(4, 'Accept the permission prompt', 'Android will warn you about accessibility services - this is normal.')}
              {renderStep(5, 'Return to the app', 'ClipApp will now capture clipboard content automatically.')}
              
              <TouchableOpacity style={styles.actionButton} onPress={openAccessibilitySettings}>
                <Ionicons name="settings-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Open Accessibility Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                • The accessibility service runs in the background{'\n'}
                • When you copy text anywhere on your device, it's automatically saved{'\n'}
                • Works even when the app is completely closed{'\n'}
                • Minimal battery impact{'\n'}
                • Can be disabled anytime from Android Settings
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Ionicons name="lock-closed" size={20} color={Colors.dark.textSecondary} />
              <Text style={styles.privacyText}>
                All clipboard data is stored locally on your device. Nothing is sent to external servers.
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.description}>
              Accessibility Services for background clipboard monitoring are only available on Android.
            </Text>
            
            <View style={styles.iosAlternative}>
              <Ionicons name="information-circle" size={24} color={Colors.dark.tint} />
              <Text style={styles.iosText}>
                For iOS, please use the Shortcuts automation method available in Settings → Capture Modes → Background Listener.
              </Text>
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 24,
  },
  headerIcon: {
    alignSelf: 'center',
    marginBottom: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    color: '#FF9F0A',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    color: Colors.dark.tint,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    color: Colors.dark.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  stepSubtext: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  actionButton: {
    backgroundColor: Colors.dark.tint,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  privacyText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  iosAlternative: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  iosText: {
    flex: 1,
    marginLeft: 12,
    color: Colors.dark.text,
    fontSize: 15,
    lineHeight: 22,
  },
});

import Colors from '@/constants/Colors';
import { useClipboard } from '@/context/ClipboardContext';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, Modal } from 'react-native';
import ClipboardAccessibility, { FloatingButtonPosition, FloatingButtonPositionType } from '@/modules/clipboard-accessibility';

const positionLabels: Record<FloatingButtonPositionType, string> = {
  [FloatingButtonPosition.TOP_LEFT]: 'Top Left',
  [FloatingButtonPosition.TOP_RIGHT]: 'Top Right',
  [FloatingButtonPosition.BOTTOM_LEFT]: 'Bottom Left',
  [FloatingButtonPosition.BOTTOM_RIGHT]: 'Bottom Right',
};

// Pro benefits for the subscription card
const PRO_BENEFITS = [
  { icon: 'infinite-outline', text: '200 clips storage (vs 30)' },
  { icon: 'cloud-outline', text: 'Cloud sync across devices' },
  { icon: 'images-outline', text: 'Image clipboard support' },
  { icon: 'shield-checkmark-outline', text: 'Priority support' },
];

// Get user initials from email or name
const getInitials = (email?: string): string => {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

export default function SettingsScreen() {
  const { clearAll, isPassiveModeEnabled, togglePassiveMode, clipLimit, clips } = useClipboard();
  const { user, isAuthenticated, signOut } = useAuth();
  const [buttonPosition, setButtonPosition] = useState<FloatingButtonPositionType>(FloatingButtonPosition.BOTTOM_RIGHT);
  const [showPositionModal, setShowPositionModal] = useState(false);

  const isPro = user?.plan === 'pro';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your clips will remain on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/sign-in' as any);
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      ClipboardAccessibility.getFloatingButtonPosition().then(setButtonPosition);
    }
  }, []);

  const handlePositionChange = (position: FloatingButtonPositionType) => {
    setButtonPosition(position);
    ClipboardAccessibility.setFloatingButtonPosition(position);
    setShowPositionModal(false);
  };

  // User Profile Card Component
  const renderProfileCard = () => {
    if (!isAuthenticated) {
      return (
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(99, 102, 241, 0.05)']}
            style={styles.profileGradient}
          />
          <View style={styles.profileContent}>
            <View style={styles.guestAvatarContainer}>
              <Ionicons name="person-outline" size={32} color={Colors.dark.textSecondary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Guest User</Text>
              <Text style={styles.profileSubtext}>Sign in to sync your clips</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/sign-in' as any)}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFF" />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.profileCard}>
        <LinearGradient
          colors={isPro ? ['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)'] : ['rgba(99, 102, 241, 0.2)', 'rgba(99, 102, 241, 0.05)']}
          style={styles.profileGradient}
        />
        <View style={styles.profileContent}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarContainer, isPro && styles.avatarContainerPro]}>
              <Text style={styles.avatarText}>{getInitials(user?.id)}</Text>
            </View>
            {isPro && (
              <View style={styles.crownBadge}>
                <Ionicons name="diamond" size={12} color="#FFD700" />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{user?.id?.split('@')[0] || 'User'}</Text>
              {isPro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.profileSubtext}>
              {isPro ? 'Premium Member' : `Free Plan • ${clips.length}/${clipLimit} clips`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.dark.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  // Subscription Card for Free Users
  const renderSubscriptionCard = () => {
    if (isPro) return null;

    return (
      <TouchableOpacity style={styles.subscriptionCard} activeOpacity={0.8}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.subscriptionGradient}
        />
        <View style={styles.subscriptionContent}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.subscriptionIconContainer}>
              <Ionicons name="diamond" size={24} color="#FFF" />
            </View>
            <View style={styles.subscriptionTitleContainer}>
              <Text style={styles.subscriptionTitle}>Upgrade to Pro</Text>
              <Text style={styles.subscriptionPrice}>$2.99/month</Text>
            </View>
          </View>

          <View style={styles.benefitsList}>
            {PRO_BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name={benefit.icon as any} size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.upgradeButtonContainer}>
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPositionModal = () => (
    <Modal
      visible={showPositionModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPositionModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPositionModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Floating Button Position</Text>
          <Text style={styles.modalSubtitle}>Choose where the capture button appears</Text>

          <View style={styles.positionGrid}>
            <View style={styles.positionRow}>
              <TouchableOpacity
                style={[
                  styles.positionOption,
                  buttonPosition === FloatingButtonPosition.TOP_LEFT && styles.positionOptionSelected
                ]}
                onPress={() => handlePositionChange(FloatingButtonPosition.TOP_LEFT)}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={20}
                  color={buttonPosition === FloatingButtonPosition.TOP_LEFT ? '#FFF' : Colors.dark.textSecondary}
                  style={{ transform: [{ rotate: '-45deg' }] }}
                />
                <Text style={[
                  styles.positionOptionText,
                  buttonPosition === FloatingButtonPosition.TOP_LEFT && styles.positionOptionTextSelected
                ]}>Top Left</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.positionOption,
                  buttonPosition === FloatingButtonPosition.TOP_RIGHT && styles.positionOptionSelected
                ]}
                onPress={() => handlePositionChange(FloatingButtonPosition.TOP_RIGHT)}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={20}
                  color={buttonPosition === FloatingButtonPosition.TOP_RIGHT ? '#FFF' : Colors.dark.textSecondary}
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
                <Text style={[
                  styles.positionOptionText,
                  buttonPosition === FloatingButtonPosition.TOP_RIGHT && styles.positionOptionTextSelected
                ]}>Top Right</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.positionRow}>
              <TouchableOpacity
                style={[
                  styles.positionOption,
                  buttonPosition === FloatingButtonPosition.BOTTOM_LEFT && styles.positionOptionSelected
                ]}
                onPress={() => handlePositionChange(FloatingButtonPosition.BOTTOM_LEFT)}
              >
                <Ionicons
                  name="arrow-down-outline"
                  size={20}
                  color={buttonPosition === FloatingButtonPosition.BOTTOM_LEFT ? '#FFF' : Colors.dark.textSecondary}
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
                <Text style={[
                  styles.positionOptionText,
                  buttonPosition === FloatingButtonPosition.BOTTOM_LEFT && styles.positionOptionTextSelected
                ]}>Bottom Left</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.positionOption,
                  buttonPosition === FloatingButtonPosition.BOTTOM_RIGHT && styles.positionOptionSelected
                ]}
                onPress={() => handlePositionChange(FloatingButtonPosition.BOTTOM_RIGHT)}
              >
                <Ionicons
                  name="arrow-down-outline"
                  size={20}
                  color={buttonPosition === FloatingButtonPosition.BOTTOM_RIGHT ? '#FFF' : Colors.dark.textSecondary}
                  style={{ transform: [{ rotate: '-45deg' }] }}
                />
                <Text style={[
                  styles.positionOptionText,
                  buttonPosition === FloatingButtonPosition.BOTTOM_RIGHT && styles.positionOptionTextSelected
                ]}>Bottom Right</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowPositionModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSection = (title: string, items: any[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
      <View style={styles.sectionBody}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.item, index === items.length - 1 && styles.lastItem]}
            onPress={item.action}
            disabled={item.type === 'switch'}
            activeOpacity={0.7}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={20} color="#FFF" />
              </View>
              <Text style={styles.itemText}>{item.label}</Text>
            </View>
            {item.type === 'switch' ? (
              <Switch
                value={item.value}
                onValueChange={item.action}
                trackColor={{ false: '#3A3A3C', true: Colors.dark.tint }}
                thumbColor="#FFF"
              />
            ) : item.type === 'button' ? (
              <View style={styles.itemRight}>
                <Text style={{ color: item.actionColor || Colors.dark.textSecondary }}>{item.actionLabel}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.dark.textSecondary} style={{ marginLeft: 4 }} />
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Settings</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        {renderProfileCard()}

        {/* Subscription Card for Free Users */}
        {renderSubscriptionCard()}

        {renderSection('Capture Modes', [
          {
            label: 'Background Listener',
            icon: 'infinite',
            color: '#FF9F0A',
            type: 'link',
            action: () => router.push('/background-setup' as any)
          },
          ...(Platform.OS === 'android' ? [{
            label: 'Accessibility Service',
            icon: 'accessibility',
            color: '#5856D6',
            type: 'link',
            action: () => router.push('/accessibility-setup' as any)
          }] : []),
          {
            label: 'Foreground Listener',
            icon: 'clipboard',
            color: '#34C759',
            type: 'switch',
            value: isPassiveModeEnabled,
            action: togglePassiveMode
          },
          {
            label: 'Share Sheet',
            icon: 'share',
            color: '#007AFF',
            type: 'link',
            action: () => router.push('/extensions-help?type=share')
          },
          {
            label: 'Keyboard',
            icon: 'keypad',
            color: '#5856D6',
            type: 'link',
            action: () => router.push('/extensions-help?type=keyboard')
          },
        ])}

        {Platform.OS === 'android' && renderSection('Floating Button', [
          {
            label: 'Button Position',
            icon: 'move',
            color: '#0d93f2',
            type: 'button',
            actionLabel: positionLabels[buttonPosition],
            action: () => setShowPositionModal(true)
          },
          {
            label: 'Overlay Permission',
            icon: 'layers',
            color: '#AF52DE',
            type: 'link',
            action: () => ClipboardAccessibility.openOverlaySettings()
          },
        ])}

        {renderSection('General', [
          { label: 'History Limit', icon: 'time', color: '#007AFF', type: 'button', actionLabel: `${clipLimit} clips` },
          { label: 'Auto-Clear', icon: 'trash', color: '#FF9500', type: 'switch', value: false },
        ])}

        {renderSection('Privacy', [
          { label: 'Blur Sensitive Content', icon: 'eye-off', color: '#5856D6', type: 'switch', value: true },
          { label: 'Ignore Passwords', icon: 'key', color: '#FF2D55', type: 'switch', value: true },
        ])}

        {renderSection('Sync', [
          { label: 'Cloud Sync', icon: 'cloud', color: '#34C759', type: 'switch', value: false },
          { label: 'Devices', icon: 'phone-portrait', color: '#AF52DE', type: 'button', actionLabel: '1 Active' },
        ])}

        {renderSection('Data', [
          { label: 'Clear All History', icon: 'close-circle', color: '#FF3B30', type: 'button', actionLabel: 'Clear', actionColor: '#FF3B30', action: clearAll },
        ])}

        <Text style={styles.footerText}>ClipSync v1.0.0 (Build 42)</Text>
      </ScrollView>

      {renderPositionModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: Colors.dark.text,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  // Profile Card
  profileCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    overflow: 'hidden',
  },
  profileGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainerPro: {
    backgroundColor: '#FFD700',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  crownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  profileSubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.tint,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  signOutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Subscription Card
  subscriptionCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  subscriptionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  subscriptionContent: {
    padding: 20,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionTitleContainer: {
    marginLeft: 14,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  subscriptionPrice: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 2,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  upgradeButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 20,
    letterSpacing: 0.5,
  },
  sectionBody: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    color: Colors.dark.textSecondary,
    fontSize: 13,
    marginTop: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  positionGrid: {
    gap: 12,
  },
  positionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  positionOption: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  positionOptionSelected: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  positionOptionText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  positionOptionTextSelected: {
    color: '#FFF',
  },
  modalCloseButton: {
    backgroundColor: Colors.dark.tint,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ExtensionsHelpScreen() {
  const { type } = useLocalSearchParams<{ type: 'share' | 'keyboard' }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
          title: type === 'share' ? 'Share Sheet' : type === 'keyboard' ? 'Keyboard Extension' : 'Extensions',
          headerShown: true,
          headerBackTitle: 'Settings',
      }} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
            <Ionicons 
                name={type === 'share' ? 'share' : 'keypad'} 
                size={80} 
                color={Colors.dark.tint} 
            />
        </View>

        <Text style={styles.title}>
            {type === 'share' ? 'Share to Clip App' : 'Custom Keyboard'}
        </Text>

        <Text style={styles.description}>
            {type === 'share' 
                ? 'The Share Sheet extension allows you to save content from any app directly to your clipboard history without opening the app.'
                : 'The Keyboard extension gives you a dedicated "Save" button in your keyboard to quickly capture typed text.'}
        </Text>

        <View style={styles.infoBox}>
            <Ionicons name="construct-outline" size={24} color={Colors.dark.textSecondary} />
            <Text style={styles.infoText}>
                This feature requires native system integration.
            </Text>
        </View>

        <Text style={styles.sectionHeader}>Status</Text>
        <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: '#FF3B30' }]} />
            <Text style={styles.statusText}>Not Installed</Text>
        </View>

        <Text style={styles.subtext}>
            To enable this feature, a custom development build is required with native extensions configured in Xcode/Android Studio. 
            {"\n\n"}
            This app is currently configured for "Passive Mode" which listens to clipboard changes while active.
        </Text>

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
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
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
    marginBottom: 30,
  },
  infoBox: {
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 12,
    width: '100%',
  },
  infoText: {
    color: Colors.dark.text,
    fontSize: 15,
    flex: 1,
  },
  sectionHeader: {
      alignSelf: 'flex-start',
      color: Colors.dark.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 10,
      marginTop: 10,
  },
  statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.dark.surface,
      width: '100%',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
  },
  statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
  },
  statusText: {
      color: Colors.dark.text,
      fontSize: 16,
      fontWeight: '500',
  },
  subtext: {
      fontSize: 14,
      color: Colors.dark.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
  }
});

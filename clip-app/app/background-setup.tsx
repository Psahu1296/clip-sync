import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BackgroundSetupScreen() {
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(Platform.OS === 'ios' ? 'ios' : 'android');

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
          title: 'Background Capture',
          headerShown: true,
          headerBackTitle: 'Settings',
      }} />

      <View style={styles.tabs}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'ios' && styles.activeTab]}
            onPress={() => setActiveTab('ios')}
        >
            <Text style={[styles.tabText, activeTab === 'ios' && styles.activeTabText]}>iOS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'android' && styles.activeTab]} 
            onPress={() => setActiveTab('android')}
        >
            <Text style={[styles.tabText, activeTab === 'android' && styles.activeTabText]}>Android</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerIcon}>
            <Ionicons name="infinite" size={60} color={Colors.dark.tint} />
        </View>

        <Text style={styles.title}>Enable Universal Capture</Text>
        <Text style={styles.description}>
            Modern operating systems block apps from reading your clipboard in the background for privacy. 
            {"\n\n"}
            Follow these official workarounds to enable seamless saving even when the app is closed.
        </Text>

        {activeTab === 'ios' ? (
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Method: Siri Shortcuts Automation</Text>
                {renderStep(1, 'Open the "Shortcuts" app on your iPhone.')}
                {renderStep(2, 'Go to the "Automation" tab (center bottom).')}
                {renderStep(3, 'Tap "+" to create a new Personal Automation.')}
                {renderStep(4, 'Scroll down and select "App", then choose "When I open" -> "Any App".', 'Alternatively, use "When Copy" if available on your iOS version.')}
                {renderStep(5, 'Add Action: "Save to ClipApp".', 'Search for our app actions.')}
                {renderStep(6, 'Turn OFF "Ask Before Running".', 'This ensures it runs silently in the background.')}
                
                <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL('shortcuts://')}>
                    <Text style={styles.actionButtonText}>Open Shortcuts App</Text>
                </TouchableOpacity>
            </View>
        ) : (
             <View style={styles.section}>
                <Text style={styles.sectionHeader}>Method: Keyboard / Assistant</Text>
                <Text style={styles.warnText}>
                    Android 10+ restricts background clipboard access to the default input method (Keyboard) or Assistant.
                </Text>

                {renderStep(1, 'Enable the ClipApp Keyboard.', 'Go to System Settings > Languages & Input > On-screen keyboard.')}
                {renderStep(2, 'Switch to ClipApp Keyboard when you want to save.', 'Or use the "Paste & Save" button on the dedicated keyboard row.')}
                {renderStep(3, 'Alternative: Use "Share" from the text selection menu.', 'Highlight text -> Share -> ClipApp.')}
                
                <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openSettings()}>
                    <Text style={styles.actionButtonText}>Open Settings</Text>
                </TouchableOpacity>
            </View>
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
  tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: Colors.dark.border,
      backgroundColor: Colors.dark.surface,
  },
  tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
  },
  activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: Colors.dark.tint,
  },
  tabText: {
      fontSize: 16,
      color: Colors.dark.textSecondary,
      fontWeight: '600',
  },
  activeTabText: {
      color: Colors.dark.tint,
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
    marginBottom: 30,
  },
  section: {
      backgroundColor: Colors.dark.surface,
      borderRadius: 16,
      padding: 20,
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
  warnText: {
      color: '#FF9F0A',
      fontSize: 15,
      marginBottom: 20,
      lineHeight: 22,
  },
  actionButton: {
      backgroundColor: Colors.dark.tint,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
  },
  actionButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
  }
});

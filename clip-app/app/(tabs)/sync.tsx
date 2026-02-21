import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function SyncScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Sync Status</Text>
      
      <View style={styles.contentContainer}>
          <LinearGradient
            colors={['rgba(13, 147, 242, 0.15)', 'rgba(30, 39, 48, 0.5)']}
            style={styles.statusCard}
          >
              <View style={styles.iconCircle}>
                  <Image 
                    source={require('@/assets/images/premium-icon.png')} 
                    style={styles.miniLogo}
                    resizeMode="contain"
                  />
              </View>
              <Text style={styles.statusTitle}>Local Mode Active</Text>
              <Text style={styles.statusDesc}>
                  Your clipboard history is stored securely on this device. No data is sent to the cloud.
              </Text>
          </LinearGradient>

          <View style={styles.infoBox}>
              <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                      <Ionicons name="shield-checkmark" size={20} color="#34C759" />
                  </View>
                  <View style={{flex: 1}}>
                      <Text style={styles.featureTitle}>Private & Secure</Text>
                      <Text style={styles.featureDesc}>Data never leaves your phone unless you manually export it.</Text>
                  </View>
              </View>
              
               <View style={styles.infoDivider} />

              <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                      <Ionicons name="cloud-offline" size={20} color={Colors.dark.textSecondary} />
                  </View>
                  <View style={{flex: 1}}>
                      <Text style={styles.featureTitle}>Cloud Sync Disabled</Text>
                      <Text style={styles.featureDesc}>Enable sync in settings if you want to share clips across devices.</Text>
                  </View>
              </View>
          </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: Colors.dark.text,
      paddingHorizontal: 24,
      marginTop: 20,
      marginBottom: 32,
      letterSpacing: -1,
  },
  contentContainer: {
      paddingHorizontal: 24,
      alignItems: 'center',
  },
  statusCard: {
      width: '100%',
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  miniLogo: {
      width: 44,
      height: 44,
  },
  statusTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFF',
      marginBottom: 8,
      letterSpacing: -0.5,
  },
  statusDesc: {
      color: Colors.dark.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      fontSize: 15,
  },
  infoBox: {
      width: '100%',
      backgroundColor: Colors.dark.surface,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 4,
  },
  featureIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  featureTitle: {
      color: '#FFF',
      fontWeight: '600',
      fontSize: 16,
      marginBottom: 2,
  },
  featureDesc: {
      color: Colors.dark.textSecondary,
      fontSize: 13,
      lineHeight: 18,
  },
  infoDivider: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      marginVertical: 20,
  }
});

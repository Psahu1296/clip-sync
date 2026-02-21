import { timingConfig } from '@/utils/animations';
import { hapticFeedback } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { ...timingConfig(800), toValue: 1 }),
      Animated.timing(slideAnim, { ...timingConfig(800), toValue: 0 }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    hapticFeedback.success();
    // Perform an initial check to "warm up" access and trigger system prompts if any (iOS 14+)
    await Clipboard.hasStringAsync();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#101b22', '#0d1419']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/premium-icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>ClipSync</Text>
        <Text style={styles.subtitle}>
          Professional clipboard management with a privacy-first approach.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.dark.tint} />
            </View>
            <View>
                <Text style={styles.featureTitle}>Secure & Private</Text>
                <Text style={styles.featureDesc}>Your data stays on your device.</Text>
            </View>
          </View>
           <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
                <Ionicons name="sync" size={20} color={Colors.dark.tint} />
            </View>
            <View>
                <Text style={styles.featureTitle}>Smart Sync</Text>
                <Text style={styles.featureDesc}>Optional end-to-end encrypted sync.</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
                <Ionicons name="flash" size={20} color={Colors.dark.tint} />
            </View>
            <View>
                <Text style={styles.featureTitle}>Instant Access</Text>
                <Text style={styles.featureDesc}>Search and copy in seconds.</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.8}>
          <LinearGradient
            colors={[Colors.dark.tint, '#0a7bd4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.terms}>
          By continuing, you agree to our <Text style={{ color: Colors.dark.tint }}>Privacy Policy</Text>.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101b22',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  features: {
    width: '100%',
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(13, 147, 242, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  footer: {
    padding: 32,
    paddingBottom: 48,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  terms: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    opacity: 0.6,
  },
});

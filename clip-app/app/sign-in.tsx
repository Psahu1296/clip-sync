import Colors from '@/constants/Colors';
import { useGoogleAuth } from '@/api/hooks/useAuth';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, isAuthenticated } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  const { signIn: googleSignIn, isLoading, isReady, error } = useGoogleAuth({
    onSuccess: async (authResponse) => {
      try {
        await signIn(authResponse);
        setIsSigningIn(false);
        router.replace('/(tabs)');
      } catch (err) {
        setIsSigningIn(false);
        Alert.alert('Error', 'Failed to complete sign in. Please try again.');
      }
    },
    onError: (err) => {
      setIsSigningIn(false);
      Alert.alert('Sign In Failed', err.message || 'Something went wrong. Please try again.');
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!isReady || isLoading) return;
    setIsSigningIn(true);
    googleSignIn();
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#101b22', '#0d1419', '#101b22']}
        style={StyleSheet.absoluteFill}
      />

      {/* Background decoration */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo and Title */}
        <Animated.View
          style={[
            styles.headerSection,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.dark.tint, '#0a7bd4']}
              style={styles.logoGradient}
            >
              <Ionicons name="clipboard" size={48} color="#FFF" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>ClipSync</Text>
          <Text style={styles.subtitle}>
            Sync your clipboard across all your devices seamlessly
          </Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="sync" size={20} color={Colors.dark.tint} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Cross-device Sync</Text>
              <Text style={styles.featureDescription}>
                Access your clips on any device
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.dark.tint} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Secure & Private</Text>
              <Text style={styles.featureDescription}>
                End-to-end encrypted storage
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash" size={20} color={Colors.dark.tint} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Instant Access</Text>
              <Text style={styles.featureDescription}>
                Background clipboard monitoring
              </Text>
            </View>
          </View>
        </View>

        {/* Sign In Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.googleButton,
              (!isReady || isSigningIn) && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={!isReady || isSigningIn}
            activeOpacity={0.8}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://www.google.com/favicon.ico' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.termsText}>
          By signing in, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
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
  backgroundDecoration: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Colors.dark.tint,
    opacity: 0.05,
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    right: -width * 0.5,
  },
  circle2: {
    width: width,
    height: width,
    bottom: -width * 0.3,
    left: -width * 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 147, 242, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  buttonSection: {
    marginTop: 'auto',
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  skipButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.dark.tint,
  },
});

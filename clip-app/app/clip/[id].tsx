import Colors from '@/constants/Colors';
import { useClipboard } from '@/context/ClipboardContext';
import { hapticFeedback } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ClipDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { clips, deleteClip, pinClip } = useClipboard();
  
  const clip = clips.find(c => c.id === id);

  if (!clip) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: 'white' }}>Clip not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: Colors.dark.tint, marginTop: 20 }}>Go Back</Text></TouchableOpacity>
      </View>
    );
  }

  const handleShare = async () => {
    hapticFeedback.light();
    await Share.share({
        message: clip.content,
    });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(clip.content);
    hapticFeedback.success();
  };

  const handleDelete = () => {
    hapticFeedback.warning();
    deleteClip(clip.id);
    router.back();
  };

  const handlePin = () => {
    hapticFeedback.medium();
    pinClip(clip.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{clip.type.toUpperCase()}</Text>
        <TouchableOpacity onPress={handlePin} style={styles.pinButton}>
          <Ionicons name={clip.isPinned ? "pin" : "pin-outline"} size={22} color={clip.isPinned ? Colors.dark.tint : Colors.dark.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentScroll}>
        <View style={styles.card}>
            {clip.type === 'image' ? (
                 <View style={styles.imagePlaceholder}>
                     <Ionicons name="image" size={64} color={Colors.dark.textSecondary} />
                     <Text style={{color: Colors.dark.textSecondary, marginTop: 10}}>Image Content (Mock)</Text>
                 </View>
            ) : (
                <Text style={[styles.contentText, clip.type === 'code' && styles.codeFont]}>{clip.content}</Text>
            )}
        </View>

        <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={Colors.dark.textSecondary} />
                <Text style={styles.metaText}>{new Date(clip.timestamp).toLocaleString()}</Text>
            </View>
            <View style={styles.metaItem}>
                <Ionicons name="phone-portrait-outline" size={16} color={Colors.dark.textSecondary} />
                <Text style={styles.metaText}>{clip.device}</Text>
            </View>
        </View>

        <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(13, 147, 242, 0.1)' }]}>
                    <Ionicons name="copy-outline" size={22} color={Colors.dark.tint} />
                </View>
                <Text style={styles.actionText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Ionicons name="share-outline" size={22} color={Colors.dark.text} />
                </View>
                <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Ionicons name="trash-outline" size={22} color={Colors.dark.danger} />
                </View>
                <Text style={[styles.actionText, {color: Colors.dark.danger}]}>Delete</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  center: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
      padding: 8,
  },
  pinButton: {
      padding: 8,
  },
  headerTitle: {
      color: Colors.dark.text,
      fontWeight: 'bold',
      fontSize: 14,
      letterSpacing: 1.5,
      opacity: 0.6,
  },
  contentScroll: {
      padding: 24,
  },
  card: {
      backgroundColor: Colors.dark.surface,
      borderRadius: 24,
      padding: 24,
      minHeight: 240,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 5,
  },
  contentText: {
      color: Colors.dark.text,
      fontSize: 17,
      lineHeight: 26,
      letterSpacing: -0.3,
  },
  codeFont: {
      fontFamily: 'Courier',
      color: '#CBD5E1',
      fontSize: 15,
  },
  imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
  },
  metaContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 40,
      paddingHorizontal: 4,
  },
  metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  metaText: {
      color: Colors.dark.textSecondary,
      fontSize: 14,
      fontWeight: '500',
  },
  actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
  },
  actionText: {
      color: Colors.dark.text,
      fontWeight: '600',
      fontSize: 14,
  },
});

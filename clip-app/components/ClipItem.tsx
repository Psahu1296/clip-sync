import Colors from '@/constants/Colors';
import { Clip } from '@/context/ClipboardContext';
import { hapticFeedback } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ClipItemProps {
  clip: Clip;
}

export default function ClipItem({ clip }: ClipItemProps) {
  const getIcon = () => {
    switch (clip.type) {
      case 'url': return 'link-outline';
      case 'code': return 'code-slash-outline';
      case 'image': return 'image-outline';
      default: return 'text-outline';
    }
  };

  const getTimeString = (timestamp: number) => {
      const diff = Date.now() - timestamp;
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins} mins ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} hr ago`;
      return 'Yesterday';
  };

  const handleCopy = async () => {
    hapticFeedback.success();
    await Clipboard.setStringAsync(clip.content);
  };

  const handlePress = () => {
    hapticFeedback.light();
  };

  return (
    <Link href={`/clip/${clip.id}`} asChild onPress={handlePress}>
      <TouchableOpacity style={styles.container} activeOpacity={0.7}>
        <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: getIconColor(clip.type) + '20' }]}>
                 <Ionicons name={getIcon()} size={20} color={getIconColor(clip.type)} />
            </View>
            <View style={styles.headerText}>
                <Text style={styles.contentTitle} numberOfLines={1}>
                    {clip.type === 'image' ? 'Image' : clip.content.trim()}
                </Text>
                 {clip.type === 'url' && (
                    <Text style={styles.subContent} numberOfLines={1}>{clip.content}</Text>
                 )}
            </View>
             
             <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
               <Ionicons name="copy-outline" size={18} color={Colors.dark.textSecondary} />
             </TouchableOpacity>
        </View>

        {clip.type === 'code' && (
             <View style={styles.codePreview}>
                 <Text style={styles.codeText} numberOfLines={3}>{clip.content}</Text>
             </View>
        )}
        
        {clip.type === 'text' && (
            <Text style={styles.textContent} numberOfLines={3}>{clip.content}</Text>
        )}

        {clip.type === 'image' && (
             <View style={styles.imagePreview}>
                 <Text style={{color: Colors.dark.textSecondary}}>Image Preview</Text>
             </View>
        )}

        <View style={styles.footer}>
            <View style={styles.deviceInfo}>
                <Ionicons name={getDeviceIcon(clip.device)} size={12} color={Colors.dark.textSecondary} />
                <Text style={styles.metadata}>{clip.device}</Text>
            </View>
            <Text style={styles.metadata}>{getTimeString(clip.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

function getIconColor(type: string) {
    switch (type) {
        case 'url': return '#5AC8FA'; // Light Blue
        case 'code': return '#AF52DE'; // Purple
        case 'image': return '#FF2D55'; // Pink
        default: return Colors.dark.textSecondary; // Grey
    }
}

function getDeviceIcon(device: string) {
    if (device.toLowerCase().includes('iphone')) return 'phone-portrait-outline';
    if (device.toLowerCase().includes('mac')) return 'laptop-outline';
    if (device.toLowerCase().includes('ipad')) return 'tablet-landscape-outline';
    return 'desktop-outline';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  contentTitle: {
      color: Colors.dark.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
  },
  subContent: {
      color: Colors.dark.textSecondary,
      fontSize: 12,
  },
  copyButton: {
      padding: 8,
  },
  codePreview: {
      backgroundColor: Colors.dark.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      fontFamily: 'Menlo',
  },
  codeText: {
      color: '#A9A9A9',
      fontSize: 13,
      fontFamily: 'Courier',
  },
  textContent: {
      color: '#D1D1D6',
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
  },
  imagePreview: {
      height: 100,
      backgroundColor: Colors.dark.background,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  deviceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  metadata: {
      color: Colors.dark.textSecondary,
      fontSize: 12,
  },
});

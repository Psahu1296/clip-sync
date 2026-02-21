import Colors from '@/constants/Colors';
import { useClipboard } from '@/context/ClipboardContext';
import { hapticFeedback } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function AddScreen() {
  const [content, setContent] = useState('');
  const { addClip } = useClipboard();
  const router = useRouter();


  const handleSave = () => {
    if (!content.trim()) return;
    
    // Check for bulk content (newlines)
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length > 1) {
        // Bulk Add
        hapticFeedback.medium();
        lines.reverse().forEach(line => {
             const isUrl = /^(http|https):\/\/[^ "]+$/.test(line);
             const isCode = line.includes('const ') || line.includes('function ') || line.includes('import ');
             addClip(line, isUrl ? 'url' : isCode ? 'code' : 'text');
        });
    } else {
        // Single Add
         const isUrl = /^(http|https):\/\/[^ "]+$/.test(content);
         const isCode = content.includes('const ') || content.includes('function ') || content.includes('import ');
         addClip(content, isUrl ? 'url' : isCode ? 'code' : 'text');
    }

    setContent('');
    Keyboard.dismiss();
    router.replace('/(tabs)');
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
        setContent(text);
        if (text.includes('\n')) {
            hapticFeedback.warning(); 
            // Optional: Auto-save if it looks like a bulk list? No, let user decide.
        }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>New Clip</Text>
            <TouchableOpacity onPress={handleSave} disabled={!content.trim()}>
                <Text style={[styles.saveButton, !content.trim() && styles.disabled]}>
                    {content.split(/\r?\n/).filter(line => line.trim().length > 0).length > 1 ? 'Save All' : 'Save'}
                </Text>
            </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                multiline
                placeholder="Type, Paste, or Drop text here...
(Multiple lines will be saved as separate clips)"
                placeholderTextColor={Colors.dark.textSecondary}
                value={content}
                onChangeText={setContent}
                autoFocus
                textAlignVertical="top"
            />
        </View>

        <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handlePaste}>
                <Ionicons name="clipboard-outline" size={24} color={Colors.dark.tint} />
                <Text style={styles.actionText}>Paste</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => setContent('')}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                <Text style={[styles.actionText, { color: '#FF3B30' }]}>Clear</Text>
            </TouchableOpacity>
        </View>
        
        {/* iOS Drop Zone Hint - purely visual as TextInput handles the logic natively */}
        <View style={styles.dropHint}>
            <Ionicons name="download-outline" size={20} color={Colors.dark.textSecondary} />
            <Text style={styles.dropText}>Drag & Drop enabled</Text>
        </View>

      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: Colors.dark.border,
  },
  title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors.dark.text,
  },
  saveButton: {
      fontSize: 17,
      color: Colors.dark.tint,
      fontWeight: '600',
  },
  disabled: {
      opacity: 0.5,
  },
  inputContainer: {
      flex: 1,
      padding: 20,
  },
  input: {
      flex: 1,
      fontSize: 18,
      color: Colors.dark.text,
      lineHeight: 28,
  },
  actions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 15,
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.dark.surface,
      padding: 12,
      borderRadius: 12,
      flex: 1,
      justifyContent: 'center',
      gap: 8,
  },
  actionText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.dark.tint,
  },
  dropHint: {
      alignItems: 'center',
      paddingBottom: 20,
      opacity: 0.5,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
  },
  dropText: {
      color: Colors.dark.textSecondary,
      fontSize: 13,
  }
});

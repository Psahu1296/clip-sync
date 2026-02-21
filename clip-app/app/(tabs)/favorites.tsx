import ActionBottomSheet, { ActionBottomSheetRef } from '@/components/ActionBottomSheet';
import SwipeableClipItem from '@/components/SwipeableClipItem';
import Colors from '@/constants/Colors';
import { Clip, useClipboard } from '@/context/ClipboardContext';
import { hapticFeedback } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const { clips, deleteClip, pinClip, refreshClips } = useClipboard();
  const router = useRouter();

  // Bottom Sheet Ref
  const deleteSheetRef = useRef<ActionBottomSheetRef>(null);

  // State
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get only pinned clips
  const pinnedClips = useMemo(() => {
    return clips.filter((clip) => clip.isPinned);
  }, [clips]);

  // Get recent clips for suggestions (non-pinned, most recent 5)
  const suggestedClips = useMemo(() => {
    return clips.filter((clip) => !clip.isPinned).slice(0, 5);
  }, [clips]);

  // Handlers
  const handleCopy = useCallback(async (clip: Clip) => {
    hapticFeedback.success();
    await Clipboard.setStringAsync(clip.content);
  }, []);

  const handleDeleteRequest = useCallback((clip: Clip) => {
    hapticFeedback.medium();
    setSelectedClip(clip);
    deleteSheetRef.current?.present();
  }, []);

  const handlePin = useCallback((clip: Clip) => {
    hapticFeedback.medium();
    pinClip(clip.id);
  }, [pinClip]);

  const confirmDelete = useCallback(() => {
    if (selectedClip) {
      hapticFeedback.error();
      deleteClip(selectedClip.id);
      deleteSheetRef.current?.dismiss();
      setSelectedClip(null);
    }
  }, [selectedClip, deleteClip]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback.medium();
    await refreshClips();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, [refreshClips]);

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={['#101b22', 'rgba(16, 27, 34, 0.8)', 'transparent']}
        style={styles.headerGradient}
      />
      <View style={styles.headerContainer}>
        {/* Title */}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <View style={styles.titleIconContainer}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Favorites</Text>
              <Text style={styles.pageSubtitle}>{pinnedClips.length} pinned clips</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.dark.tint} />
          <Text style={styles.infoText}>
            Swipe right on any clip to pin it here for quick access. Pinned clips won't be auto-deleted when limit is reached.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPinnedItem = ({ item }: { item: Clip }) => (
    <View style={styles.pinnedItemContainer}>
      <SwipeableClipItem clip={item} onCopy={handleCopy} onDelete={handleDeleteRequest} />
      <TouchableOpacity
        style={styles.unpinButton}
        onPress={() => handlePin(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="star" size={18} color="#FFD700" />
      </TouchableOpacity>
    </View>
  );

  const renderSuggestionItem = ({ item }: { item: Clip }) => (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={() => handlePin(item)}
      activeOpacity={0.7}>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionText} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.suggestionMeta}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.type}</Text>
          </View>
        </View>
      </View>
      <View style={styles.pinIconContainer}>
        <Ionicons name="star-outline" size={20} color={Colors.dark.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="star-outline" size={48} color={Colors.dark.border} />
      </View>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Pin your frequently used clips for quick access
      </Text>

      {suggestedClips.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>SUGGESTIONS</Text>
          <Text style={styles.suggestionsSubtitle}>Tap to pin these recent clips</Text>
          <FlatList
            data={suggestedClips}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            style={styles.suggestionsList}
          />
        </View>
      )}
    </View>
  );

  const renderListFooter = () => {
    if (pinnedClips.length === 0 || suggestedClips.length === 0) return null;

    return (
      <View style={styles.footerContainer}>
        <Text style={styles.footerTitle}>ADD MORE FAVORITES</Text>
        <FlatList
          data={suggestedClips}
          renderItem={renderSuggestionItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          style={styles.suggestionsList}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={pinnedClips}
        renderItem={renderPinnedItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderListFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.tint}
            colors={[Colors.dark.tint]}
            progressBackgroundColor={Colors.dark.surface}
          />
        }
      />

      {/* Delete Confirmation Sheet */}
      <ActionBottomSheet
        ref={deleteSheetRef}
        type="delete"
        onConfirm={confirmDelete}
        onCancel={() => deleteSheetRef.current?.dismiss()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerWrapper: {
    paddingBottom: 8,
  },
  headerGradient: {
    position: 'absolute',
    top: -100,
    left: 0,
    right: 0,
    height: 300,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  headerContainer: {
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  infoText: {
    flex: 1,
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  // Pinned Items
  pinnedItemContainer: {
    position: 'relative',
  },
  unpinButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  // Suggestions
  suggestionsContainer: {
    width: '100%',
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.dark.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  suggestionsSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
    opacity: 0.7,
  },
  suggestionsList: {
    width: '100%',
  },
  suggestionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
    marginRight: 12,
  },
  suggestionText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pinIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Footer
  footerContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.dark.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 16,
  },
});

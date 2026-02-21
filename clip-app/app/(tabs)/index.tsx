import ActionBottomSheet, { ActionBottomSheetRef } from '@/components/ActionBottomSheet';
import SwipeableClipItem from '@/components/SwipeableClipItem';
import Colors from '@/constants/Colors';
import { Clip, ClipType, useClipboard } from '@/context/ClipboardContext';
import { hapticFeedback } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types for section list
interface ClipSection {
  title: string;
  data: Clip[];
}

// Filter options
const FILTERS: { label: string; value: ClipType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Text', value: 'text' },
  { label: 'URLs', value: 'url' },
  { label: 'Code', value: 'code' },
  { label: 'Images', value: 'image' },
];

// Helper to format date sections
const getDateSection = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const clipDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (clipDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (clipDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
};

export default function HomeScreen() {
  const { clips, deleteClip, refreshClips, clipLimit, clipsRemaining } = useClipboard();
  const router = useRouter();

  // Bottom Sheet Refs
  const deleteSheetRef = useRef<ActionBottomSheetRef>(null);
  const filterSheetRef = useRef<ActionBottomSheetRef>(null);

  // State
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ClipType | 'all'>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter and search clips
  const filteredClips = useMemo(() => {
    let result = clips;

    // Apply type filter
    if (activeFilter !== 'all') {
      result = result.filter((clip) => clip.type === activeFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (clip) =>
          clip.content.toLowerCase().includes(query) ||
          clip.type.toLowerCase().includes(query)
      );
    }

    return result;
  }, [clips, activeFilter, searchQuery]);

  // Group clips by date sections
  const sections = useMemo((): ClipSection[] => {
    if (filteredClips.length === 0) return [];

    const grouped: { [key: string]: Clip[] } = {};
    const order: string[] = [];

    filteredClips.forEach((clip) => {
      const section = getDateSection(clip.timestamp);
      if (!grouped[section]) {
        grouped[section] = [];
        order.push(section);
      }
      grouped[section].push(clip);
    });

    return order.map((title) => ({
      title,
      data: grouped[title],
    }));
  }, [filteredClips]);

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

  const clearSearch = () => {
    setSearchQuery('');
    setActiveFilter('all');
    Keyboard.dismiss();
  };

  const isFiltering = searchQuery.trim() !== '' || activeFilter !== 'all';

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={['#101b22', 'rgba(16, 27, 34, 0.8)', 'transparent']}
        style={styles.headerGradient}
      />
      <View style={styles.headerContainer}>
        {/* Top Row: Title + Actions */}
        <View style={styles.topRow}>
          <View style={styles.titleContainer}>
            <Image
              source={require('@/assets/images/premium-icon.png')}
              style={styles.miniLogo}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>ClipSync</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                hapticFeedback.light();
                router.push('/(tabs)/settings');
              }}>
              <Ionicons name="settings-sharp" size={20} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Clip Count Card */}
        <View style={styles.clipCountCard}>
          <View style={styles.clipCountLeft}>
            <View style={styles.clipCountIconContainer}>
              <Ionicons name="clipboard" size={20} color={Colors.dark.tint} />
            </View>
            <View>
              <Text style={styles.clipCountNumber}>{clips.length}</Text>
              <Text style={styles.clipCountLabel}>Saved Clips</Text>
            </View>
          </View>
          <View style={styles.clipCountDivider} />
          <View style={styles.clipCountRight}>
            <Text style={styles.clipLimitText}>
              {clipsRemaining} <Text style={styles.clipLimitSubtext}>remaining</Text>
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(100, (clips.length / clipLimit) * 100)}%`,
                    backgroundColor: clips.length >= clipLimit ? Colors.dark.danger : Colors.dark.tint,
                  },
                ]}
              />
            </View>
            <Text style={styles.clipLimitInfo}>{clips.length}/{clipLimit} clips</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={20} color={isSearchFocused ? Colors.dark.tint : Colors.dark.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clips..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            keyboardAppearance="dark"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[styles.filterChip, activeFilter === filter.value && styles.filterChipActive]}
              onPress={() => {
                hapticFeedback.selection();
                setActiveFilter(filter.value);
              }}
              activeOpacity={0.8}>
              <Text style={[styles.filterText, activeFilter === filter.value && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results info when filtering */}
        {isFiltering && (
          <View style={styles.filterResultsRow}>
            <Text style={styles.filterResultsText}>
              {filteredClips.length} {filteredClips.length === 1 ? 'result' : 'results'}
            </Text>
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.clearFilterText}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: ClipSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
      <Text style={styles.sectionCount}>{section.data.length} clips</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Clip }) => (
    <SwipeableClipItem clip={item} onCopy={handleCopy} onDelete={handleDeleteRequest} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={isFiltering ? 'search-outline' : 'clipboard-outline'}
              size={64}
              color={Colors.dark.border}
            />
            <Text style={styles.emptyText}>
              {isFiltering ? 'No matching clips' : 'No clips found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isFiltering ? 'Try a different search or filter' : 'Copy something to get started'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.tint}
            colors={[Colors.dark.tint]}
            progressBackgroundColor={Colors.dark.surface}
          />
        }
        stickySectionHeadersEnabled={false}
        keyboardDismissMode="on-drag"
      />

      {/* Delete Confirmation Sheet */}
      <ActionBottomSheet
        ref={deleteSheetRef}
        type="delete"
        onConfirm={confirmDelete}
        onCancel={() => deleteSheetRef.current?.dismiss()}
      />

      {/* Filter Sheet (keeping for future advanced filters) */}
      <ActionBottomSheet ref={filterSheetRef} type="filter" title="Advanced Filters">
        <View style={{ gap: 16 }}>
          <TouchableOpacity style={styles.filterOption}>
            <Ionicons name="pin-outline" size={24} color="#FFF" />
            <Text style={styles.filterOptionText}>Pinned Only</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterOption}>
            <Ionicons name="time-outline" size={24} color="#FFF" />
            <Text style={styles.filterOptionText}>Last 7 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterOption}>
            <Ionicons name="calendar-outline" size={24} color="#FFF" />
            <Text style={styles.filterOptionText}>Date Range</Text>
          </TouchableOpacity>
        </View>
      </ActionBottomSheet>
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
    marginBottom: 0,
    paddingTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Clip Count Card
  clipCountCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  clipCountLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clipCountIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipCountNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    lineHeight: 32,
  },
  clipCountLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: -2,
  },
  clipCountDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  clipCountRight: {
    flex: 1,
    justifyContent: 'center',
  },
  clipLimitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  clipLimitSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.dark.textSecondary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  clipLimitInfo: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchBarFocused: {
    borderColor: Colors.dark.tint,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    marginLeft: 10,
    height: '100%',
  },
  // Filter Chips
  filterScroll: {
    marginBottom: 8,
  },
  filterContainer: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterChipActive: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  filterText: {
    color: Colors.dark.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  filterTextActive: {
    color: '#FFF',
  },
  // Filter Results
  filterResultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterResultsText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  clearFilterText: {
    color: Colors.dark.tint,
    fontSize: 13,
    fontWeight: '600',
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingTop: 16,
  },
  sectionTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  sectionCount: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.dark.textSecondary,
    marginTop: 4,
    fontSize: 14,
    opacity: 0.7,
  },
  // Filter Options (for bottom sheet)
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterOptionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

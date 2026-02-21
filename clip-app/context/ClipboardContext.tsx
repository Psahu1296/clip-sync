import ClipboardAccessibility from '@/modules/ClipboardAccessibility';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useAuth } from './AuthContext';

// Clip limits based on subscription plan
const CLIP_LIMITS = {
  free: 30,
  pro: 200,
} as const;

export type ClipType = 'text' | 'image' | 'url' | 'code';

export interface Clip {
  id: string;
  type: ClipType;
  content: string; // Text content or image URI
  preview?: string; // For code or long text
  timestamp: number;
  device: string;
  isPinned: boolean;
  metadata?: {
      sourceApp?: string;
      language?: string; // for code
  }
}

interface ClipboardContextType {
  clips: Clip[];
  addClip: (content: string, type: ClipType) => void;
  deleteClip: (id: string) => void;
  pinClip: (id: string) => void;
  clearAll: () => void;
  refreshClips: () => Promise<void>;
  isPassiveModeEnabled: boolean;
  togglePassiveMode: () => void;
  clipLimit: number;
  clipsRemaining: number;
}

const ClipboardContext = createContext<ClipboardContextType>({
  clips: [],
  addClip: () => {},
  deleteClip: () => {},
  pinClip: () => {},
  clearAll: () => {},
  refreshClips: async () => {},
  isPassiveModeEnabled: true,
  togglePassiveMode: () => {},
  clipLimit: CLIP_LIMITS.free,
  clipsRemaining: CLIP_LIMITS.free,
});

export const useClipboard = () => useContext(ClipboardContext);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isPassiveModeEnabled, setIsPassiveModeEnabled] = useState(true);
  const lastClipContent = useRef<string | null>(null);
  const { user } = useAuth();

  // Get clip limit based on user's subscription plan
  const clipLimit = user?.plan === 'pro' ? CLIP_LIMITS.pro : CLIP_LIMITS.free;
  const clipsRemaining = Math.max(0, clipLimit - clips.length);

  // Helper to enforce clip limit - removes oldest non-pinned clips
  const enforceClipLimit = (clipList: Clip[], limit: number): Clip[] => {
    if (clipList.length <= limit) return clipList;

    // Separate pinned and non-pinned clips
    const pinnedClips = clipList.filter(clip => clip.isPinned);
    const nonPinnedClips = clipList.filter(clip => !clip.isPinned);

    // Sort non-pinned by timestamp (newest first)
    nonPinnedClips.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate how many non-pinned clips we can keep
    const nonPinnedLimit = Math.max(0, limit - pinnedClips.length);
    const trimmedNonPinned = nonPinnedClips.slice(0, nonPinnedLimit);

    // Combine and sort by timestamp
    const result = [...pinnedClips, ...trimmedNonPinned];
    return result.sort((a, b) => b.timestamp - a.timestamp);
  };

  // Helper to detect type
  const detectType = (content: string): ClipType => {
      const urlRegex = /^(http|https):\/\/[^ "]+$/;
      if (urlRegex.test(content)) return 'url';
      if (content.includes('const ') || content.includes('import ') || content.includes('function ')) return 'code';
      return 'text';
  };

  const addClip = (content: string, type: ClipType) => {
    const newClip: Clip = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now(),
      device: 'Local Device',
      isPinned: false,
    };
    // Remove any existing duplicate and add new clip at top, then enforce limit
    setClips((prev) => {
      const filtered = prev.filter(clip => clip.content !== content);
      const updated = [newClip, ...filtered];
      return enforceClipLimit(updated, clipLimit);
    });
  };

  const checkClipboard = async () => {
      const content = await Clipboard.getStringAsync();

      // If content is empty or same as last check, ignore
      if (!content || content === lastClipContent.current) return;

      // Check if it already exists at the top of the list to prevent dupes from re-renders
      if (clips.length > 0 && clips[0].content === content) return;

      lastClipContent.current = content;

      const newClip: Clip = {
          id: Date.now().toString(),
          type: detectType(content),
          content: content,
          timestamp: Date.now(),
          device: 'Local Device',
          isPinned: false,
      };

      // Remove any existing duplicate and add new clip at top, then enforce limit
      setClips(prev => {
        const filtered = prev.filter(clip => clip.content !== content);
        const updated = [newClip, ...filtered];
        return enforceClipLimit(updated, clipLimit);
      });
  };

  const refreshClips = async () => {
      await checkClipboard();
  };

  const togglePassiveMode = () => setIsPassiveModeEnabled(prev => !prev);

  // Load clips on mount
  useEffect(() => {
    const loadClips = async () => {
        try {
            const savedClips = await AsyncStorage.getItem('saved-clips');
            if (savedClips) {
                setClips(JSON.parse(savedClips));
            }
        } catch (e) {
            console.error("Failed to load clips", e);
        }
    };
    loadClips();
    
    // Initial check (hydration)
    checkClipboard();
  }, []);

  // Passive Listener Logic
  useEffect(() => {
    // AppState Listener
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && isPassiveModeEnabled) {
            checkClipboard();
        }
    });

    // Aggressive Polling for "Instant" feel
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (isPassiveModeEnabled) {
        intervalId = setInterval(checkClipboard, 3000);
    }

    return () => {
        subscription.remove();
        if (intervalId) clearInterval(intervalId);
    };
  }, [isPassiveModeEnabled]); // Re-run when mode changes

  // Handle Deep Links (Share Sheet / Shortcuts)
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
        const { url } = event;
        const parsed = Linking.parse(url);
        
        if (parsed.queryParams?.content) {
            const content = parsed.queryParams.content as string;
            addClip(content, detectType(content));
        }
    };

    // Check initial URL
    Linking.getInitialURL().then((url) => {
        if (url) handleUrl({ url });
    });

    // Listen for updates
    const subscription = Linking.addEventListener('url', handleUrl);
    
    return () => {
        subscription.remove();
    };
  }, []);

  // Android Accessibility Service Listener (for background capture)
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    // Function to add a single clip, moving duplicates to top with new timestamp
    const addClipFromService = (content: string, timestamp: number) => {
      setClips(prev => {
        const newClip: Clip = {
          id: timestamp.toString(),
          type: detectType(content),
          content: content,
          timestamp: timestamp,
          device: 'Background (Accessibility)',
          isPinned: false,
        };

        // Remove any existing duplicate and add new clip at top, then enforce limit
        const filtered = prev.filter(clip => clip.content !== content);
        const updated = [newClip, ...filtered];
        return enforceClipLimit(updated, clipLimit);
      });
    };

    // Fetch any pending clips that were captured while app was closed
    const fetchPendingClips = async () => {
      try {
        const pendingClips = await ClipboardAccessibility.getPendingClips();
        console.log('[Accessibility Service] Found pending clips:', pendingClips.length);

        if (pendingClips.length > 0) {
          // Add ALL pending clips in a single state update to avoid race conditions
          setClips(prev => {
            // Create set of pending content for quick lookup
            const pendingContents = new Set(pendingClips.map(({ content }: { content: string }) => content));

            // Remove any existing clips that match pending clips (they'll be re-added with new timestamps)
            const filteredPrev = prev.filter(clip => !pendingContents.has(clip.content));

            // Create new clips from pending
            const newClips: Clip[] = pendingClips.map(({ content, timestamp }: { content: string; timestamp: number }) => ({
              id: timestamp.toString(),
              type: detectType(content),
              content: content,
              timestamp: timestamp,
              device: 'Background (Accessibility)',
              isPinned: false,
            }));

            console.log('[Accessibility Service] Adding', newClips.length, 'clips (moving duplicates to top)');

            // Combine, sort by timestamp (newest first), and enforce limit
            const combined = [...newClips, ...filteredPrev];
            const sorted = combined.sort((a, b) => b.timestamp - a.timestamp);
            return enforceClipLimit(sorted, clipLimit);
          });

          // Clear pending clips after processing
          ClipboardAccessibility.clearPendingClips();
        }
      } catch (error) {
        console.error('[Accessibility Service] Error fetching pending clips:', error);
      }
    };

    // Fetch pending clips on mount
    fetchPendingClips();

    // Also fetch when app becomes active
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchPendingClips();
      }
    });

    // Listen for real-time clipboard changes
    const clipboardSubscription = ClipboardAccessibility.addClipboardListener((content) => {
      console.log('[Accessibility Service] Clipboard changed:', content.substring(0, 20));
      addClipFromService(content, Date.now());
    });

    return () => {
      clipboardSubscription.remove();
      appStateSubscription.remove();
    };
  }, [clipLimit]); // Re-run when clip limit changes (subscription upgrade/downgrade)

  // Enforce clip limit when limit changes (e.g., subscription downgrade)
  useEffect(() => {
    if (clips.length > clipLimit) {
      console.log(`[ClipLimit] Enforcing limit: ${clips.length} -> ${clipLimit}`);
      setClips(prev => enforceClipLimit(prev, clipLimit));
    }
  }, [clipLimit]);

  // Save clips to storage whenever they change
  useEffect(() => {
      const saveClips = async () => {
          try {
              await AsyncStorage.setItem('saved-clips', JSON.stringify(clips));
          } catch (e) {
              console.error("Failed to save clips", e);
          }
      };
      saveClips();
  }, [clips]);

  const deleteClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  const pinClip = (id: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const clearAll = () => {
      setClips([]);
      AsyncStorage.removeItem('saved-clips'); // Clear storage too
  }

  return (
    <ClipboardContext.Provider value={{
        clips,
        addClip,
        deleteClip,
        pinClip,
        clearAll,
        refreshClips,
        isPassiveModeEnabled,
        togglePassiveMode,
        clipLimit,
        clipsRemaining,
    }}>
      {children}
    </ClipboardContext.Provider>
  );
};

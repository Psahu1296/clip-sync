import Colors from '@/constants/Colors';
import { Clip } from '@/context/ClipboardContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import ClipItem from './ClipItem';

interface SwipeableClipItemProps {
  clip: Clip;
  onDelete: (clip: Clip) => void;
  onCopy: (clip: Clip) => void;
}

export default function SwipeableClipItem({ clip, onDelete, onCopy }: SwipeableClipItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = () => {
    // Delete Action
    return (
      <View style={styles.rightAction}>
        <View style={styles.actionContent}>
          <Ionicons name="trash" size={22} color="#FFF" />
          <Text style={styles.actionText}>Delete</Text>
        </View>
      </View>
    );
  };

  const renderLeftActions = () => {
    // Copy Action
    return (
      <View style={styles.leftAction}>
        <View style={styles.actionContent}>
          <Ionicons name="copy" size={22} color="#FFF" />
          <Text style={styles.actionText}>Copy</Text>
        </View>
      </View>
    );
  };

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      onDelete(clip);
    } else if (direction === 'left') {
      onCopy(clip);
    }
    // Close the swipeable after action
    swipeableRef.current?.close();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
      rightThreshold={80}
      leftThreshold={80}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={handleSwipeOpen}
    >
      <ClipItem clip={clip} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  leftAction: {
    width: 100,
    backgroundColor: Colors.dark.swipeCopy,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  rightAction: {
    width: 100,
    backgroundColor: Colors.dark.swipeDelete,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

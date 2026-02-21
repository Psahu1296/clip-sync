import Colors from '@/constants/Colors';
import { hapticFeedback } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type ActionBottomSheetRef = BottomSheetModal;

interface ActionBottomSheetProps {
  title?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  type?: 'delete' | 'filter';
}

const ActionBottomSheet = forwardRef<BottomSheetModal, ActionBottomSheetProps>(({ title, onConfirm, onCancel, children, type }, ref) => {
  // Use different snap points based on type - delete needs less space
  const snapPoints = useMemo(() => type === 'delete' ? [300] : ['40%', '60%'], [type]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  const handleCancel = () => {
    hapticFeedback.light();
    onCancel?.();
  };

  const handleConfirm = () => {
    hapticFeedback.medium();
    onConfirm?.();
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: Colors.dark.surface }}
      handleIndicatorStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
    >
      <BottomSheetView style={styles.contentContainer}>
        {type === 'delete' ? (
             <View style={styles.deleteContainer}>
                 <View style={styles.iconContainer}>
                     <Ionicons name="trash-outline" size={32} color={Colors.dark.danger} />
                 </View>
                 <Text style={styles.title}>{title || 'Confirm Deletion'}</Text>
                 <Text style={styles.subtitle}>Are you sure you want to delete this clip? This action cannot be undone.</Text>

                 <View style={styles.buttonRow}>
                     <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                         <Text style={styles.cancelText}>Cancel</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                         <Text style={styles.confirmText}>Delete</Text>
                     </TouchableOpacity>
                 </View>
             </View>
        ) : (
            <View style={styles.defaultContainer}>
                 {title && <Text style={styles.title}>{title}</Text>}
                 {children}
            </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  deleteContainer: {
      alignItems: 'center',
      width: '100%',
  },
  defaultContainer: {
      // align defaults
  },
  iconContainer: {
      marginBottom: 16,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      padding: 16,
      borderRadius: 100,
  },
  title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.dark.text,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: -0.5,
  },
  subtitle: {
      fontSize: 14,
      color: Colors.dark.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 20,
  },
  buttonRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
  },
  cancelButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  confirmButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: Colors.dark.danger,
      alignItems: 'center',
      shadowColor: Colors.dark.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
  },
  cancelText: {
      color: Colors.dark.text,
      fontWeight: '600',
      fontSize: 16,
  },
  confirmText: {
      color: '#FFF',
      fontWeight: '600',
      fontSize: 16,
  },
});

export default ActionBottomSheet;

import React from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Colors } from '../constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPhotoPicked: (uri: string) => void;
}

export function PhotoPicker({ visible, onClose, onPhotoPicked }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoPicked(result.assets[0].uri);
      onClose();
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed to choose photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoPicked(result.assets[0].uri);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Add Photo</Text>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={pickFromCamera}
        >
          <Text style={styles.optionIcon}>📷</Text>
          <Text style={[styles.optionLabel, { color: colors.text }]}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={pickFromLibrary}
        >
          <Text style={styles.optionIcon}>🖼️</Text>
          <Text style={[styles.optionLabel, { color: colors.text }]}>Choose from Library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancel} onPress={onClose}>
          <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: 20,
    paddingBottom: 36,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancel: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 16,
  },
});

import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Colors } from '../constants/colors';
import { Photo } from '../types';
import { PhotoPicker } from './PhotoPicker';

interface Props {
  photos: Photo[];
  onAddPhoto: (uri: string) => Promise<unknown>;
  onDeletePhoto: (id: number) => Promise<void>;
}

const COLUMNS = 3;
const GAP = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = (SCREEN_WIDTH - GAP * (COLUMNS + 1)) / COLUMNS;

export function PhotoGrid({ photos, onAddPhoto, onDeletePhoto }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleDelete = (photo: Photo) => {
    Alert.alert('Delete Photo', 'Remove this photo from this park?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeletePhoto(photo.id) },
    ]);
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Photos ({photos.length})
        </Text>
        <TouchableOpacity onPress={() => setPickerVisible(true)}>
          <Text style={[styles.addBtn, { color: colors.tint }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {photos.length === 0 ? (
        <TouchableOpacity
          style={[styles.emptyGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Tap to add photos from your visit
          </Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={photos}
          numColumns={COLUMNS}
          scrollEnabled={false}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={[styles.cell, { margin: GAP / 2 }]}>
              <Image
                source={{ uri: item.uri }}
                style={styles.cellImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.deleteX}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <PhotoPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onPhotoPicked={onAddPhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  addBtn: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyGrid: {
    marginHorizontal: 16,
    marginBottom: 12,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  grid: {
    paddingHorizontal: GAP / 2,
    paddingBottom: 8,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cellImage: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteX: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

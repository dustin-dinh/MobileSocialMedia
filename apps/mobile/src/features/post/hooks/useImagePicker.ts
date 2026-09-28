/**
 * Hook wrapping `expo-image-picker` for the post creation flow.
 *
 * Handles permission requests, multi-selection, quality compression,
 * and enforces the maximum image count.
 */
import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

/** A local image ready for preview & upload. */
export type SelectedImage = {
  /** Local file:// URI on device. */
  uri: string;
  /** Original width in pixels (if available). */
  width: number;
  /** Original height in pixels (if available). */
  height: number;
};

const MAX_IMAGES = 4;
const IMAGE_QUALITY = 0.8;

type UseImagePickerReturn = {
  /** Currently selected images. */
  images: SelectedImage[];
  /** Whether the picker dialog is currently open. */
  isPicking: boolean;
  /** Open the image picker (respects max remaining slots). */
  pickImages: () => Promise<void>;
  /** Remove a single image by URI. */
  removeImage: (uri: string) => void;
  /** Clear all selected images. */
  clearImages: () => void;
  /** How many more images the user can still add. */
  remainingSlots: number;
};

export function useImagePicker(): UseImagePickerReturn {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isPicking, setIsPicking] = useState(false);

  const remainingSlots = MAX_IMAGES - images.length;

  const pickImages = useCallback(async () => {
    if (remainingSlots <= 0) {
      return;
    }

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      // TODO: Show a user-friendly alert explaining why the permission is needed.
      console.warn('Media library permission denied.');

      return;
    }

    setIsPicking(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images'],
        quality: IMAGE_QUALITY,
        selectionLimit: remainingSlots,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const newImages: SelectedImage[] = result.assets
        .slice(0, remainingSlots)
        .map((asset) => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        }));

      setImages((current) => [...current, ...newImages].slice(0, MAX_IMAGES));
    } finally {
      setIsPicking(false);
    }
  }, [remainingSlots]);

  const removeImage = useCallback((uri: string) => {
    setImages((current) => current.filter((img) => img.uri !== uri));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    images,
    isPicking,
    pickImages,
    removeImage,
    clearImages,
    remainingSlots,
  };
}

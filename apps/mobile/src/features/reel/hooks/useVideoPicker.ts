import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

/** Limits from the Reel spec (docs/reel/REEL_FINAL_SPEC_AND_PLAN.md §3.4). */
export const MAX_VIDEO_SECONDS = 60;
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime'];

export type SelectedVideo = {
  durationMs: number;
  fileName: string | null;
  height: number;
  mimeType: string;
  sizeBytes: number | null;
  uri: string;
  width: number;
};

type PickedAsset = {
  duration?: number | null;
  fileSize?: number | null;
  mimeType?: string | null;
};

/** Why a picked video cannot be posted, or null when it is acceptable. */
export function validateVideo(asset: PickedAsset): string | null {
  if (asset.mimeType && !ALLOWED_MIME_TYPES.includes(asset.mimeType)) {
    return 'Chỉ hỗ trợ video MP4 hoặc MOV.';
  }

  if ((asset.duration ?? 0) > MAX_VIDEO_SECONDS * 1000) {
    return `Video dài tối đa ${MAX_VIDEO_SECONDS} giây.`;
  }

  if ((asset.fileSize ?? 0) > MAX_VIDEO_BYTES) {
    return `Video nặng tối đa ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.`;
  }

  return null;
}

/** Picks one video from the library and checks it against the reel limits. */
export function useVideoPicker() {
  const [video, setVideo] = useState<SelectedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const pickVideo = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      setError('Hãy cho phép ứng dụng truy cập thư viện để chọn video.');
      return;
    }

    setIsPicking(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: MAX_VIDEO_SECONDS,
      });
      const asset = result.canceled ? null : result.assets[0];

      if (!asset) {
        return;
      }

      const problem = validateVideo(asset);

      setError(problem);
      setVideo(
        problem
          ? null
          : {
              durationMs: asset.duration ?? 0,
              fileName: asset.fileName ?? null,
              height: asset.height,
              mimeType: asset.mimeType ?? 'video/mp4',
              sizeBytes: asset.fileSize ?? null,
              uri: asset.uri,
              width: asset.width,
            },
      );
    } finally {
      setIsPicking(false);
    }
  }, []);

  const clearVideo = useCallback(() => {
    setVideo(null);
    setError(null);
  }, []);

  return { clearVideo, error, isPicking, pickVideo, video };
}

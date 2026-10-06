/**
 * Guards the image-upload part against Expo's own multipart encoder.
 *
 * `fetch` in Expo SDK 57 rejects React Native's legacy `{ uri, name, type }`
 * file descriptor with "Unsupported FormDataPart implementation". These tests
 * feed the part built by `toUploadPart` through that encoder.
 */
import { convertFormDataAsync } from 'expo/src/winter/fetch/convertFormData';

import { toUploadPart } from '../src/features/post/services/postService';

const mockPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    bytes: jest.fn(() => Promise.resolve(mockPngBytes)),
    uri,
  })),
}));

/** Stand-in for a FormData whose `entries()` yields the given pairs. */
function formOf(entries: Array<[string, unknown]>): FormData {
  return { entries: () => entries } as unknown as FormData;
}

function decode(body: Uint8Array): string {
  return Buffer.from(body).toString('latin1');
}

describe('toUploadPart', () => {
  it('is encoded by Expo fetch with filename, content type and file bytes', async () => {
    const part = toUploadPart('file:///cache/ImagePicker/photo.png', 0, {
      fileName: 'photo.png',
      mimeType: 'image/png',
    });

    const { body } = await convertFormDataAsync(
      formOf([
        ['content', 'hello'],
        ['images', part],
      ]),
      'BOUNDARY',
    );
    const text = decode(body);

    expect(text).toContain('content-disposition: form-data; name="images"; filename="photo.png"');
    expect(text).toContain('content-type: image/png');
    expect(text).toContain(decode(mockPngBytes));
    expect(text).toContain('content-disposition: form-data; name="content"\r\n\r\nhello');
  });

  it('derives name and type from the URI when the picker reports neither', () => {
    expect(toUploadPart('file:///cache/a.webp', 2)).toMatchObject({
      name: 'image_2.webp',
      type: 'image/webp',
    });
    expect(toUploadPart('file:///cache/no-extension', 1)).toMatchObject({
      name: 'image_1.jpg',
      type: 'image/jpeg',
    });
  });

  it('the legacy React Native descriptor is what Expo fetch rejects', async () => {
    const legacy = { name: 'photo.png', type: 'image/png', uri: 'file:///cache/photo.png' };

    await expect(convertFormDataAsync(formOf([['images', legacy]]), 'BOUNDARY')).rejects.toThrow(
      'Unsupported FormDataPart implementation',
    );
  });
});

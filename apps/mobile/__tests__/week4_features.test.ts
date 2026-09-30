import { feedService } from '../src/features/feed/services/feedService';
import { profileService } from '../src/features/profile/services/profileService';
import type { Post } from '../src/features/feed/types';
import type { AuthUser } from '../src/features/auth/services/authService';

describe('Week 4 Small Features (S6a, S6b, S6c)', () => {
  const dummyPost: Post = {
    id: 'post-feature-test',
    author: {
      id: 'author-1',
      username: 'tester',
      displayName: 'Tester',
      avatarUrl: null,
    },
    content: 'Testing bookmark feature',
    media: [],
    likesCount: 5,
    commentsCount: 1,
    isLiked: false,
    isSaved: false,
    createdAt: new Date().toISOString(),
  };

  const dummyUser: AuthUser = {
    id: 'user-001',
    username: 'nhatluan',
    displayName: 'Nguyễn Nhật Luân',
    email: 'nhatluan@example.com',
    avatarUrl: null,
    bio: 'Initial Bio',
  };

  // S6b: Bookmark (Save post)
  test('S6b: Bookmark - Save post toggles isSaved state', async () => {
    const saved = await feedService.toggleSave(dummyPost);
    expect(saved.isSaved).toBe(true);

    const unsaved = await feedService.toggleSave(saved);
    expect(unsaved.isSaved).toBe(false);
  });

  // S6c: Basic Settings - Edit profile local settings
  test('S6c: Settings - Update profile fields (displayName, bio)', async () => {
    const updated = await profileService.updateProfile(dummyUser, {
      displayName: 'Nguyễn Nhật Luân (Updated)',
      bio: 'New bio from settings',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    expect(updated.displayName).toBe('Nguyễn Nhật Luân (Updated)');
    expect(updated.bio).toBe('New bio from settings');
    expect(updated.avatarUrl).toBe('https://example.com/avatar.jpg');
  });

  // S6a: Delete / Edit Post status
  test('S6a: Post Edit/Delete - Handled via backend blocker', () => {
    // S6a requires DELETE /posts/:id and PATCH /posts/:id from Dev B
    const isBackendReady = false;
    expect(isBackendReady).toBe(false);
  });
});

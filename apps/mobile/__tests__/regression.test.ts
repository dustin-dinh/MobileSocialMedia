import * as SecureStore from 'expo-secure-store';
import { validateLogin, validateRegister } from '../src/features/auth/validation';
import { postService } from '../src/features/post/services/postService';
import { feedService } from '../src/features/feed/services/feedService';
import { commentService } from '../src/features/comment/services/commentService';
import { profileService } from '../src/features/profile/services/profileService';
import { searchService } from '../src/features/search/services/searchService';
import { notificationService } from '../src/features/notifications/services/notificationService';
import { authTokenStorage } from '../src/features/auth/services/authTokenStorage';
import type { AuthUser } from '../src/features/auth/services/authService';

describe('MVP Full Regression Suite (R-01 to R-16 & State Testing)', () => {
  const mockUserA: AuthUser = {
    id: 'user-001',
    username: 'nhatluan',
    displayName: 'Nguyễn Nhật Luân',
    email: 'nhatluan@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160',
    bio: 'Mobile Developer',
  };

  const mockUserB: AuthUser = {
    id: 'user-002',
    username: 'sarahchen',
    displayName: 'Sarah Chen',
    email: 'sarahchen@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160',
    bio: 'Product Designer & Travel Enthusiast',
  };

  // R-01: Auth - Register (Valid form)
  test('R-01: Auth - Register accepts valid registration values', () => {
    const validValues = {
      username: 'tester_01',
      email: 'tester01@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
    };
    const errors = validateRegister(validValues);
    expect(Object.keys(errors).length).toBe(0);
  });

  // R-02: Auth - Register Validation (Invalid inputs)
  test('R-02: Auth - Register Validation catches invalid format and mismatched passwords', () => {
    const invalidValues = {
      username: 'u!', // too short and invalid character
      email: 'bad-email',
      password: '123', // too short
      confirmPassword: '456',
    };
    const errors = validateRegister(invalidValues);
    expect(errors.username).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
    expect(errors.confirmPassword).toBe('Passwords do not match.');
  });

  // R-03: Auth - Login (Valid form)
  test('R-03: Auth - Login accepts valid credentials structure', () => {
    const validValues = {
      email: 'user@example.com',
      password: 'ValidPassword123',
    };
    const errors = validateLogin(validValues);
    expect(Object.keys(errors).length).toBe(0);
  });

  // R-04: Auth - Login Error (Validation on empty/invalid inputs)
  test('R-04: Auth - Login Error catches missing fields', () => {
    const emptyValues = {
      email: '',
      password: '',
    };
    const errors = validateLogin(emptyValues);
    expect(errors.email).toBe('Enter your email address.');
    expect(errors.password).toBe('Enter your password.');
  });

  // R-05: Post - Create Post
  test('R-05: Post - Create Post creates a post for authenticated user', async () => {
    const newPost = await postService.createPost(
      {
        content: 'Hello World from automated regression test!',
        mediaUris: ['file:///test/image.jpg'],
      },
      mockUserA,
    );
    expect(newPost).toBeDefined();
    expect(newPost.content).toBe('Hello World from automated regression test!');
    expect(newPost.author.username).toBe('nhatluan');
    expect(newPost.media.length).toBe(1);
    expect(newPost.likesCount).toBe(0);
  });

  // R-06: Post - Create Validation
  test('R-06: Post - Create Post handles empty media and content', async () => {
    const emptyPost = await postService.createPost(
      {
        content: 'Text only post without images',
        mediaUris: [],
      },
      mockUserB,
    );
    expect(emptyPost).toBeDefined();
    expect(emptyPost.media.length).toBe(0);
    expect(emptyPost.author.username).toBe('sarahchen');
  });

  // R-07: Feed - List Display
  test('R-07: Feed - List Display returns paginated feed items', async () => {
    const feed = await feedService.getFeed(1);
    expect(feed.data.length).toBeGreaterThan(0);
    const first = feed.data[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('author');
    expect(first).toHaveProperty('content');
    expect(first).toHaveProperty('likesCount');
    expect(first).toHaveProperty('commentsCount');
  });

  // R-08: Feed - Pull to Refresh
  test('R-08: Feed - Pull to Refresh returns refreshed post list', async () => {
    const feedPage1 = await feedService.getFeed(1);
    expect(feedPage1.meta.page).toBe(1);
    expect(feedPage1.data.length).toBeGreaterThan(0);
  });

  // R-09: Profile - Display
  test('R-09: Profile - Display returns complete profile for user A and user B', async () => {
    const profileA = await profileService.getCurrentUserProfile(mockUserA);
    expect(profileA.username).toBe('nhatluan');
    expect(profileA.postsCount).toBeGreaterThan(0);

    const profileB = await profileService.getCurrentUserProfile(mockUserB);
    expect(profileB.username).toBe('sarahchen');
    expect(profileB.followersCount).toBeDefined();
  });

  // R-10: Profile - Tabs/Sub-views
  test('R-10: Profile - Tabs returns user posts list', async () => {
    const posts = await profileService.getUserPosts(mockUserA);
    expect(Array.isArray(posts.data)).toBe(true);
    expect(posts.data.length).toBeGreaterThan(0);
  });

  // R-11: Follow - Profile Toggle
  test('R-11: Follow - Profile Toggle toggles following state', async () => {
    const following = await searchService.toggleFollowUser('user-target', false);
    expect(following).toBe(true);
    const unfollowed = await searchService.toggleFollowUser('user-target', true);
    expect(unfollowed).toBe(false);
  });

  // R-12: Like - Feed Interaction
  test('R-12: Like - Feed Interaction toggles and synchronizes count', async () => {
    const feed = await feedService.getFeed(1);
    const post = feed.data[0];
    const initialLiked = post.isLiked;
    const initialCount = post.likesCount;

    const toggled = await feedService.toggleLike(post);
    expect(toggled.isLiked).toBe(!initialLiked);
    expect(toggled.likesCount).toBe(initialLiked ? initialCount - 1 : initialCount + 1);
  });

  // R-13: Comment - Interaction
  test('R-13: Comment - Interaction adds comment and retrieves list', async () => {
    const comment = await commentService.addComment('post-1', 'Regression comment', mockUserA);
    expect(comment.content).toBe('Regression comment');

    const comments = await commentService.getComments('post-1');
    expect(comments.length).toBeGreaterThan(0);
  });

  // R-14: Search - Flow
  test('R-14: Search - Flow retrieves users matching query', async () => {
    const results = await searchService.searchUsers('alex');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].username.toLowerCase()).toContain('alex');
  });

  // R-15: Notification - Flow
  test('R-15: Notification - Flow retrieves notifications and marks as read', async () => {
    const notifs = await notificationService.getNotifications();
    expect(notifs.length).toBeGreaterThan(0);
    await notificationService.markAsRead(notifs[0].id);
    const updated = await notificationService.getNotifications();
    expect(updated[0].isRead).toBe(true);
  });

  // R-16: Auth - Session / Token Storage
  test('R-16: Auth - Session token save, get and clear', async () => {
    let mockStore: Record<string, string> = {};
    (SecureStore.setItemAsync as jest.Mock).mockImplementation((key: string, val: string) => {
      mockStore[key] = val;
      return Promise.resolve();
    });
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(mockStore[key] ?? null);
    });
    (SecureStore.deleteItemAsync as jest.Mock).mockImplementation((key: string) => {
      delete mockStore[key];
      return Promise.resolve();
    });

    await authTokenStorage.save('mock-token-xyz');
    const token = await authTokenStorage.get();
    expect(token).toBe('mock-token-xyz');
    await authTokenStorage.clear();
    const cleared = await authTokenStorage.get();
    expect(cleared).toBeNull();
  });

  // State: Loading State
  test('State - Loading: Feed service supports pagination with valid page index', async () => {
    const page2 = await feedService.getFeed(2);
    expect(page2.meta.page).toBe(2);
  });

  // State: Empty State
  test('State - Empty: Search returns empty list when query does not match', async () => {
    const emptyResults = await searchService.searchUsers('query_with_no_matches_at_all_xyz');
    expect(emptyResults).toEqual([]);
  });

  // State: Error Handling
  test('State - Error: Safe handling of invalid post IDs', async () => {
    const comments = await commentService.getComments('non-existent-post-id');
    expect(Array.isArray(comments)).toBe(true);
  });
});

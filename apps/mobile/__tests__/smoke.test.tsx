import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashScreen } from '../src/features/auth/screens/SplashScreen';
import { LoginScreen } from '../src/features/auth/screens/LoginScreen';
import { RegisterScreen } from '../src/features/auth/screens/RegisterScreen';
import { HomeScreen } from '../src/features/feed/screens/HomeScreen';
import { SearchScreen } from '../src/features/search/screens/SearchScreen';
import { CreateScreen } from '../src/features/post/screens/CreateScreen';
import { NotificationsScreen } from '../src/features/notifications/screens/NotificationsScreen';
import { ProfileScreen } from '../src/features/profile/screens/ProfileScreen';
import { CommentModal } from '../src/features/comment/components/CommentModal';
import { EditProfileModal } from '../src/features/profile/components/EditProfileModal';
import { PostCard } from '../src/features/feed/components/PostCard';
import { ClayTabBar } from '../src/navigation/ClayTabBar';
import { FeedEmptyState } from '../src/features/feed/components/FeedEmptyState';
import { SearchSkeleton } from '../src/features/search/components/SearchSkeleton';
import { SearchEmptyState } from '../src/features/search/components/SearchEmptyState';
import { NotificationSkeleton } from '../src/features/notifications/components/NotificationSkeleton';
import { NotificationEmptyState } from '../src/features/notifications/components/NotificationEmptyState';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <NavigationContainer>{children}</NavigationContainer>
    </SafeAreaProvider>
  );
}

const mockPost = {
  id: 'post-1',
  author: {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
  },
  content: 'Hello world claymorphism post!',
  media: [],
  likesCount: 12,
  commentsCount: 3,
  isLiked: false,
  isSaved: false,
  createdAt: new Date().toISOString(),
};

const mockProfile = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  bio: 'A claymorphism tester',
  avatarUrl: null,
  followersCount: 150,
  followingCount: 75,
  postsCount: 10,
  isFollowing: false,
};

describe('Smoke UI Render Suite (Gate G4)', () => {
  it('renders SplashScreen without throwing', async () => {
    const { toJSON } = await render(
      <TestWrapper>
        <SplashScreen />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders LoginScreen with input fields and buttons', async () => {
    const mockNav = { navigate: jest.fn() } as any;
    const { getByPlaceholderText, toJSON } = await render(
      <TestWrapper>
        <LoginScreen navigation={mockNav} route={{} as any} />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('renders RegisterScreen with input fields', async () => {
    const mockNav = { navigate: jest.fn() } as any;
    const { getByPlaceholderText, toJSON } = await render(
      <TestWrapper>
        <RegisterScreen navigation={mockNav} route={{} as any} />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
    expect(getByPlaceholderText('Choose a username')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  it('renders HomeScreen with header', async () => {
    const { toJSON } = await render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders PostCard with action row', async () => {
    const { getByLabelText, getByText } = await render(
      <TestWrapper>
        <PostCard
          post={mockPost}
          onToggleLike={jest.fn()}
          onToggleSave={jest.fn()}
          onPressComment={jest.fn()}
        />
      </TestWrapper>,
    );
    expect(getByText('Hello world claymorphism post!')).toBeTruthy();
    expect(getByLabelText(/Like post/i)).toBeTruthy();
    expect(getByLabelText(/Comments/i)).toBeTruthy();
    expect(getByLabelText(/Save post/i)).toBeTruthy();
  });

  it('renders SearchScreen with search input', async () => {
    const { getByPlaceholderText, toJSON } = await render(
      <TestWrapper>
        <SearchScreen />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
    expect(getByPlaceholderText('Tìm kiếm người dùng, @username...')).toBeTruthy();
  });

  it('renders CreateScreen with composition input', async () => {
    const mockNav = { navigate: jest.fn() } as any;
    const { getByPlaceholderText, toJSON } = await render(
      <TestWrapper>
        <CreateScreen navigation={mockNav} route={{} as any} />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
    expect(getByPlaceholderText("What's on your mind?")).toBeTruthy();
  });

  it('renders NotificationsScreen with filter pills', async () => {
    const { getByText, toJSON } = await render(
      <TestWrapper>
        <NotificationsScreen />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
    expect(getByText(/Tất cả \(/i)).toBeTruthy();
    expect(getByText(/Chưa đọc \(/i)).toBeTruthy();
  });

  it('renders ProfileScreen without throwing', async () => {
    const mockNav = { navigate: jest.fn() } as any;
    const { toJSON } = await render(
      <TestWrapper>
        <ProfileScreen navigation={mockNav} route={{} as any} />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders CommentModal with comment input and close button', async () => {
    const { getByPlaceholderText, toJSON } = await render(
      <TestWrapper>
        <CommentModal post={mockPost} visible={true} onClose={jest.fn()} />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
    expect(getByPlaceholderText('Thêm bình luận...')).toBeTruthy();
  });

  it('renders EditProfileModal with form inputs', async () => {
    const { getByPlaceholderText, toJSON } = await render(
      <TestWrapper>
        <EditProfileModal
          profile={mockProfile}
          visible={true}
          onClose={jest.fn()}
          onSave={jest.fn()}
        />
      </TestWrapper>,
    );
    expect(toJSON()).toBeTruthy();
    expect(getByPlaceholderText('Tên hiển thị của bạn')).toBeTruthy();
  });

  it('renders ClayTabBar with 5 navigation tabs', async () => {
    const mockProps = {
      state: {
        index: 0,
        routes: [
          { key: 'Home-1', name: 'Home' },
          { key: 'Search-2', name: 'Search' },
          { key: 'Create-3', name: 'Create' },
          { key: 'Notifications-4', name: 'Notifications' },
          { key: 'Profile-5', name: 'Profile' },
        ],
      },
      descriptors: {
        'Home-1': { options: {} },
        'Search-2': { options: {} },
        'Create-3': { options: {} },
        'Notifications-4': { options: {} },
        'Profile-5': { options: {} },
      },
      navigation: {
        navigate: jest.fn(),
        emit: jest.fn(() => ({ defaultPrevented: false })),
      },
      insets: { top: 0, left: 0, right: 0, bottom: 20 },
    } as any;

    const { getByLabelText } = await render(
      <TestWrapper>
        <ClayTabBar {...mockProps} />
      </TestWrapper>,
    );
    expect(getByLabelText('Home')).toBeTruthy();
    expect(getByLabelText('Search')).toBeTruthy();
    expect(getByLabelText('Create post')).toBeTruthy();
    expect(getByLabelText('Notifications')).toBeTruthy();
    expect(getByLabelText('Profile')).toBeTruthy();
  });

  it('renders empty and skeleton states properly', async () => {
    const { toJSON: feedEmpty } = await render(<FeedEmptyState />);
    expect(feedEmpty()).toBeTruthy();

    const { toJSON: searchSkeleton } = await render(<SearchSkeleton />);
    expect(searchSkeleton()).toBeTruthy();

    const { toJSON: searchEmpty } = await render(<SearchEmptyState query="nobody" />);
    expect(searchEmpty()).toBeTruthy();

    const { toJSON: notifSkeleton } = await render(<NotificationSkeleton />);
    expect(notifSkeleton()).toBeTruthy();

    const { toJSON: notifEmpty } = await render(<NotificationEmptyState activeTab="all" />);
    expect(notifEmpty()).toBeTruthy();
  });
});

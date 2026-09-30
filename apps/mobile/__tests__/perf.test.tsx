import React, { Profiler, memo, useCallback, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { PostCard } from '../src/features/feed/components/PostCard';
import type { Post } from '../src/features/feed/types';

const mockPost1: Post = {
  id: 'post-1',
  author: {
    id: 'user-1',
    username: 'user1',
    displayName: 'User One',
    avatarUrl: null,
  },
  content: 'First post content',
  media: [],
  likesCount: 5,
  commentsCount: 2,
  isLiked: false,
  isSaved: false,
  createdAt: '2026-09-30T00:00:00.000Z',
};

const mockPost2: Post = {
  id: 'post-2',
  author: {
    id: 'user-2',
    username: 'user2',
    displayName: 'User Two',
    avatarUrl: null,
  },
  content: 'Second post content',
  media: [],
  likesCount: 15,
  commentsCount: 6,
  isLiked: true,
  isSaved: false,
  createdAt: '2026-09-30T01:00:00.000Z',
};

interface ProfiledItemProps {
  post: Post;
  onRender: (id: string, phase: 'mount' | 'update') => void;
  onToggleLike: (post: Post) => void;
  onToggleSave: (post: Post) => void;
  onPressComment: (post: Post) => void;
}

const ProfiledPostItem = memo(function ProfiledPostItem({
  post,
  onRender,
  onToggleLike,
  onToggleSave,
  onPressComment,
}: ProfiledItemProps) {
  return (
    <Profiler id={post.id} onRender={(id, phase) => onRender(id, phase)}>
      <PostCard
        post={post}
        onToggleLike={onToggleLike}
        onToggleSave={onToggleSave}
        onPressComment={onPressComment}
      />
    </Profiler>
  );
});

interface ParentProps {
  onPost1Render: (id: string, phase: 'mount' | 'update') => void;
  onPost2Render: (id: string, phase: 'mount' | 'update') => void;
}

function ParentContainer({ onPost1Render, onPost2Render }: ParentProps) {
  const [unrelatedCount, setUnrelatedCount] = useState(0);

  const handleLike = useCallback(() => {}, []);
  const handleSave = useCallback(() => {}, []);
  const handleComment = useCallback(() => {}, []);

  return (
    <View testID="parent-root">
      <Button
        testID="increment-btn"
        title="Update Parent State"
        onPress={() => setUnrelatedCount((c) => c + 1)}
      />
      <Text testID="counter-display">{unrelatedCount}</Text>

      <ProfiledPostItem
        post={mockPost1}
        onRender={onPost1Render}
        onToggleLike={handleLike}
        onToggleSave={handleSave}
        onPressComment={handleComment}
      />

      <ProfiledPostItem
        post={mockPost2}
        onRender={onPost2Render}
        onToggleLike={handleLike}
        onToggleSave={handleSave}
        onPressComment={handleComment}
      />
    </View>
  );
}

describe('Render Performance & Memoization (React.Profiler)', () => {
  it('does not re-render memoized PostCard items when parent state changes', async () => {
    const post1RenderSpy = jest.fn();
    const post2RenderSpy = jest.fn();

    const { getByTestId } = await render(
      <ParentContainer
        onPost1Render={post1RenderSpy}
        onPost2Render={post2RenderSpy}
      />,
    );

    // Initial mount: each PostCard should render exactly once
    expect(post1RenderSpy).toHaveBeenCalledTimes(1);
    expect(post1RenderSpy).toHaveBeenCalledWith('post-1', 'mount');
    expect(post2RenderSpy).toHaveBeenCalledTimes(1);
    expect(post2RenderSpy).toHaveBeenCalledWith('post-2', 'mount');

    // Trigger unrelated state update in parent
    await act(async () => {
      fireEvent.press(getByTestId('increment-btn'));
    });
    expect(getByTestId('counter-display').props.children).toBe(1);

    // Because items are memoized with stable props, neither PostCard should re-render
    expect(post1RenderSpy).toHaveBeenCalledTimes(1);
    expect(post2RenderSpy).toHaveBeenCalledTimes(1);

    // Trigger a second unrelated state update
    await act(async () => {
      fireEvent.press(getByTestId('increment-btn'));
    });
    expect(getByTestId('counter-display').props.children).toBe(2);

    // Count must strictly remain 1 (zero re-renders)
    expect(post1RenderSpy).toHaveBeenCalledTimes(1);
    expect(post2RenderSpy).toHaveBeenCalledTimes(1);
  }, 15000);
});

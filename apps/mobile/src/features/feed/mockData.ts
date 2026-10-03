/**
 * Mock feed data for offline development & UI testing.
 *
 * Each post exercises a different visual scenario:
 *   1. Text-only
 *   2. Single landscape image
 *   3. Multiple images (grid)
 *   4. Long-form text + single image
 *   5. Text-only with high engagement counts
 */
import type { Post } from './types';

/**
 * Helper to produce an ISO date string N hours in the past from "now".
 * Using a fixed reference keeps snapshots stable in tests.
 */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1_000).toISOString();
}

export const MOCK_POSTS: Post[] = [
  {
    author: {
      avatarUrl: null,
      displayName: 'Sarah Chen',
      id: 'user-001',
      username: 'sarahchen',
    },
    commentsCount: 4,
    content:
      'Just finished reading "Atomic Habits" for the second time. The compounding effect of small daily improvements is genuinely life-changing. What books are you re-reading this year? 📚',
    createdAt: hoursAgo(2),
    id: 'post-001',
    isLiked: false,
    isSaved: false,
    likesCount: 23,
    media: [],
  },
  {
    author: {
      avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=120&h=120&fit=crop&crop=face',
      displayName: 'Alex Rivera',
      id: 'user-002',
      username: 'alexrivera',
    },
    commentsCount: 12,
    content: 'Golden hour at Đà Nẵng 🌅',
    createdAt: hoursAgo(5),
    id: 'post-002',
    isLiked: true,
    isSaved: false,
    likesCount: 87,
    media: [
      {
        id: 'media-001',
        order: 0,
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1559628233-100c798642d4?w=800&q=70',
      },
    ],
  },
  {
    author: {
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
      displayName: 'Minh Trần',
      id: 'user-003',
      username: 'minhtran',
    },
    commentsCount: 8,
    content: 'Weekend brunch vibes ✨ Which one would you pick?',
    createdAt: hoursAgo(18),
    id: 'post-003',
    isLiked: false,
    isSaved: true,
    likesCount: 142,
    media: [
      {
        id: 'media-002',
        order: 0,
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=70',
      },
      {
        id: 'media-003',
        order: 1,
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=70',
      },
      {
        id: 'media-004',
        order: 2,
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=70',
      },
    ],
  },
  {
    author: {
      avatarUrl: null,
      displayName: null,
      id: 'user-004',
      username: 'devlife_vn',
    },
    commentsCount: 31,
    content:
      'Day 45 of #100DaysOfCode 🚀\n\nFinally cracked that nasty race condition in the auth middleware. Turns out the token refresh was firing twice when the app came back from background.\n\nLesson learned: always debounce your refresh logic and use a mutex around token storage writes.\n\nKeep grinding everyone! 💪',
    createdAt: hoursAgo(26),
    id: 'post-004',
    isLiked: true,
    isSaved: true,
    likesCount: 256,
    media: [
      {
        id: 'media-005',
        order: 0,
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=70',
      },
    ],
  },
  {
    author: {
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
      displayName: 'Thanh Nguyễn',
      id: 'user-005',
      username: 'thanhnguyen',
    },
    commentsCount: 67,
    content:
      'Hot take: TypeScript strict mode should be the default for every project, no exceptions. Fight me. 🔥',
    createdAt: hoursAgo(48),
    id: 'post-005',
    isLiked: false,
    isSaved: false,
    likesCount: 412,
    media: [],
  },
];

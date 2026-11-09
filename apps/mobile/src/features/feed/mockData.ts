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
      'Vừa đọc lại "Atomic Habits" lần thứ hai và vẫn thấy đáng. Mỗi ngày tốt hơn một chút, cộng dồn cả năm thì khác hẳn. Năm nay mọi người đọc lại cuốn nào?',
    createdAt: hoursAgo(2),
    id: 'post-001',
    isLiked: false,
    isSaved: false,
    likesCount: 23,
    media: [],
  },
  {
    author: {
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face',
      displayName: 'Alex Rivera',
      id: 'user-002',
      username: 'alexrivera',
    },
    commentsCount: 12,
    content: 'Ruộng bậc thang lúc chiều muộn, nhìn từ trên đồi. Leo bộ 40 phút mới tới nhưng không tiếc chút nào.',
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
    content: 'Brunch cuối tuần, ba món ba kiểu. Mọi người chọn món nào?',
    createdAt: hoursAgo(18),
    id: 'post-003',
    isLiked: false,
    isSaved: true,
    likesCount: 142,
    media: [
      {
        id: 'media-002',
        order: 0,
        // Shows the blurred "Ảnh nhạy cảm" cover in mock mode.
        sensitive: true,
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
      'Ngày 45 của #100DaysOfCode\n\nCuối cùng cũng bắt được lỗi race condition trong middleware xác thực: token bị làm mới hai lần khi app quay lại từ nền.\n\nBài học: debounce phần làm mới và khoá lại mỗi lần ghi token.\n\nCố lên mọi người 💪', // taste-skill-ignore: user content in mock data
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
      'Ý kiến cá nhân: dự án TypeScript nào cũng nên bật strict mode ngay từ ngày đầu. Ai không đồng ý thì vào đây tranh luận.',
    createdAt: hoursAgo(48),
    id: 'post-005',
    isLiked: false,
    isSaved: false,
    likesCount: 412,
    media: [],
  },
];

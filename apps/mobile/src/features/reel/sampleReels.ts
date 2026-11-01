/**
 * Sample reels shown while the Reel backend does not exist yet (and in mock
 * mode). The clips are short public test videos; `isSample` makes the UI keep
 * every interaction on the device instead of calling the API with fake ids.
 */
import type { Post } from '../feed/types';

type Sample = { caption: string; name: string; url: string; username: string };

const SAMPLES: Sample[] = [
  {
    caption: 'Một buổi sáng trong vườn 🌸 #thiennhien #thugian', // taste-skill-ignore: user-written caption in sample data, not interface text
    name: 'Mai Anh',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    username: 'maianh',
  },
  {
    caption: 'Chú thỏ béo và khu rừng của chú 🐰 #hoathinh', // taste-skill-ignore: user-written caption in sample data, not interface text
    name: 'Blender Fan',
    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    username: 'blenderfan',
  },
  {
    caption: 'Sứa phát sáng dưới đại dương, xem mãi không chán #daiduong',
    name: 'Ocean Daily',
    url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
    username: 'oceandaily',
  },
  {
    caption: 'Trích đoạn phim ngắn Sintel #phimngan @blenderfan',
    name: 'Short Films',
    url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
    username: 'shortfilms',
  },
  {
    caption: 'Thử nghiệm video ngắn đầu tiên của mình',
    name: 'Nhật Luân',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    username: 'nhatluan.dev',
  },
];

export const SAMPLE_REELS: Post[] = SAMPLES.map((sample, index) => ({
  author: {
    avatarUrl: null,
    displayName: sample.name,
    id: `sample-author-${index}`,
    username: sample.username,
  },
  commentsCount: 0,
  content: sample.caption,
  createdAt: new Date(Date.UTC(2026, 9, 1 + index)).toISOString(),
  id: `sample-reel-${index}`,
  isLiked: false,
  isSample: true,
  isSaved: false,
  likesCount: 12 * (index + 1),
  media: [{ id: `sample-media-${index}`, order: 0, type: 'VIDEO', url: sample.url }],
  privacy: 'PUBLIC',
}));

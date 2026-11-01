import type { Post, PostAuthor } from '../features/feed/types';
import type { StoryGroup } from '../features/stories/services/storyService';

export type AuthStackParamList = {
  ForgotPassword: undefined;
  /** Product introduction, shown only on the very first launch. */
  Intro: undefined;
  Legal: {
    doc: 'privacy' | 'terms' | 'community';
  };
  Login:
    | {
        email?: string;
        message?: string;
      }
    | undefined;
  Register: undefined;
  NewPassword: {
    code: string;
    email: string;
  };
  VerifyCode: {
    email: string;
    /** Defaults to `resetPassword` (the original use of this screen). */
    mode?: 'resetPassword' | 'verifyEmail';
    /** Email a fresh code when the screen opens (user arrived without one). */
    resend?: boolean;
  };
};

export type MainTabParamList = {
  Create: undefined;
  Home: undefined;
  Messages: undefined;
  Profile: undefined;
  /** `query` pre-fills the search box (used when a hashtag is tapped). */
  Search: { query?: string } | undefined;
};

/** Screens pushed on top of the tab bar. `Tabs` is the tab navigator itself. */
export type MainStackParamList = {
  /** Risk warning and the switch for anonymous messages. */
  AnonymousMessages: undefined;
  BlockedUsers: undefined;
  ChangePassword: undefined;
  /** One-to-one conversation. */
  Chat: {
    conversationId: string;
    peer: PostAuthor;
  };
  DeleteAccount: undefined;
  FollowList: {
    type: 'followers' | 'following';
    userId: string;
  };
  FollowRequests: undefined;
  NewMessage: undefined;
  Notifications: undefined;
  Legal: {
    doc: 'privacy' | 'terms' | 'community';
  };
  PostDetail: {
    /** Scroll to and highlight this comment (opened from a notification). */
    commentId?: string;
    postId: string;
  };
  PostLikes: {
    postId: string;
  };
  /** Full-screen reels starting on the video of this post. */
  ReelViewer: {
    post: Post;
  };
  SavedPosts: undefined;
  Settings: undefined;
  /** Full-screen stories, starting with `groups[startIndex]`. */
  StoryViewer: {
    groups: StoryGroup[];
    startIndex: number;
  };
  /** Who reacted to one of your stories (anonymous reactions show as "Người ẩn danh"). */
  StoryReactions: {
    storyId: string;
  };
  Tabs: { params?: { query?: string }; screen: keyof MainTabParamList } | undefined;
  UserProfile: {
    userId: string;
  };
};

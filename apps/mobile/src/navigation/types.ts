export type AuthStackParamList = {
  ForgotPassword: undefined;
  /** Product introduction, shown only on the very first launch. */
  Intro: undefined;
  Legal: {
    doc: 'privacy' | 'terms';
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
  Notifications: undefined;
  Profile: undefined;
  /** `query` pre-fills the search box (used when a hashtag is tapped). */
  Search: { query?: string } | undefined;
};

/** Screens pushed on top of the tab bar. `Tabs` is the tab navigator itself. */
export type MainStackParamList = {
  BlockedUsers: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  FollowList: {
    type: 'followers' | 'following';
    userId: string;
  };
  Legal: {
    doc: 'privacy' | 'terms';
  };
  PostDetail: {
    /** Scroll to and highlight this comment (opened from a notification). */
    commentId?: string;
    postId: string;
  };
  PostLikes: {
    postId: string;
  };
  SavedPosts: undefined;
  Settings: undefined;
  Tabs: { params?: { query?: string }; screen: keyof MainTabParamList } | undefined;
  UserProfile: {
    userId: string;
  };
};

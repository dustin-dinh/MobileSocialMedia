export type AuthStackParamList = {
  ForgotPassword: undefined;
  Login:
    | {
        email?: string;
        message?: string;
      }
    | undefined;
  Register: undefined;
  VerifyCode: {
    email: string;
  };
};

export type MainTabParamList = {
  Create: undefined;
  Home: undefined;
  Notifications: undefined;
  Profile: undefined;
  Search: undefined;
};

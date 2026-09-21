export type AuthStackParamList = {
  Login:
    | {
        email?: string;
        message?: string;
      }
    | undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Create: undefined;
  Home: undefined;
  Notifications: undefined;
  Profile: undefined;
  Search: undefined;
};

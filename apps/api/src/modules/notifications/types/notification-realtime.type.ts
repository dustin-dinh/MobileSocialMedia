export type NotificationRealtimePayload = {
    id: string;
    type: string;
    createdAt: Date;
    actor: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
    };
    post?: {
        id: string;
    } | null;
    comment?: {
        id: string;
    } | null;
};
export type JwtPayload = {
    sub: string;
    /** User.tokenVersion lúc cấp token; thiếu (token cũ) nghĩa là 0. */
    ver?: number;
    iat?: number;
    exp?: number;
};

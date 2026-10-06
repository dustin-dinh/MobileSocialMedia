import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";

export type VerifiedGooglePayload = {
    sub: string;
    email?: string;
    emailVerified?: boolean;
    name?: string;
    picture?: string;
};

@Injectable()
export class GoogleVerifierService {
    private readonly client: OAuth2Client;
    private readonly webClientId: string;

    constructor(private readonly configService: ConfigService) {
        this.webClientId = this.configService.getOrThrow<string>("GOOGLE_WEB_CLIENT_ID");
        this.client = new OAuth2Client(this.webClientId);
    }

    async verify(idToken: string): Promise<VerifiedGooglePayload> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: this.webClientId,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.sub) {
                throw new UnauthorizedException("Invalid Google token");
            }
            return {
                sub: payload.sub,
                email: payload.email,
                emailVerified: payload.email_verified,
                name: payload.name,
                picture: payload.picture,
            };
        } catch {
            throw new UnauthorizedException("Invalid Google token");
        }
    }
}

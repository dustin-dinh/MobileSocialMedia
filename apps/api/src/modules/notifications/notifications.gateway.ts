import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    namespace: "/notifications",
    cors: {
        origin: "*",
    },
})
export class NotificationsGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
    ) { }

    async handleConnection(
        client: Socket,
    ): Promise<void> {
        try {
            const token = this.extractToken(client);

            if (!token) {
                client.disconnect(true);
                return;
            }

            const payload =
                await this.jwtService.verifyAsync<{
                    sub?: string;
                }>(token);

            const userId = payload.sub;

            if (!userId) {
                client.disconnect(true);
                return;
            }

            client.data.userId = userId;

            await client.join(`user:${userId}`);

            console.log(
                `[NotificationsGateway] connected client=${client.id} user=${userId}`,
            );
        } catch {
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket): void {
        console.log(
            `[NotificationsGateway] disconnected client=${client.id}`,
        );
    }

    private extractToken(
        client: Socket,
    ): string | null {
        const authToken = client.handshake.auth?.token;

        if (
            typeof authToken === "string" &&
            authToken.length > 0
        ) {
            return authToken.startsWith("Bearer ")
                ? authToken.slice(7)
                : authToken;
        }

        const authorization =
            client.handshake.headers.authorization;

        if (
            typeof authorization === "string" &&
            authorization.startsWith("Bearer ")
        ) {
            return authorization.slice(7);
        }

        return null;
    }

    emitToUser(
        userId: string,
        notification: unknown,
    ): void {
        this.server
            .to(`user:${userId}`)
            .emit(
                "notification:new",
                notification,
            );
    }
}
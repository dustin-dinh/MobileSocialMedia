import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const authorSelect = {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
} as const;

// Ai chặn ai cũng tính: hai bên không thấy nội dung của nhau.
export async function blockedUserIds(
    prisma: PrismaService,
    userId: string,
): Promise<string[]> {
    const blocks = await prisma.block.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
    });

    return blocks.map((block) =>
        block.blockerId === userId ? block.blockedId : block.blockerId,
    );
}

// Người bị khóa, bị khóa vì tuổi hoặc đã xóa tài khoản: nội dung của họ biến mất với mọi người khác.
export const activeUserWhere = {
    bannedAt: null,
    ageLockedAt: null,
    deletedAt: null,
} satisfies Prisma.UserWhereInput;

// Người viewer đã tắt tiếng: chỉ ẩn khỏi bảng tin, Reels và khay tin; vẫn xem được trên trang cá nhân.
export async function mutedUserIds(
    prisma: PrismaService,
    userId: string,
): Promise<string[]> {
    const mutes = await prisma.mute.findMany({
        where: { muterId: userId },
        select: { mutedId: true },
    });

    return mutes.map((mute) => mute.mutedId);
}

// Điều kiện duy nhất quyết định viewer có được xem một bài viết hay không.
export function visiblePostWhere(
    viewerId: string,
    blockedIds: string[] = [],
): Prisma.PostWhereInput {
    return {
        deletedAt: null,
        author: activeUserWhere,
        ...(blockedIds.length ? { authorId: { notIn: blockedIds } } : {}),
        OR: [
            // Bài công khai của tài khoản riêng tư chỉ dành cho người theo dõi.
            {
                privacy: 'PUBLIC',
                author: {
                    OR: [
                        { isPrivate: false },
                        { followers: { some: { followerId: viewerId } } },
                    ],
                },
            },
            { authorId: viewerId },
            {
                privacy: 'FRIENDS',
                author: {
                    followers: { some: { followerId: viewerId } },
                    following: { some: { followingId: viewerId } },
                },
            },
        ],
    };
}

// Bình luận còn hiện: không bị quản trị viên gỡ, và không nằm dưới một bình luận bị gỡ.
export const visibleCommentWhere = {
    removedAt: null,
    OR: [{ parentId: null }, { parent: { is: { removedAt: null } } }],
} satisfies Prisma.CommentWhereInput;

export function postSelect(viewerId: string) {
    return {
        id: true,
        content: true,
        privacy: true,
        createdAt: true,
        updatedAt: true,
        author: {
            select: {
                ...authorSelect,
                mutedBy: { where: { muterId: viewerId }, select: { muterId: true } },
            },
        },
        media: {
            orderBy: { order: 'asc' },
            select: {
                id: true,
                url: true,
                type: true,
                order: true,
                thumbnailUrl: true,
                width: true,
                height: true,
                durationMs: true,
                sensitive: true,
            },
        },
        _count: { select: { likes: true, comments: { where: visibleCommentWhere }, reposts: true } },
        likes: { where: { userId: viewerId }, select: { userId: true, type: true } },
        saves: { where: { userId: viewerId }, select: { userId: true } },
        reposts: { where: { userId: viewerId }, select: { userId: true } },
    } satisfies Prisma.PostSelect;
}

type PostRow = Prisma.PostGetPayload<{ select: ReturnType<typeof postSelect> }>;

export function toPostDto(post: PostRow) {
    const { mutedBy, ...author } = post.author;

    return {
        id: post.id,
        content: post.content,
        privacy: post.privacy,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author,
        media: post.media,
        likeCount: post._count.likes,
        commentsCount: post._count.comments,
        repostsCount: post._count.reposts,
        isLiked: post.likes.length > 0,
        // Cảm xúc viewer đã thả (LIKE, LOVE, HAHA, WOW, SAD, ANGRY) hoặc null.
        myReaction: post.likes[0]?.type ?? null,
        isSaved: post.saves.length > 0,
        isReposted: post.reposts.length > 0,
        // Viewer đã tắt tiếng tác giả (để menu hiện "Bỏ tắt tiếng"); tác giả không biết điều này.
        isAuthorMuted: mutedBy.length > 0,
    };
}

export function pageMeta(page: number, limit: number, total: number) {
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export function repostSelect(viewerId: string) {
    return {
        id: true,
        createdAt: true,
        postId: true,
        user: { select: authorSelect },
        post: { select: postSelect(viewerId) },
    } satisfies Prisma.RepostSelect;
}

type RepostRow = Prisma.RepostGetPayload<{
    select: ReturnType<typeof repostSelect>;
}>;

// available = viewer còn được xem bài gốc (chưa xóa, đúng quyền riêng tư).
export function toRepostDto(repost: RepostRow, available: boolean) {
    return {
        type: 'REPOST' as const,
        id: repost.id,
        createdAt: repost.createdAt,
        repostedBy: repost.user,
        originalPost: available
            ? { available: true, ...toPostDto(repost.post) }
            : {
                id: null,
                available: false,
                content: null,
                author: null,
                media: [],
                likeCount: null,
                isLiked: false,
                commentsCount: null,
            },
    };
}

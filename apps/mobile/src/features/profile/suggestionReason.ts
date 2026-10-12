import type { SuggestedUser } from './types';

/** One-line explanation of why a user is suggested, e.g. "Được A, B và 3 người khác theo dõi". */
export function suggestionReason(
  user: Pick<SuggestedUser, 'mutualCount' | 'mutualPreview' | 'reason'>,
): string {
  if (user.reason === 'FOLLOWS_YOU') {
    return 'Đang theo dõi bạn';
  }

  if (user.reason === 'MUTUAL' && user.mutualPreview.length > 0) {
    const others = user.mutualCount - user.mutualPreview.length;
    const names = user.mutualPreview.join(', ');

    return others > 0
      ? `Được ${names} và ${others} người khác theo dõi`
      : `Được ${names} theo dõi`;
  }

  return 'Gợi ý cho bạn';
}

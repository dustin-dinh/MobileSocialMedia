import { showToast } from '../../components/common/toast';
import { feedEvents } from '../feed/feedEvents';
import { profileService } from './services/profileService';

/**
 * Mute or unmute a user from any screen: calls the API, tells every list
 * (`muteChanged`) and confirms with a toast. Resolves to false when it failed.
 */
export async function setUserMuted(userId: string, muted: boolean): Promise<boolean> {
  try {
    await profileService.setMuted(userId, muted);
    feedEvents.emitMuteChanged(userId, muted);
    showToast(
      muted
        ? 'Đã tắt tiếng. Bài viết và tin của người này sẽ không hiện trên bảng tin của bạn.'
        : 'Đã bỏ tắt tiếng.',
    );

    return true;
  } catch {
    showToast('Không thực hiện được. Vui lòng thử lại.', 'error');

    return false;
  }
}

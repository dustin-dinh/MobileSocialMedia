import { ApiError } from '../../services/apiError';

/** Vietnamese text for the reasons the API refuses to open a conversation, or an anonymous message or reaction. */
const ANONYMOUS_ERRORS: Record<string, string> = {
  ANONYMOUS_DAILY_LIMIT: 'Hôm nay bạn đã mở quá nhiều cuộc trò chuyện ẩn danh.',
  ANONYMOUS_FOLLOW_REQUIRED: 'Bạn cần theo dõi người này để nhắn ẩn danh.',
  ANONYMOUS_NOT_ACCEPTED: 'Người này không nhận tin nhắn ẩn danh.',
  ANONYMOUS_NOT_ELIGIBLE: 'Tài khoản cần xác thực email và đủ 7 ngày tuổi để nhắn ẩn danh.',
  ANONYMOUS_SUSPENDED: 'Bạn đã bị tạm dừng quyền gửi tin ẩn danh.',
  CONTACT_INFO_BLOCKED:
    'Tin ẩn danh không được chứa đường link, số điện thoại hay số tài khoản ngân hàng.',
  CONVERSATION_CLOSED: 'Người này không nhận tin ẩn danh từ bạn nữa.',
  MESSAGE_NOT_ALLOWED: 'Người này chỉ nhận tin nhắn từ những người họ theo dõi.',
  REQUEST_DAILY_LIMIT:
    'Hôm nay bạn đã nhắn cho nhiều người chưa theo dõi bạn. Hãy thử lại vào ngày mai.',
  REQUEST_LIMIT: 'Hãy chờ người này trả lời trước khi gửi thêm.',
};

export function anonymousErrorText(error: unknown, fallback: string): string {
  return (error instanceof ApiError && error.code && ANONYMOUS_ERRORS[error.code]) || fallback;
}

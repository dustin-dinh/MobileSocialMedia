/**
 * Report service — `POST /reports`. Reporting the same target twice only
 * updates the reason on the server, so retries are harmless.
 */
import { USE_MOCK_API } from '../../config/runtime';
import { httpClient } from '../../services/httpClient';

export type ReportTarget = {
  id: string;
  type: 'COMMENT' | 'POST' | 'USER';
};

/** Codes accepted by the backend, with the label shown to the user. */
export const REPORT_REASONS = [
  { code: 'SPAM', label: 'Spam hoặc quảng cáo' },
  { code: 'HARASSMENT', label: 'Quấy rối hoặc bắt nạt' },
  { code: 'SENSITIVE', label: 'Nội dung nhạy cảm' },
  { code: 'MISINFORMATION', label: 'Thông tin sai lệch' },
  { code: 'OTHER', label: 'Lý do khác' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['code'];

export const reportService = {
  async report(target: ReportTarget, reason: ReportReason): Promise<void> {
    if (USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 200));

      return;
    }

    await httpClient.requestVoid<{ reason: string; targetId: string; targetType: string }>({
      body: { reason, targetId: target.id, targetType: target.type },
      method: 'POST',
      path: 'reports',
    });
  },
} as const;

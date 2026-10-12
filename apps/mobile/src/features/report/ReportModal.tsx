import { useMemo } from 'react';

import { ActionSheet } from '../../components/common/ActionSheet';
import { showToast } from '../../components/common/toast';
import { REPORT_REASONS, reportService, type ReportTarget } from './reportService';

type ReportModalProps = {
  onClose: () => void;
  /** Called after the report was accepted, e.g. to hide the content locally. */
  onReported?: () => void;
  target: ReportTarget | null;
};

const TITLES: Record<ReportTarget['type'], string> = {
  COMMENT: 'Báo cáo bình luận',
  POST: 'Báo cáo bài viết',
  USER: 'Báo cáo người dùng',
};

/** Reason picker used for posts, comments and users. */
export function ReportModal({ onClose, onReported, target }: ReportModalProps) {
  const options = useMemo(
    () =>
      REPORT_REASONS.map((reason) => ({
        icon: 'Flag',
        key: reason.code,
        label: reason.label,
        onPress: () => {
          if (!target) {
            return;
          }

          reportService
            .report(target, reason.code)
            .then(() => {
              showToast('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này.');
              onReported?.();
            })
            .catch(() => {
              showToast('Không gửi được báo cáo. Vui lòng thử lại.', 'error');
            });
        },
      })),
    [onReported, target],
  );

  return (
    <ActionSheet
      onClose={onClose}
      options={options}
      title={target ? TITLES[target.type] : ''}
      visible={target !== null}
    />
  );
}

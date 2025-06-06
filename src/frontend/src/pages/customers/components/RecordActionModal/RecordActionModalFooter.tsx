import React from 'react';
import { ModalFooter } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Spinner } from '../../../../components/ui/Spinner';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface RecordActionModalFooterProps {
  loading: boolean;
  submitting: boolean;
  selectedCount: number;
  onClose: () => void;
  onSubmit: () => void;
}

export const RecordActionModalFooter: React.FC<RecordActionModalFooterProps> = ({
  loading,
  submitting,
  selectedCount,
  onClose,
  onSubmit
}) => {
  const { t } = useTranslation();

  return (
    <ModalFooter>
      <Button variant="secondary" onClick={onClose} disabled={submitting}>
        {t('forms:buttons.cancel')}
      </Button>
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={loading || submitting || selectedCount === 0}
      >
        {submitting ? (
          <>
            <Spinner size="sm" className="mr-2" />
            {t('customers:record_action.recording_actions')}
          </>
        ) : (
          t('customers:record_action.record_actions_count', {
            replace: { count: selectedCount }
          })
        )}
      </Button>
    </ModalFooter>
  );
};
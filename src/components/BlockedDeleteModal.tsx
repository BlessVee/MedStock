import { Modal } from './Modal';

interface Props {
  name: string;
  entityLabel: string;
  onArchive: () => void;
  onClose: () => void;
}

export function BlockedDeleteModal({ name, entityLabel, onArchive, onClose }: Props) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
          Can&apos;t delete &quot;{name}&quot;
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          This {entityLabel} has transaction history and can&apos;t be permanently deleted. Archive
          it to hide it from active lists — you can permanently delete it later from the Archive
          view.
        </div>
      </div>
      <div
        style={{
          padding: '16px 22px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
        }}
      >
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            onArchive();
            onClose();
          }}
        >
          Archive
        </button>
      </div>
    </Modal>
  );
}

import type { Priority } from '../../domain/task';

const LABELS: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span className={`pill pill--${priority}`}>
      <span className={`dot dot--${priority}`} aria-hidden="true" />
      {LABELS[priority]}
    </span>
  );
}

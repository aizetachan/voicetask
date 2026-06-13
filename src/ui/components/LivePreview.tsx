import type { ParsedTask } from '../../domain/parser';
import { formatRelative } from '../../domain/format';
import { PriorityPill } from './PriorityPill';

/** Muestra en vivo cómo quedará la ficha mientras el usuario escribe/dicta. */
export function LivePreview({ parsed, now }: { parsed: ParsedTask; now: Date }) {
  return (
    <div className="preview" aria-live="polite">
      <span className="preview__title">{parsed.title || 'Nueva tarea'}</span>
      <span className="preview__meta">
        <span className={parsed.dueAt === null ? 'preview__date--none' : 'preview__date'}>
          {formatRelative(parsed.dueAt, now)}
        </span>
        <PriorityPill priority={parsed.priority} />
      </span>
    </div>
  );
}

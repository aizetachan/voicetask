export function EmptyState() {
  return (
    <div className="empty">
      <div className="empty__glyph" aria-hidden="true">
        ✺
      </div>
      <p className="empty__title">Todo despejado</p>
      <p className="empty__hint">
        Escribe algo como «llamar al fontanero mañana a las 10 urgente» y se
        convierte en tarea.
      </p>
    </div>
  );
}

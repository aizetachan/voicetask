import { useCallback, useMemo, useRef, useState, type FormEvent } from 'react';
import { parseInput, type ParsedTask } from '../../domain/parser';
import { useDictation } from '../hooks/useDictation';
import { LivePreview } from './LivePreview';

interface Props {
  onAdd: (parsed: ParsedTask) => void;
}

export function CaptureBar({ onAdd }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDictated = useCallback((dictated: string) => setText(dictated), []);
  const { isSupported, isListening, error, toggle } = useDictation({ onText: handleDictated });

  const trimmed = text.trim();
  // Preview en vivo: re-parsea en cada cambio del texto.
  const preview = useMemo<ParsedTask | null>(
    () => (trimmed ? parseInput(trimmed, new Date()) : null),
    [trimmed],
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!preview || !preview.title) return;
    onAdd(preview);
    setText('');
    inputRef.current?.focus();
  }

  return (
    <form className="capture" onSubmit={submit}>
      {error && <p className="capture__error" role="alert">{error}</p>}
      {preview && <LivePreview parsed={preview} now={new Date()} />}
      <div className="capture__row">
        {isSupported && (
          <button
            type="button"
            className={`capture__mic${isListening ? ' capture__mic--on' : ''}`}
            onClick={toggle}
            aria-pressed={isListening}
            aria-label={isListening ? 'Detener dictado' : 'Dictar tarea'}
          >
            {isListening ? <span className="capture__mic-wave" aria-hidden="true" /> : '🎤'}
          </button>
        )}
        <input
          ref={inputRef}
          className="capture__input"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="sentences"
          placeholder={isListening ? 'Escuchando…' : 'Captura una tarea…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Texto de la tarea"
        />
        <button
          type="submit"
          className="capture__add"
          disabled={!preview || !preview.title}
          aria-label="Añadir tarea"
        >
          +
        </button>
      </div>
    </form>
  );
}

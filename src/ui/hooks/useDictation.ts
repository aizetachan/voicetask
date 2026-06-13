import { useCallback, useEffect, useRef, useState } from 'react';
import { dictation } from '../../services/dictation';

interface UseDictationOptions {
  /** Se llama con la transcripción (parcial y final) para rellenar el input. */
  onText: (text: string) => void;
}

interface UseDictation {
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
  toggle: () => void;
}

/**
 * Hook de dictado con la misma interfaz en nativo y web. Encapsula permisos,
 * estado de escucha y limpieza al desmontar.
 */
export function useDictation({ onText }: UseDictationOptions): UseDictation {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mantiene la última versión del callback sin reiniciar el dictado.
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  // Detiene la escucha si el componente se desmonta.
  useEffect(() => {
    return () => {
      void dictation.stop();
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const granted = await dictation.requestPermission();
    if (!granted) {
      setError('Permiso de micrófono denegado');
      return;
    }
    setIsListening(true);
    await dictation.start({
      onPartial: (text) => onTextRef.current(text),
      onFinal: (text) => onTextRef.current(text),
      onError: (message) => setError(message),
      onEnd: () => setIsListening(false),
    });
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      void dictation.stop();
      setIsListening(false);
    } else {
      void start();
    }
  }, [isListening, start]);

  return {
    isSupported: dictation.isSupported,
    isListening,
    error,
    toggle,
  };
}

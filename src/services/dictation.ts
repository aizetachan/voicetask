// Reconocimiento de voz unificado. Aísla la plataforma: plugin nativo de
// Capacitor en iOS/Android, Web Speech API en navegador. Sin React aquí.

import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const LANGUAGE = 'es-ES';

export interface DictationHandlers {
  /** Transcripción parcial en vivo (va rellenando el input). */
  onPartial: (text: string) => void;
  /** Texto final al terminar de escuchar. */
  onFinal?: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export interface Dictation {
  readonly isSupported: boolean;
  requestPermission(): Promise<boolean>;
  start(handlers: DictationHandlers): Promise<void>;
  stop(): Promise<void>;
}

// ---------- Implementación nativa (Capacitor) ----------
function createNativeDictation(): Dictation {
  let lastPartial = '';

  return {
    isSupported: true,
    async requestPermission() {
      try {
        const status = await SpeechRecognition.requestPermissions();
        return status.speechRecognition === 'granted';
      } catch {
        return false;
      }
    },
    async start(handlers) {
      lastPartial = '';
      await SpeechRecognition.removeAllListeners();

      await SpeechRecognition.addListener('partialResults', (data) => {
        const text = data.matches?.[0] ?? '';
        if (text) {
          lastPartial = text;
          handlers.onPartial(text);
        }
      });

      await SpeechRecognition.addListener('listeningState', (data) => {
        if (data.status === 'stopped') {
          if (lastPartial) handlers.onFinal?.(lastPartial);
          handlers.onEnd?.();
          void SpeechRecognition.removeAllListeners();
        }
      });

      try {
        await SpeechRecognition.start({
          language: LANGUAGE,
          partialResults: true,
          popup: false,
        });
      } catch (e) {
        handlers.onError?.(e instanceof Error ? e.message : 'Error de reconocimiento');
        handlers.onEnd?.();
      }
    },
    async stop() {
      try {
        await SpeechRecognition.stop();
      } catch {
        /* noop */
      }
    },
  };
}

// ---------- Implementación web (Web Speech API) ----------
type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

function getWebSpeechCtor(): (new () => WebSpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    webkitSpeechRecognition?: new () => WebSpeechRecognition;
    SpeechRecognition?: new () => WebSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function createWebDictation(Ctor: new () => WebSpeechRecognition): Dictation {
  let recognition: WebSpeechRecognition | null = null;

  return {
    isSupported: true,
    async requestPermission() {
      // El navegador solicita el permiso de micrófono al arrancar el reconocimiento.
      return true;
    },
    async start(handlers) {
      const rec = new Ctor();
      recognition = rec;
      rec.lang = LANGUAGE;
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      let finalText = '';
      rec.onresult = (event) => {
        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? '';
          if (result.isFinal) finalText += transcript;
          else interim += transcript;
        }
        handlers.onPartial((finalText + interim).trim());
      };
      rec.onerror = (event) => handlers.onError?.(event.error);
      rec.onend = () => {
        if (finalText.trim()) handlers.onFinal?.(finalText.trim());
        handlers.onEnd?.();
        recognition = null;
      };

      try {
        rec.start();
      } catch (e) {
        handlers.onError?.(e instanceof Error ? e.message : 'Error de reconocimiento');
        handlers.onEnd?.();
      }
    },
    async stop() {
      recognition?.stop();
    },
  };
}

// ---------- Selección de plataforma ----------
function createDictation(): Dictation {
  if (Capacitor.isNativePlatform()) return createNativeDictation();
  const Ctor = getWebSpeechCtor();
  if (Ctor) return createWebDictation(Ctor);
  // Sin soporte: degradación elegante (la UI ocultará el micro).
  return {
    isSupported: false,
    async requestPermission() {
      return false;
    },
    async start(handlers) {
      handlers.onError?.('Reconocimiento de voz no disponible');
      handlers.onEnd?.();
    },
    async stop() {
      /* noop */
    },
  };
}

export const dictation: Dictation = createDictation();

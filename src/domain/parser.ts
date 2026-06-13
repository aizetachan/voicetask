// Núcleo del producto: parsing de lenguaje natural a una ficha de tarea.
// Dominio puro: sin React, sin Capacitor. 100% local (chrono-node, sin APIs).

import * as chrono from 'chrono-node';
import type { Priority } from './task';

export interface ParsedTask {
  title: string;
  dueAt: number | null;
  priority: Priority;
}

/** Hora por defecto cuando hay día pero no hora explícita. */
const DEFAULT_HOUR = 9;

// Palabras/expresiones clave de prioridad (case-insensitive).
// "!!" se trata aparte porque no admite límites de palabra (\b).
// Versiones con /g para reemplazo; sin /g para detección (evita el bug de
// lastIndex compartido al llamar .test() repetidamente).
const ALTA_SRC = '\\b(urgente|importante|cuanto antes|asap|ya)\\b';
const BAJA_SRC = '\\b(sin prisa|cuando pueda|alg[uú]n d[ií]a|opcional)\\b';
const BANG_SRC = '!!+';

const ALTA_TEST = new RegExp(`${ALTA_SRC}|${BANG_SRC}`, 'i');
const BAJA_TEST = new RegExp(BAJA_SRC, 'i');

// Conectores colgantes a eliminar al final del título (al inicio de palabra o cadena).
const DANGLING_CONNECTOR = /(^|\s+)(el|la|los|las|para|a las|de|del)\s*$/i;

function detectPriority(text: string): Priority {
  if (ALTA_TEST.test(text)) return 'alta';
  if (BAJA_TEST.test(text)) return 'baja';
  return 'media';
}

function stripPriorityWords(text: string): string {
  return text
    .replace(new RegExp(ALTA_SRC, 'gi'), ' ')
    .replace(new RegExp(BANG_SRC, 'g'), ' ')
    .replace(new RegExp(BAJA_SRC, 'gi'), ' ');
}

function cleanTitle(text: string): string {
  let title = text.replace(/\s+/g, ' ').trim();
  // Quita conectores colgantes al final, repetidamente ("... a las de" -> "...").
  while (DANGLING_CONNECTOR.test(title)) {
    title = title.replace(DANGLING_CONNECTOR, '').trim();
  }
  if (title.length === 0) return title;
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function parseInput(text: string, now: Date = new Date()): ParsedTask {
  const priority = detectPriority(text);

  // 1. Fecha: chrono en español, prefiriendo fechas futuras.
  const results = chrono.es.parse(text, now, { forwardDate: true });

  let dueAt: number | null = null;
  let withoutDate = text;

  if (results.length > 0) {
    const first = results[0];
    const date = first.start.date();
    // Si no hay hora explícita pero sí un día, fija la hora por defecto (09:00).
    if (!first.start.isCertain('hour')) {
      date.setHours(DEFAULT_HOUR, 0, 0, 0);
    }
    dueAt = date.getTime();

    // Elimina del título todos los tramos de fecha detectados (de atrás
    // hacia delante para no invalidar los índices).
    const spans = [...results].sort((a, b) => b.index - a.index);
    for (const r of spans) {
      withoutDate =
        withoutDate.slice(0, r.index) + ' ' + withoutDate.slice(r.index + r.text.length);
    }
  }

  // 2 + 3. Quita palabras de prioridad y limpia el título.
  const title = cleanTitle(stripPriorityWords(withoutDate));

  return { title, dueAt, priority };
}

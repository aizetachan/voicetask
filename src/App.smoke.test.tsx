import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App';

// Smoke test de integración: monta el árbol completo (TasksProvider, store,
// CaptureBar, parser, servicios) y verifica que renderiza sin lanzar.
describe('App (smoke)', () => {
  it('renderiza la pantalla principal sin errores', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Ahora'); // cabecera
    expect(html).toContain('Captura una tarea'); // barra de captura
  });
});

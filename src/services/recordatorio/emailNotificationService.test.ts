import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enviarEmailRecordatorio } from './emailNotificationService';

// Mock de fetch global
global.fetch = vi.fn();

describe('emailNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock de variables de entorno
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('enviarEmailRecordatorio', () => {
    it('debe enviar email exitosamente usando la Edge Function', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const resultado = await enviarEmailRecordatorio(
        'test@example.com',
        'Recordatorio de Hábito',
        'Es hora de hacer ejercicio',
        'Ejercicio'
      );

      expect(resultado.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/send-daily-reminders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-anon-key',
          }),
        })
      );
    });

    it('debe manejar errores de la Edge Function', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error enviando email' }),
      });

      const resultado = await enviarEmailRecordatorio(
        'test@example.com',
        'Recordatorio',
        'Mensaje',
        'Hábito'
      );

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBeDefined();
    });

    it('debe manejar errores de configuración faltante', async () => {
      delete import.meta.env.VITE_SUPABASE_URL;

      const resultado = await enviarEmailRecordatorio(
        'test@example.com',
        'Recordatorio',
        'Mensaje',
        'Hábito'
      );

      expect(resultado.success).toBe(false);
      expect(resultado.error).toContain('Configuración de Supabase');
    });

    it('debe incluir todos los datos necesarios en el request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await enviarEmailRecordatorio(
        'user@example.com',
        'Título',
        'Mensaje personalizado',
        'Nombre del Hábito'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.toEmail).toBe('user@example.com');
      expect(body.subject).toBe('Título');
      expect(body.message).toBe('Mensaje personalizado');
      expect(body.habitName).toBe('Nombre del Hábito');
      expect(body.directSend).toBe(true);
    });
  });
});


import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LogrosModal from './LogrosModal';
import { supabase } from '../../../config/supabase';

vi.mock('../../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('LogrosModal - Racha Máxima Correcta', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe calcular la racha máxima de TODOS los hábitos del usuario', async () => {
    // Mock de múltiples rachas de diferentes hábitos
    const mockRachas = [
      { racha_maxima: 15 }, // Hábito 1
      { racha_maxima: 30 }, // Hábito 2 (la más alta)
      { racha_maxima: 7 },  // Hábito 3
      { racha_maxima: 20 }, // Hábito 4
    ];

    // Mock para la consulta de rachas (primera llamada a from('racha'))
    const mockRachaQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRachas,
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockRachaQuery)
      .mockReturnValueOnce(mockLogrosQuery)
      .mockReturnValueOnce(mockLogroUsuarioQuery);

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    render(
      <LogrosModal isOpen={true} onClose={() => {}} userId={userId} />
    );

    // Esperar a que cargue
    await waitFor(() => {
      // Debe mostrar la racha máxima más alta (30)
      expect(screen.getByText(/30 días/i)).toBeInTheDocument();
    });
  });

  it('debe retornar 0 si no hay rachas', async () => {
    // Mock para la consulta de rachas (primera llamada a from('racha'))
    const mockRachaQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockRachaQuery)
      .mockReturnValueOnce(mockLogrosQuery)
      .mockReturnValueOnce(mockLogroUsuarioQuery);

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    render(
      <LogrosModal isOpen={true} onClose={() => {}} userId={userId} />
    );

    await waitFor(() => {
      expect(screen.getByText(/0 días/i)).toBeInTheDocument();
    });
  });

  it('debe calcular correctamente con una sola racha', async () => {
    const mockRachas = [{ racha_maxima: 42 }];

    // Mock para la consulta de rachas (primera llamada a from('racha'))
    const mockRachaQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRachas,
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockRachaQuery)
      .mockReturnValueOnce(mockLogrosQuery)
      .mockReturnValueOnce(mockLogroUsuarioQuery);

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    render(
      <LogrosModal isOpen={true} onClose={() => {}} userId={userId} />
    );

    await waitFor(() => {
      expect(screen.getByText(/42 días/i)).toBeInTheDocument();
    });
  });

  it('debe usar Math.max para encontrar la racha más alta', async () => {
    const mockRachas = [
      { racha_maxima: 100 },
      { racha_maxima: 5 },
      { racha_maxima: 150 }, // La más alta
      { racha_maxima: 75 },
    ];

    // Mock para la consulta de rachas (primera llamada a from('racha'))
    const mockRachaQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRachas,
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockRachaQuery)
      .mockReturnValueOnce(mockLogrosQuery)
      .mockReturnValueOnce(mockLogroUsuarioQuery);

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    render(
      <LogrosModal isOpen={true} onClose={() => {}} userId={userId} />
    );

    await waitFor(() => {
      expect(screen.getByText(/150 días/i)).toBeInTheDocument();
    });
  });

  it('debe manejar valores null en racha_maxima', async () => {
    const mockRachas = [
      { racha_maxima: 10 },
      { racha_maxima: null }, // Valor null
      { racha_maxima: 25 },
      { racha_maxima: 0 },
    ];

    // Mock para la consulta de rachas (primera llamada a from('racha'))
    const mockRachaQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRachas,
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockRachaQuery)
      .mockReturnValueOnce(mockLogrosQuery)
      .mockReturnValueOnce(mockLogroUsuarioQuery);

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    render(
      <LogrosModal isOpen={true} onClose={() => {}} userId={userId} />
    );

    await waitFor(() => {
      // Debe ignorar el null y usar el máximo válido (25)
      expect(screen.getByText(/25 días/i)).toBeInTheDocument();
    });
  });

  it('debe cargar rachas cuando el modal se abre', async () => {
    const mockRachas = [{ racha_maxima: 50 }];

    // Mock para la consulta de rachas (primera llamada a from('racha'))
    const mockRachaQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRachas,
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockRachaQuery)
      .mockReturnValueOnce(mockLogrosQuery)
      .mockReturnValueOnce(mockLogroUsuarioQuery);

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    const { rerender } = render(
      <LogrosModal isOpen={false} onClose={() => {}} userId={userId} />
    );

    // El modal está cerrado, no debe cargar datos
    expect(supabase.from).not.toHaveBeenCalled();

    // Abrir el modal
    rerender(<LogrosModal isOpen={true} onClose={() => {}} userId={userId} />);

    // Ahora sí debe cargar
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });
  });
});

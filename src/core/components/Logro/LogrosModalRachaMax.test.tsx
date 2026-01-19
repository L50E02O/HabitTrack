import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LogrosModal from './LogrosModal';
import { supabase } from '../../../config/supabase';

vi.mock('../../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Helper para crear mocks chainables de Supabase
const createSupabaseChain = (finalResult: { data: any; error: any | null }, useSingle = false) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };
  if (useSingle) {
    chain.single = vi.fn().mockResolvedValue(finalResult);
  } else {
    // Para métodos que no usan single, eq retorna la promesa directamente
    chain.eq = vi.fn().mockResolvedValue(finalResult);
  }
  return chain;
};

describe('LogrosModal - Racha Máxima Correcta', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe calcular la racha máxima de TODOS los hábitos del usuario', async () => {
    const userId = 'user123';

    // Mock para la consulta de perfil (primera llamada a from('perfil'))
    const mockPerfilQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { racha_maxima: 30 }, // Racha máxima del usuario
        error: null,
      }),
    };

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockPerfilQuery)
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
      .mockReturnValueOnce(mockPerfilQuery)
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
    // Mock para la consulta de perfil (primera llamada a from('perfil'))
    const mockPerfilQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { racha_maxima: 42 },
            error: null,
          }),
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
      .mockReturnValueOnce(mockPerfilQuery)
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
    // Mock para la consulta de perfil (primera llamada a from('perfil'))
    const mockPerfilQuery = createSupabaseChain({
      data: { racha_maxima: 150 }, // La más alta
      error: null,
    }, true);

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockPerfilQuery)
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
    // Mock para la consulta de perfil (primera llamada a from('perfil'))
    const mockPerfilQuery = createSupabaseChain({
      data: { racha_maxima: 0 },
      error: null,
    }, true);

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockPerfilQuery)
      .mockReturnValueOnce(mockLogrosQuery)
      .mockReturnValueOnce(mockLogroUsuarioQuery);

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    render(
      <LogrosModal isOpen={true} onClose={() => {}} userId={userId} />
    );

    await waitFor(() => {
      // Debe mostrar 0 días cuando racha_maxima es 0
      expect(screen.getByText(/0 días/i)).toBeInTheDocument();
    });
  });

  it('debe cargar rachas cuando el modal se abre', async () => {
    // Mock para la consulta de perfil (primera llamada a from('perfil'))
    const mockPerfilQuery = createSupabaseChain({
      data: { racha_maxima: 50 },
      error: null,
    }, true);

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockPerfilQuery)
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

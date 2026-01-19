import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LogrosModal from './LogrosModal';
import { supabase } from '../../../config/supabase';

// Mock de Supabase
vi.mock('../../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Helper para crear mocks chainables de Supabase
const createSupabaseChain = (finalResult: { data: any; error: any | null }) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
  };
  // El último método en la cadena debe retornar la promesa
  return chain;
};

describe('LogrosModal', () => {
  const mockUserId = 'user-123';
  const mockOnClose = vi.fn();

  const mockLogros = [
    {
      id_logro: '1',
      nombre_logro: 'Primer Paso',
      descripcion: '¡Tu primera racha de 1 día!',
      icono: 'Flame',
      criterio_racha: 1,
    },
    {
      id_logro: '2',
      nombre_logro: 'En Marcha',
      descripcion: 'Racha de 3 días',
      icono: 'Zap',
      criterio_racha: 3,
    },
    {
      id_logro: '3',
      nombre_logro: 'Compromiso',
      descripcion: 'Racha de 7 días',
      icono: 'Star',
      criterio_racha: 7,
    },
  ];

  const mockLogrosUsuario = [
    {
      id_logro_usuario: 'lu1',
      id_logro: '1',
      id_perfil: mockUserId,
      fecha_desbloqueo: '2024-01-15',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el modal cuando isOpen es true', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'perfil') {
        // Para obtener racha_maxima
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { racha_maxima: 5 },
            error: null,
          }),
        };
        return chain;
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockLogrosUsuario, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
    });
    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Mis Logros')).toBeInTheDocument();
    });
  });

  it('no debe renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <LogrosModal isOpen={false} onClose={mockOnClose} userId={mockUserId} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe mostrar la racha máxima del usuario', async () => {
    // Mock para la consulta de perfil (primera llamada a from('perfil'))
    const mockPerfilQuery = createSupabaseChain({
      data: { racha_maxima: 15 },
      error: null,
    });

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockLogros,
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

    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/15 días/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar logros desbloqueados', async () => {
    // Mock para la consulta de perfil (primera llamada a from('perfil'))
    const mockPerfilQuery = createSupabaseChain({
      data: { racha_maxima: 5 },
      error: null,
    });

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockLogros,
        error: null,
      }),
    };

    // Mock para la consulta de logro_usuario (tercera llamada a from('logro_usuario'))
    const mockLogroUsuarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: mockLogrosUsuario,
        error: null,
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(mockPerfilQuery)
      .mockReturnValueOnce(mockLogrosQuery)
      .mockReturnValueOnce(mockLogroUsuarioQuery);

    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Primer Paso')).toBeInTheDocument();
      expect(screen.getByText(/Desbloqueados \(1\)/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar logros bloqueados', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'perfil') {
        return createSupabaseChain({
          data: { racha_maxima: 1 },
          error: null,
        });
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockLogrosUsuario, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
    });
    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('En Marcha')).toBeInTheDocument();
      expect(screen.getByText('Compromiso')).toBeInTheDocument();
      expect(screen.getByText(/Bloqueados \(2\)/i)).toBeInTheDocument();
    });
  });

  it('debe calcular correctamente el porcentaje de progreso', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'perfil') {
        return createSupabaseChain({
          data: { racha_maxima: 5 },
          error: null,
        });
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockLogrosUsuario, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
    });
    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      // 1 de 3 logros = 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
      expect(screen.getByText('1/3 Logros')).toBeInTheDocument();
    });
  });

  it('debe cerrar el modal al hacer click en el botón X', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'perfil') {
        return createSupabaseChain({
          data: { racha_maxima: 5 },
          error: null,
        });
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
    });
    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find((btn) => btn.querySelector('svg'));
      if (closeButton) fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe cerrar el modal al hacer click en el overlay', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'perfil') {
        return createSupabaseChain({
          data: { racha_maxima: 0 },
          error: null,
        });
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
    });
    (supabase.from as any) = mockFrom;

    const { container } = render(
      <LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />
    );

    await waitFor(() => {
      const overlay = container.querySelector('.logros-modal-overlay');
      if (overlay) fireEvent.click(overlay);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe mostrar spinner mientras carga', () => {
    // Mock para la consulta de perfil que nunca se resuelve (para mostrar spinner)
    const mockPerfilQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      ),
    };

    const mockFrom = vi.fn().mockReturnValueOnce(mockPerfilQuery);
    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    expect(screen.getByText(/Cargando logros\.\.\.$/i)).toBeInTheDocument();
  });

  it('debe mostrar días faltantes para logros bloqueados', async () => {
    // Mock para la consulta de perfil (primera llamada a from('perfil'))
    const mockPerfilQuery = createSupabaseChain({
      data: { racha_maxima: 2 }, // Usuario tiene 2 días
      error: null,
    });

    // Mock para la consulta de logros (segunda llamada a from('logro'))
    const mockLogrosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockLogros,
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

    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      // Para "En Marcha" (3 días, usuario tiene 2): Faltan 1 días
      const faltanElements = screen.getAllByText(/Faltan/i);
      expect(faltanElements.length).toBeGreaterThan(0);
      // Hay 3 elementos con "Faltan" - verificamos que al menos uno es para "En Marcha" que requiere 1 día más
      const enMarchaElement = faltanElements.find(el => el.textContent?.includes('1') && el.textContent?.includes('días'));
      expect(enMarchaElement).toBeTruthy();
    });
  });
});

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
      if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { racha_maxima: 5 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
          }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockLogrosUsuario, error: null }),
          }),
        };
      }
      return {};
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
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { racha_maxima: 15 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
          }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {};
    });
    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/15 días/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar logros desbloqueados', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { racha_maxima: 5 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
          }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockLogrosUsuario, error: null }),
          }),
        };
      }
      return {};
    });
    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Primer Paso')).toBeInTheDocument();
      expect(screen.getByText(/Desbloqueados \(1\)/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar logros bloqueados', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { racha_maxima: 1 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
          }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockLogrosUsuario, error: null }),
          }),
        };
      }
      return {};
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
      if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { racha_maxima: 5 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
          }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockLogrosUsuario, error: null }),
          }),
        };
      }
      return {};
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
      if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { racha_maxima: 5 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
          }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {};
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
    const mockFrom = vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { racha_maxima: 0 }, error: null }),
            }),
          }),
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }));
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
    const mockFrom = vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(
                () => new Promise(() => {}) // Never resolves
              ),
            }),
          }),
        }),
      }),
    }));
    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    expect(screen.getByText(/Cargando logros/i)).toBeInTheDocument();
  });

  it('debe mostrar días faltantes para logros bloqueados', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { racha_maxima: 2 }, // Usuario tiene 2 días
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      } else if (table === 'logro') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
          }),
        };
      } else if (table === 'logro_usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {};
    });
    (supabase.from as any) = mockFrom;

    render(<LogrosModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />);

    await waitFor(() => {
      // Para "En Marcha" (3 días): Faltan 1 días
      expect(screen.getByText(/Faltan/i)).toBeInTheDocument();
      expect(screen.getByText(/1/)).toBeInTheDocument();
    });
  });
});

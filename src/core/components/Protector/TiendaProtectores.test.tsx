import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TiendaProtectores from './TiendaProtectores';
import * as protectorService from '../../../services/protector/protectorService';

// Mock del servicio
vi.mock('../../../services/protector/protectorService');

describe('TiendaProtectores', () => {
  const mockUserId = 'user-123';
  const mockOnClose = vi.fn();
  const mockOnCompraExitosa = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el modal cuando isOpen es true', () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    expect(screen.getByText('Tienda de Protectores')).toBeInTheDocument();
  });

  it('no debe renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <TiendaProtectores
        isOpen={false}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe mostrar el saldo actual de puntos y protectores', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(750);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(3);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('750')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('debe cerrar el modal al hacer click en el botón X', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getAllByRole('button').find((btn) => 
        btn.querySelector('svg')
      );
      if (closeButton) fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe deshabilitar el botón de compra si no tiene puntos suficientes', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(100); // Menos de 250
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      const button = screen.getByText(/Puntos insuficientes/i);
      expect(button).toBeDisabled();
    });
  });

  it('debe deshabilitar el botón si ya compró esta semana', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(false);

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Ya compraste esta semana/i)).toBeInTheDocument();
    });
  });

  it('debe comprar un protector exitosamente', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);
    vi.mocked(protectorService.comprarProtector).mockResolvedValue({
      success: true,
      message: '¡Protector comprado exitosamente! 🛡️',
      protectoresNuevos: 3,
    });

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      const button = screen.getByText(/Comprar Protector/i);
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(protectorService.comprarProtector).toHaveBeenCalledWith(mockUserId);
      expect(screen.getByText(/exitosamente/i)).toBeInTheDocument();
    });

    // Debe cerrar el modal después de 2 segundos
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 2500 });
  });

  it('debe mostrar mensaje de error si la compra falla', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);
    vi.mocked(protectorService.comprarProtector).mockResolvedValue({
      success: false,
      message: 'Error al procesar la compra',
    });

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      const button = screen.getByText(/Comprar Protector/i);
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error al procesar/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar spinner mientras carga', () => {
    vi.mocked(protectorService.getPuntosActuales).mockImplementation(
      () => new Promise(() => {}) // Promesa que nunca se resuelve
    );
    vi.mocked(protectorService.getProtectoresActuales).mockImplementation(
      () => new Promise(() => {})
    );
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    expect(screen.getByText(/Cargando logros/i)).toBeInTheDocument();
  });

  it('debe llamar onCompraExitosa después de una compra exitosa', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);
    vi.mocked(protectorService.comprarProtector).mockResolvedValue({
      success: true,
      message: '¡Protector comprado!',
      protectoresNuevos: 3,
    });

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      const button = screen.getByText(/Comprar Protector/i);
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockOnCompraExitosa).toHaveBeenCalled();
    });
  });

  it('debe cerrar el modal al hacer click en el overlay', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);

    const { container } = render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      const overlay = container.querySelector('.tienda-overlay');
      if (overlay) fireEvent.click(overlay);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('no debe cerrar el modal al hacer click en el contenido', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);

    const { container } = render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      const modal = container.querySelector('.tienda-modal');
      if (modal) fireEvent.click(modal);
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('debe mostrar el precio correcto (250 puntos)', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });

  it('debe actualizar el saldo después de comprar', async () => {
    vi.mocked(protectorService.getPuntosActuales).mockResolvedValue(500);
    vi.mocked(protectorService.getProtectoresActuales).mockResolvedValue(2);
    vi.mocked(protectorService.puedeComprarProtectorEstaSemana).mockResolvedValue(true);
    vi.mocked(protectorService.comprarProtector).mockResolvedValue({
      success: true,
      message: '¡Protector comprado!',
      protectoresNuevos: 3,
    });

    render(
      <TiendaProtectores
        isOpen={true}
        onClose={mockOnClose}
        userId={mockUserId}
        onCompraExitosa={mockOnCompraExitosa}
      />
    );

    // Antes de comprar debe mostrar 500 puntos
    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    // Comprar protector
    await waitFor(() => {
      const button = screen.getByText(/Comprar Protector/i);
      fireEvent.click(button);
    });

    // Después de comprar debe mostrar 250 puntos (500 - 250)
    await waitFor(() => {
      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });
});

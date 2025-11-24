// Ejemplo de integración del modal de desbloqueo en progressService
// Este código muestra cómo usar LogroUnlockModal cuando se complete un hábito

import { useState } from 'react';
import { recordHabitProgress } from '../services/habito/progressService';
import LogroUnlockModal from '../core/components/Logro/LogroUnlockModal';
import { ILogro } from '../types/ILogro';

export const HabitCompletionExample = () => {
  const [showModal, setShowModal] = useState(false);
  const [unlockedLogro, setUnlockedLogro] = useState<ILogro | null>(null);

  const handleCompleteHabit = async (
    idHabito: string,
    idPerfil: string,
    tipoIntervalo: string,
    numeroIntervalo: number,
    nivelDificultad: string
  ) => {
    try {
      // Llamar al servicio de progreso
      const result = await recordHabitProgress(
        idHabito,
        idPerfil,
        tipoIntervalo,
        numeroIntervalo,
        nivelDificultad
      );

      // El servicio progressService maneja internamente los logros
      // pero no los retorna directamente en ProgressResponse
      // Los logros se manejan automáticamente dentro del servicio
      console.log(result.message);

    } catch (error) {
      console.error('Error al completar hábito:', error);
    }
  };

  return (
    <div>
      {/* Tu UI de completar hábito */}
      <button
        onClick={() => handleCompleteHabit(
          'id-habito',
          'id-perfil',
          'diario',
          1,
          'facil'
        )}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Completar Hábito
      </button>

      {/* Modal de logro desbloqueado */}
      {unlockedLogro && (
        <LogroUnlockModal
          logro={unlockedLogro}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setUnlockedLogro(null);
          }}
          protectoresGanados={0}
        />
      )}
    </div>
  );
};

export default HabitCompletionExample;

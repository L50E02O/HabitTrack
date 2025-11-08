// Ejemplo de integración del modal de desbloqueo en progressService
// Este código muestra cómo usar LogroUnlockModal cuando se complete un hábito

import { useState } from 'react';
import { recordHabitProgress } from '@/services/habito/progressService';
import LogroUnlockModal from '@/core/components/Logro/LogroUnlockModal';
import { ILogro } from '@/types/ILogro';

export const HabitCompletionExample = () => {
  const [showModal, setShowModal] = useState(false);
  const [unlockedLogro, setUnlockedLogro] = useState<ILogro | null>(null);
  const [protectoresGanados, setProtectoresGanados] = useState(0);

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

      // Verificar si hay logros desbloqueados
      if (result.logrosInfo && result.logrosInfo.logrosNuevos.length > 0) {
        // Mostrar el primer logro desbloqueado
        const primerLogro = result.logrosInfo.logrosNuevos[0];
        
        setUnlockedLogro(primerLogro);
        setProtectoresGanados(result.logrosInfo.protectoresGanados);
        setShowModal(true);

        // Opcional: Mostrar los demás logros en secuencia
        if (result.logrosInfo.logrosNuevos.length > 1) {
          // Esperar 3 segundos y mostrar el siguiente
          setTimeout(() => {
            setUnlockedLogro(result.logrosInfo.logrosNuevos[1]);
            setShowModal(true);
          }, 3000);
        }
      }

      // Mostrar mensaje de éxito normal
      console.log(result.mensaje);

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
          protectoresGanados={protectoresGanados}
        />
      )}
    </div>
  );
};

export default HabitCompletionExample;

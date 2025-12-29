import { X } from 'lucide-react';
import CalendarioWidget from './CalendarioWidget';
import './CalendarioModal.css';

interface CalendarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  darkMode?: boolean;
}

export default function CalendarioModal({ isOpen, onClose, userId, darkMode = false }: CalendarioModalProps) {
  if (!isOpen) return null;

  return (
    <div className={`calendario-modal-overlay ${darkMode ? 'dark' : ''}`} onClick={onClose}>
      <div className="calendario-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="calendario-modal-header">
          <h2 className="calendario-modal-title">Calendario de Rachas</h2>
          <button 
            className="calendario-modal-close" 
            onClick={onClose}
            aria-label="Cerrar calendario"
          >
            <X size={24} />
          </button>
        </div>
        <div className="calendario-modal-body">
          <CalendarioWidget userId={userId} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}


import type { ReactNode } from 'react';
import '../web.css';

interface ModalShellProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  cardClassName?: string;
  cardStyle?: object;
}

export function ModalShell({ visible, onClose, children, cardClassName = '', cardStyle }: ModalShellProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-backdrop"
      onClick={onClose}
    >
      <div
        className={`glass w-full max-w-[500px] overflow-hidden rounded-4xl border border-white/10 bg-civic-card shadow-xl animate-modal-pop ${cardClassName}`}
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

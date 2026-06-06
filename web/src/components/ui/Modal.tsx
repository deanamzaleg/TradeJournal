import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`modal-panel bg-panel border border-border rounded-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}
        style={{ borderLeft: '3px solid var(--color-accent)', boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 40px rgba(46,220,133,0.06)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-text font-semibold text-base">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="p-1.5 -mr-1.5 rounded-md text-muted hover:text-text hover:bg-panel-2">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}

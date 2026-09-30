import React, { useEffect } from 'react';
import { TactileButton } from './TactileButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'primary' | 'destructive' | 'warning';
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  badgeVariant = 'primary',
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
  }[maxWidth];

  const badgeClass = {
    primary: 'bg-[#3B82F6]/15 text-[#adc6ff] border-[#3B82F6]/30',
    destructive: 'bg-[#E11D48]/20 text-[#ff8093] border-[#E11D48]/40',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  }[badgeVariant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090D16]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidthClass} bg-[#0D1526] border border-[#1E2D4A] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        style={{
          boxShadow: 'inset 0px 1px 2px 0px rgba(255, 255, 255, 0.12), 0 24px 48px -8px rgba(0, 0, 0, 0.85)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D4A] bg-[#090D16]/60">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {badge && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${badgeClass}`}>
                  {badge}
                </span>
              )}
              <h2 className="text-sm md:text-base font-semibold text-white tracking-tight">{title}</h2>
            </div>
            {subtitle && <p className="text-xs text-[#8c909f]">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-[#8c909f] hover:text-white p-1 rounded hover:bg-[#1E2D4A]/50 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-lg leading-none" data-icon="close">
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-[#1E2D4A] bg-[#090D16]/60 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

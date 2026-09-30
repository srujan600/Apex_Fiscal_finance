import React from 'react';
import { RiskLevel, RequestStatus, BreachClassification } from '../../types';

interface StatusBadgeProps {
  status: RiskLevel | RequestStatus | BreachClassification | string;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  pulse = false,
  size = 'md',
  className = '',
}) => {
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  // Config mapping based on Stitch semantic token matrix
  const getBadgeConfig = () => {
    switch (status) {
      // Risk & Breach States
      case 'HEALTHY':
        return {
          bg: 'bg-[#10B981]/10',
          border: 'border-[#10B981]/30',
          text: 'text-[#10B981]',
          dot: 'bg-[#10B981]',
          label: 'HEALTHY',
        };
      case 'ATTENTION':
      case 'WARNING_AUDIT':
        return {
          bg: 'bg-[#F59E0B]/15',
          border: 'border-[#F59E0B]/40',
          text: 'text-[#F59E0B]',
          dot: 'bg-[#F59E0B]',
          label: status === 'WARNING_AUDIT' ? 'WARNING AUDIT' : 'ATTENTION (80%+)',
        };
      case 'HIGH_RISK':
        return {
          bg: 'bg-[#EF4444]/15',
          border: 'border-[#EF4444]/40',
          text: 'text-[#ffb4ab]',
          dot: 'bg-[#EF4444]',
          label: 'HIGH RISK (95%+)',
        };
      case 'CRITICAL_BREACH':
      case 'CRITICAL_EXCEPTION':
      case 'BLOCKED':
        return {
          bg: 'bg-[#E11D48]/20',
          border: 'border-[#E11D48]/50',
          text: 'text-[#ff8093]',
          dot: 'bg-[#E11D48]',
          label: status === 'BLOCKED' ? 'BLOCKED' : 'CRITICAL EXCEPTION',
        };
      case 'POLICY_OVERRIDE':
      case 'APPROVED_OVERRIDE':
        return {
          bg: 'bg-[#3B82F6]/20',
          border: 'border-[#3B82F6]/40',
          text: 'text-[#adc6ff]',
          dot: 'bg-[#3B82F6]',
          label: 'POLICY OVERRIDE',
        };
      case 'APPROVED':
      case 'PRE_CLEARED':
        return {
          bg: 'bg-[#14B8A6]/15',
          border: 'border-[#14B8A6]/30',
          text: 'text-[#14B8A6]',
          dot: 'bg-[#14B8A6]',
          label: status === 'PRE_CLEARED' ? 'PRE-CLEARED' : 'APPROVED',
        };
      case 'PENDING_APPROVAL':
        return {
          bg: 'bg-[#6366F1]/15',
          border: 'border-[#6366F1]/30',
          text: 'text-[#c0c1ff]',
          dot: 'bg-[#6366F1]',
          label: 'PENDING ACTION',
        };
      default:
        return {
          bg: 'bg-[#1E2D4A]/40',
          border: 'border-[#1E2D4A]',
          text: 'text-[#c2c6d6]',
          dot: 'bg-[#8c909f]',
          label: String(status).replace(/_/g, ' '),
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${sizeClass} ${config.bg} ${config.border} ${config.text} border tracking-wide uppercase select-none ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} ${pulse ? 'animate-ping' : ''}`}
      />
      <span>{config.label}</span>
    </span>
  );
};

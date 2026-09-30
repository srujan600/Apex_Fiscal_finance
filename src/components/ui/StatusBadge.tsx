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
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]';

  const getBadgeConfig = () => {
    switch (status) {
      case 'HEALTHY':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          dot: 'bg-emerald-500',
          label: 'HEALTHY',
        };
      case 'ATTENTION':
      case 'WARNING_AUDIT':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          dot: 'bg-amber-500',
          label: status === 'WARNING_AUDIT' ? 'WARNING AUDIT' : 'ATTENTION (80%+)',
        };
      case 'HIGH_RISK':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          dot: 'bg-orange-500',
          label: 'HIGH RISK (95%+)',
        };
      case 'CRITICAL_BREACH':
      case 'CRITICAL_EXCEPTION':
      case 'BLOCKED':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          dot: 'bg-rose-500',
          label: status === 'BLOCKED' ? 'BLOCKED' : 'CRITICAL EXCEPTION',
        };
      case 'POLICY_OVERRIDE':
      case 'APPROVED_OVERRIDE':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          dot: 'bg-blue-500',
          label: 'POLICY OVERRIDE',
        };
      case 'APPROVED':
      case 'PRE_CLEARED':
        return {
          bg: 'bg-teal-50',
          border: 'border-teal-200',
          text: 'text-teal-700',
          dot: 'bg-teal-500',
          label: status === 'PRE_CLEARED' ? 'PRE-CLEARED' : 'APPROVED',
        };
      case 'PENDING_APPROVAL':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          text: 'text-indigo-700',
          dot: 'bg-indigo-500',
          label: 'PENDING ACTION',
        };
      default:
        return {
          bg: 'bg-slate-100',
          border: 'border-slate-200',
          text: 'text-slate-700',
          dot: 'bg-slate-400',
          label: String(status).replace(/_/g, ' '),
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full ${sizeClass} ${config.bg} ${config.border} ${config.text} border tracking-wide uppercase select-none transition-colors ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} ${pulse ? 'animate-ping' : ''}`}
      />
      <span>{config.label}</span>
    </span>
  );
};

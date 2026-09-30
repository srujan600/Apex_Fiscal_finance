import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Currency,
  BudgetEnvelope,
  SpendCategory,
  SpendingRequest,
  ExceptionIncident,
  PolicyRule,
  AuditEvent,
  UserProfile,
} from '../types';
import {
  mockUsers,
  initialBudgets,
  initialCategories,
  initialExceptions,
  initialRequests,
  initialPolicyRules,
  initialAuditEvents,
} from '../data/mockData';
import { api } from '../services/api';

interface AppContextType {
  role: UserRole;
  user: UserProfile;
  setRole: (role: UserRole) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  budgets: BudgetEnvelope[];
  categories: SpendCategory[];
  exceptions: ExceptionIncident[];
  requests: SpendingRequest[];
  policies: PolicyRule[];
  auditLogs: AuditEvent[];
  isEmergencyFreezeActive: boolean;
  triggerEmergencyFreeze: () => void;
  resolveEmergencyFreeze: () => void;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string, reason?: string) => void;
  overrideException: (id: string, justification: string) => void;
  enforceRejectException: (id: string) => void;
  addRequest: (newReq: Omit<SpendingRequest, 'id' | 'trackingNumber' | 'submittedAt'>) => void;
  reallocateBudget: (sourceId: string, targetId: string, amount: number) => Promise<void>;
  createBudget: (newBudgetData: any) => Promise<void>;
  updateBudget: (id: string, updateData: { allocated: number; justification: string }) => Promise<void>;
  togglePolicyStatus: (id: string) => void;
  addPolicy: (newPolicy: Omit<PolicyRule, 'id' | 'latencyMs'>) => void;
  addCategory: (newCategory: { name: string; allocated: number; thresholdPercent?: number }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('CFO');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [budgets, setBudgets] = useState<BudgetEnvelope[]>(initialBudgets);
  const [categories, setCategories] = useState<SpendCategory[]>(initialCategories);
  const [exceptions, setExceptions] = useState<ExceptionIncident[]>(initialExceptions);
  const [requests, setRequests] = useState<SpendingRequest[]>(initialRequests);
  const [policies, setPolicies] = useState<PolicyRule[]>(initialPolicyRules);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(initialAuditEvents);
  const [isEmergencyFreezeActive, setIsEmergencyFreezeActive] = useState<boolean>(false);

  const user = mockUsers[role];

  // Fetch initial data from backend API
  useEffect(() => {
    api.getCategories()
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.warn('Backend categories fetch fallback to initial:', err.message);
      });

    api.getBudgets()
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setBudgets(data);
        }
      })
      .catch((err) => {
        console.warn('Backend budgets fetch fallback to initial:', err.message);
      });

    api.getSpendingRequests()
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setRequests(data);
        }
      })
      .catch((err) => {
        console.warn('Backend spending requests fetch fallback to initial:', err.message);
      });

    api.getPolicies()
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setPolicies(data);
        }
      })
      .catch((err) => {
        console.warn('Backend policies fetch fallback to initial:', err.message);
      });

    api.getExceptions()
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setExceptions(data);
        }
      })
      .catch((err) => {
        console.warn('Backend exceptions fetch fallback to initial:', err.message);
      });

    api.getAuditLogs()
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setAuditLogs(data);
        }
      })
      .catch((err) => {
        console.warn('Backend audit logs fetch fallback to initial:', err.message);
      });
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    api.setRole(newRole);
    api.switchRole(newRole).catch(() => {});
    // Add audit entry
    appendAudit(
      'PERSPECTIVE_SWITCH',
      'User Session',
      user.id,
      `ROLE: ${role}`,
      `ROLE: ${newRole}`,
      'Evaluator toggled perspective view in command chrome'
    );
  };

  const appendAudit = (
    action: string,
    entity: string,
    entityId: string,
    oldValue: string,
    newValue: string,
    reason: string
  ) => {
    const newBlock = (auditLogs[0]?.blockNumber || 8941204) + 1;
    const randomHex = Math.random().toString(16).substring(2, 10);
    const newEvent: AuditEvent = {
      id: `aud-${Date.now()}`,
      blockNumber: newBlock,
      txHash: `0x${randomHex}${Date.now().toString(16).slice(-6)}`,
      timestamp: 'Just now',
      actor: user.name,
      actorRole: role,
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      reason,
      verifiedNodes: '12/12 Consensus',
    };
    setAuditLogs((prev) => [newEvent, ...prev]);
  };

  const triggerEmergencyFreeze = () => {
    setIsEmergencyFreezeActive(true);
    appendAudit(
      'EMERGENCY_FREEZE_ACTIVATED',
      'Global Treasury Vault',
      'APX-GLOBAL-US-01',
      'ENFORCEMENT: STANDARD_POLICY_GRAPH',
      'ENFORCEMENT: TOTAL_OUTFLOW_LOCKDOWN',
      'CFO triggered manual emergency killswitch'
    );
  };

  const resolveEmergencyFreeze = () => {
    setIsEmergencyFreezeActive(false);
    appendAudit(
      'EMERGENCY_FREEZE_LIFTED',
      'Global Treasury Vault',
      'APX-GLOBAL-US-01',
      'ENFORCEMENT: TOTAL_OUTFLOW_LOCKDOWN',
      'ENFORCEMENT: STANDARD_POLICY_GRAPH',
      'Executive resolution after capital buffer audit'
    );
  };

  const approveRequest = async (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
    );
    const target = requests.find((r) => r.id === id);
    if (target) {
      appendAudit(
        'REQUISITION_APPROVED',
        'Requisition',
        target.trackingNumber,
        `STATUS: ${target.status}`,
        'STATUS: APPROVED',
        `Approved by ${user.name} (${role})`
      );
    }
    try {
      await api.approveRequest(id);
      api.getBudgets().then((b) => b && Array.isArray(b) && setBudgets(b)).catch(() => {});
    } catch (_err) {
      // optimistic state retained
    }
  };

  const rejectRequest = async (id: string, reason: string = 'Budget ceiling constraint') => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED', policyReason: reason } : r))
    );
    const target = requests.find((r) => r.id === id);
    if (target) {
      appendAudit(
        'REQUISITION_REJECTED',
        'Requisition',
        target.trackingNumber,
        `STATUS: ${target.status}`,
        'STATUS: REJECTED',
        reason
      );
    }
    try {
      await api.rejectRequest(id, reason);
      api.getBudgets().then((b) => b && Array.isArray(b) && setBudgets(b)).catch(() => {});
    } catch (_err) {
      // optimistic state retained
    }
  };

  const overrideException = async (id: string, justification: string) => {
    setExceptions((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, status: 'OVERRIDDEN' } : ex))
    );
    const target = exceptions.find((ex) => ex.id === id);
    if (target) {
      appendAudit(
        'POLICY_OVERRIDE_EXECUTED',
        'Exception Incident',
        target.incidentCode,
        'STATUS: PENDING_DECISION',
        'STATUS: OVERRIDDEN',
        justification
      );
    }
    try {
      await api.overrideException(id, justification);
      api.getSpendingRequests().then((r) => r && Array.isArray(r) && setRequests(r)).catch(() => {});
      api.getBudgets().then((b) => b && Array.isArray(b) && setBudgets(b)).catch(() => {});
    } catch (_err) {
      // optimistic state retained
    }
  };

  const enforceRejectException = async (id: string) => {
    setExceptions((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, status: 'ENFORCED_REJECTED' } : ex))
    );
    const target = exceptions.find((ex) => ex.id === id);
    if (target) {
      appendAudit(
        'POLICY_HARD_STOP_ENFORCED',
        'Exception Incident',
        target.incidentCode,
        'STATUS: PENDING_DECISION',
        'STATUS: ENFORCED_REJECTED',
        'CFO rejected override; mandatory spend cap enforced'
      );
    }
    try {
      await api.enforceRejectException(id);
      api.getSpendingRequests().then((r) => r && Array.isArray(r) && setRequests(r)).catch(() => {});
    } catch (_err) {
      // optimistic state retained
    }
  };

  const addRequest = async (newReqData: Omit<SpendingRequest, 'id' | 'trackingNumber' | 'submittedAt'>) => {
    try {
      const created = await api.createSpendingRequest(newReqData);
      setRequests((prev) => [created, ...prev]);

      // Refresh budgets to sync committed spend & available headroom
      api.getBudgets().then((data) => {
        if (data && Array.isArray(data)) setBudgets(data);
      }).catch(() => {});

      // If blocked or over-budget, add exception incident
      if (created.status === 'BLOCKED' || created.postCommitmentUtil > 100) {
        const nextNum = created.trackingNumber.replace('REQ-', '');
        const newEx: ExceptionIncident = {
          id: `ex-${Date.now()}`,
          incidentCode: `#EX-${nextNum}`,
          timestamp: 'Just now',
          detectionSource: 'SysGuard L9 Engine',
          department: created.departmentName,
          subDepartment: created.category,
          vendor: created.vendor,
          businessPurpose: created.businessPurpose,
          violationDetail: `Causes departmental envelope to reach ${created.postCommitmentUtil.toFixed(1)}%. Requires Group CFO override.`,
          commitmentValue: created.amount,
          breachClassification: 'CRITICAL_EXCEPTION',
          ruleCode: created.ruleTriggered?.split(' ')[0] || 'RULE-ENG-08',
          status: 'PENDING_DECISION',
        };
        setExceptions((prev) => [newEx, ...prev]);
      }
    } catch (_err) {
      // Local optimistic fallback
      const nextNum = requests.length + 9420;
      const trackingNumber = `REQ-${nextNum}`;
      const newReq: SpendingRequest = {
        ...newReqData,
        id: `req-${Date.now()}`,
        trackingNumber,
        submittedAt: 'Just now',
      };
      setRequests((prev) => [newReq, ...prev]);

      appendAudit(
        'NEW_REQUISITION_SUBMITTED',
        'Requisition',
        trackingNumber,
        'STATUS: NONE',
        `STATUS: ${newReq.status}`,
        `Submitted by ${newReq.requestedBy}`
      );

      if (newReq.status === 'BLOCKED' || newReq.postCommitmentUtil > 100) {
        const newEx: ExceptionIncident = {
          id: `ex-${Date.now()}`,
          incidentCode: `#EX-${nextNum}`,
          timestamp: 'Just now',
          detectionSource: 'SysGuard L9 Engine',
          department: newReq.departmentName,
          subDepartment: newReq.category,
          vendor: newReq.vendor,
          businessPurpose: newReq.businessPurpose,
          violationDetail: `Causes departmental envelope to reach ${newReq.postCommitmentUtil.toFixed(1)}%. Requires Group CFO override.`,
          commitmentValue: newReq.amount,
          breachClassification: 'CRITICAL_EXCEPTION',
          ruleCode: newReq.ruleTriggered || 'RULE-ENG-08',
          status: 'PENDING_DECISION',
        };
        setExceptions((prev) => [newEx, ...prev]);
      }
    }
  };

  const reallocateBudget = async (sourceId: string, targetId: string, amount: number) => {
    try {
      const res = await api.reallocateBudget({ sourceId, targetId, amount });
      if (res && res.source && res.target) {
        setBudgets((prev) =>
          prev.map((b) => {
            if (b.id === res.source.id) return res.source;
            if (b.id === res.target.id) return res.target;
            return b;
          })
        );
      }
    } catch (_err) {
      // Local optimistic calculation fallback
      setBudgets((prev) =>
        prev.map((b) => {
          if (b.id === sourceId) {
            const newAvail = b.available - amount;
            return {
              ...b,
              available: newAvail,
              allocated: b.allocated - amount,
              utilizationRate: ((b.actualSettled + b.committed) / (b.allocated - amount)) * 100,
            };
          }
          if (b.id === targetId) {
            const newAlloc = b.allocated + amount;
            const newAvail = b.available + amount;
            return {
              ...b,
              available: newAvail,
              allocated: newAlloc,
              utilizationRate: ((b.actualSettled + b.committed) / newAlloc) * 100,
            };
          }
          return b;
        })
      );
    }

    appendAudit(
      'BUDGET_REALLOCATION_COMMITTED',
      'Department Budgets',
      `${sourceId} -> ${targetId}`,
      `TRANSFER AMOUNT: $${amount.toLocaleString('en-US')}`,
      'REBALANCED',
      'Executive reserve reallocation applied to resolve buffer deficit'
    );
  };

  const createBudget = async (newBudgetData: any) => {
    try {
      const created = await api.createBudget(newBudgetData);
      setBudgets((prev) => [...prev, created]);
    } catch (_err) {
      // Local fallback
    }
  };

  const updateBudget = async (id: string, updateData: { allocated: number; justification: string }) => {
    try {
      const updated = await api.updateBudget(id, updateData);
      setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (_err) {
      // Local fallback
    }
  };

  const togglePolicyStatus = async (id: string) => {
    let targetPolicy: PolicyRule | undefined;
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          targetPolicy = { ...p, status: nextStatus };
          return targetPolicy;
        }
        return p;
      })
    );

    try {
      const updated = await api.togglePolicy(id);
      if (updated) {
        setPolicies((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
    } catch (_err) {
      // Local state already updated optimistically
    }

    if (targetPolicy) {
      appendAudit(
        'POLICY_STATUS_TOGGLED',
        'Policy Engine',
        targetPolicy.code,
        `STATUS: ${targetPolicy.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'}`,
        `STATUS: ${targetPolicy.status}`,
        `Administrator toggled policy state for ${targetPolicy.name}`
      );
    }
  };

  const addPolicy = async (newPolicy: Omit<PolicyRule, 'id' | 'latencyMs'>) => {
    try {
      const created = await api.createPolicy(newPolicy);
      setPolicies((prev) => [created, ...prev]);
    } catch (_err) {
      // Fallback
      const created: PolicyRule = {
        ...newPolicy,
        id: `pol-${Date.now()}`,
        latencyMs: Math.floor(Math.random() * 6 + 11),
      };
      setPolicies((prev) => [created, ...prev]);
    }

    appendAudit(
      'POLICY_RULE_CREATED',
      'Policy Engine',
      newPolicy.code,
      'STATUS: UNREGISTERED',
      'STATUS: ACTIVE',
      `New spend enforcement gate instantiated: ${newPolicy.name}`
    );
  };

  const addCategory = async (newCatData: { name: string; allocated: number; thresholdPercent?: number }) => {
    try {
      const created = await api.createCategory(newCatData);
      setCategories((prev) => [...prev, created]);
    } catch (_err) {
      // Local optimistic fallback
      const fallback: SpendCategory = {
        id: `cat-${Date.now()}`,
        name: newCatData.name,
        code: `CAT-${newCatData.name.slice(0, 4).toUpperCase()}-99`,
        allocated: newCatData.allocated,
        spent: 0,
        committed: 0,
        riskLevel: 'HEALTHY',
        thresholdPercent: newCatData.thresholdPercent || 85,
      };
      setCategories((prev) => [...prev, fallback]);
    }

    appendAudit(
      'CATEGORY_SUBCAP_CREATED',
      'Spend Category',
      newCatData.name,
      'STATUS: NONE',
      `ALLOCATION: $${newCatData.allocated.toLocaleString()}`,
      `New category sub-cap established by ${user.name}`
    );
  };

  return (
    <AppContext.Provider
      value={{
        role,
        user,
        setRole,
        currency,
        setCurrency,
        activeTab,
        setActiveTab,
        budgets,
        categories,
        exceptions,
        requests,
        policies,
        auditLogs,
        isEmergencyFreezeActive,
        triggerEmergencyFreeze,
        resolveEmergencyFreeze,
        approveRequest,
        rejectRequest,
        overrideException,
        enforceRejectException,
        addRequest,
        reallocateBudget,
        createBudget,
        updateBudget,
        togglePolicyStatus,
        addPolicy,
        addCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

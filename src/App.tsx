import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { LandingLoginPage } from './components/auth/LandingLoginPage';
import { AccessRestrictedView } from './components/common/AccessRestrictedView';
import { DashboardView } from './components/dashboard/DashboardView';
import { BudgetsView } from './components/budget/BudgetsView';
import { DepartmentsView } from './components/department/DepartmentsView';
import { CategoriesView } from './components/category/CategoriesView';
import { SpendingView } from './components/spending/SpendingView';
import { ApprovalsView } from './components/approval/ApprovalsView';
import { ExceptionsView } from './components/exception/ExceptionsView';
import { ForecastingView } from './components/forecast/ForecastingView';
import { ReportsView } from './components/report/ReportsView';
import { PolicyEngineView } from './components/policy/PolicyEngineView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';

const WorkspaceRouter: React.FC = () => {
  const { activeTab, allowedTabs } = useApp();

  // If the active tab is not in the allowed tabs for this persona, show the authorization boundary view
  if (!allowedTabs.includes(activeTab)) {
    return <AccessRestrictedView attemptedTab={activeTab} />;
  }

  switch (activeTab) {
    case 'dashboard':
      return <DashboardView />;
    case 'budgets':
      return <BudgetsView />;
    case 'departments':
      return <DepartmentsView />;
    case 'categories':
      return <CategoriesView />;
    case 'spending':
      return <SpendingView />;
    case 'approvals':
      return <ApprovalsView />;
    case 'exceptions':
      return <ExceptionsView />;
    case 'forecasts':
      return <ForecastingView />;
    case 'reports':
      return <ReportsView />;
    case 'policies':
      return <PolicyEngineView />;
    case 'audit':
      return <AuditLogsView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
};

const MainContent: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LandingLoginPage />;
  }

  return (
    <AppShell>
      <WorkspaceRouter />
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;

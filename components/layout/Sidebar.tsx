
import React from 'react';
import { View } from '../../types.js';
import { NavItem } from './NavItem.js';
import { 
    DashboardIcon, JournalIcon, ChartOfAccountsIcon, PurchaseOrdersIcon, 
    ARIcon, APIcon, VendorPaymentsIcon, VendorManagementIcon, 
    CardManagementIcon, ConsulCreditsIcon, PayrollIcon, SettingsIcon, 
    UserManualIcon, TermsIcon 
} from '../../components/shared/Icons.js';
import { X, FileText, Cpu } from 'lucide-react';

// Stripe icons (inline since not in shared/Icons)
const StripePaymentsIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const StripeSettingsIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const StripeComplianceIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const StripeReportsIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ISO20022Icon = () => <FileText className="h-5 w-5" />;

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  openTermsModal: () => void;
  openManualModal: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const mainViews = [
    { id: View.Dashboard, label: 'Dashboard', icon: <DashboardIcon /> },
    { id: View.Journal, label: 'Journal Entries', icon: <JournalIcon /> },
    { id: View.ChartOfAccounts, label: 'Chart of Accounts', icon: <ChartOfAccountsIcon /> },
    { id: View.PurchaseOrders, label: 'Purchase Orders', icon: <PurchaseOrdersIcon /> },
    { id: View.AccountsReceivable, label: 'Accounts Receivable', icon: <ARIcon /> },
    { id: View.AccountsPayable, label: 'Accounts Payable', icon: <APIcon /> },
    { id: View.VendorPayments, label: 'Vendor Payments', icon: <VendorPaymentsIcon /> },
    { id: View.VendorManagement, label: 'Vendor Management', icon: <VendorManagementIcon /> },
    { id: View.CardManagement, label: 'Company Cards', icon: <CardManagementIcon /> },
    { id: View.ConsulCredits, label: 'Consul Credits', icon: <ConsulCreditsIcon /> },
    { id: View.StripePayments, label: 'Stripe Payments', icon: <StripePaymentsIcon /> },
    { id: View.StripeSettings, label: 'Stripe Settings', icon: <StripeSettingsIcon /> },
    { id: View.StripeCompliance, label: 'Stripe Compliance', icon: <StripeComplianceIcon /> },
    { id: View.StripeReports, label: 'Stripe Reports', icon: <StripeReportsIcon /> },
    { id: View.ISO20022, label: 'ISO 20022', icon: <ISO20022Icon /> },
    { id: View.AutonomousSettlement, label: 'Autonomous Settlement', icon: <Cpu className="h-5 w-5 text-sov-accent animate-pulse" /> },
    { id: View.Payroll, label: 'Payroll', icon: <PayrollIcon /> },
    { id: View.Settings, label: 'Settings', icon: <SettingsIcon /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, openTermsModal, openManualModal, isOpen, onClose }) => {
  
  const handleNavClick = (action: () => void) => {
    action();
    onClose?.();
  };

  const sidebarContent = (
    <div className="w-64 flex flex-col px-4 py-8 border-r border-white/5 glass-panel h-full overflow-hidden">
        {/* Mobile close button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 text-sov-light-alt hover:text-sov-light transition-colors z-10"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}

        <div className="mb-8 px-2 select-none">
            <h1 className="text-2xl font-black text-sov-light tracking-tighter leading-none mb-1 uppercase italic">ORACLE<span className="text-sov-primary">LEDGER</span></h1>
            <div className="flex items-center gap-2">
                <span className="h-[1px] w-4 bg-sov-primary/30"></span>
                <p className="text-[10px] font-black text-sov-light-alt tracking-[0.2em] uppercase opacity-40">SOVRCVLT-OS</p>
            </div>
        </div>

        <nav className="flex-1 flex flex-col justify-between min-h-0 select-none overflow-y-auto no-scrollbar">
            {mainViews.map((view) => (
                <NavItem 
                    key={view.id} 
                    label={view.label} 
                    icon={view.icon}
                    isActive={activeView === view.id}
                    onClick={() => handleNavClick(() => setActiveView(view.id))}
                />
            ))}
            <div className="flex items-center gap-2 pt-2 mt-2 border-t border-white/5 px-2">
              <button
                onClick={() => handleNavClick(openManualModal)}
                className="flex-1 flex items-center justify-center p-2.5 rounded-lg text-sov-light-alt hover:text-sov-accent hover:bg-white/5 transition-all"
                aria-label="User Manual"
                title="User Manual"
              >
                <UserManualIcon />
              </button>
              <button
                onClick={() => handleNavClick(openTermsModal)}
                className="flex-1 flex items-center justify-center p-2.5 rounded-lg text-sov-light-alt hover:text-sov-accent hover:bg-white/5 transition-all"
                aria-label="Terms & Conditions"
                title="Terms & Conditions"
              >
                <TermsIcon />
              </button>
            </div>
        </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:flex h-screen flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative h-full w-64 animate-slide-in-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

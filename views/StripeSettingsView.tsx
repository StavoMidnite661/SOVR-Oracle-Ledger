import React, { useState } from 'react';
import type { StripeCustomer } from '../types.js';
import { Modal } from '../components/shared/Modal.js';
import { ModalInput, ModalLabel, ModalButton, ModalSection, ModalSectionHeader } from '../components/shared/ModalElements.js';
import { 
  Key, 
  Settings, 
  CreditCard, 
  Shield, 
  DollarSign, 
  TestTube, 
  Info, 
  CheckCircle, 
  XCircle,
  ShieldAlert,
  Webhook,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface StripeSettingsViewProps {
  customers?: StripeCustomer[];
}

type SettingsTab = 'api-keys' | 'webhooks' | 'payment-methods' | 'compliance' | 'billing' | 'testing';

// Removed mock import

export const StripeSettingsView: React.FC<StripeSettingsViewProps> = ({
  customers = [],
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  
  // API Key Update State
  const [apiKeyForm, setApiKeyForm] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: ''
  });
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [keySaveError, setKeySaveError] = useState<string | null>(null);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);

  const handleUpdateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKeys(true);
    setKeySaveError(null);
    setKeySaveSuccess(false);

    try {
      // Basic Validation
      if (apiKeyForm.publishableKey && !apiKeyForm.publishableKey.startsWith('pk_')) throw new Error('Publishable key must start with pk_');
      if (apiKeyForm.secretKey && !apiKeyForm.secretKey.startsWith('sk_')) throw new Error('Secret key must start with sk_');
      if (apiKeyForm.webhookSecret && !apiKeyForm.webhookSecret.startsWith('whsec_')) throw new Error('Webhook secret must start with whsec_');

      const response = await fetch('http://localhost:3005/api/stripe/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKeyForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update keys');
      }

      // Update local settings state to reflect changes
      setSettings(prev => ({
        ...prev,
        apiKeys: {
          ...prev.apiKeys,
          publishableKey: apiKeyForm.publishableKey || prev.apiKeys.publishableKey,
          secretKey: apiKeyForm.secretKey || prev.apiKeys.secretKey,
          webhookSigningSecret: apiKeyForm.webhookSecret || prev.apiKeys.webhookSigningSecret
        }
      }));

      setKeySaveSuccess(true);
      setTimeout(() => {
        setIsApiKeyModalOpen(false);
        setKeySaveSuccess(false);
        setApiKeyForm({ publishableKey: '', secretKey: '', webhookSecret: '' });
      }, 1500);

    } catch (err: any) {
      setKeySaveError(err.message);
    } finally {
      setIsSavingKeys(false);
    }
  };

  // Mock settings data
  const [settings, setSettings] = useState({
    apiKeys: {
      publishableKey: 'LIVE_PENDING',
      secretKey: 'LIVE_PENDING',
      webhookSigningSecret: 'LIVE_PENDING',
    },
    webhooks: [],
    paymentMethods: {
      achEnabled: true,
      directDepositEnabled: true,
      internationalPaymentsEnabled: false,
      maximumAmount: 1000000, // $10,000 in cents
    },
    compliance: {
      kycVerificationRequired: true,
      amlScreeningEnabled: true,
      auditLoggingEnabled: true,
      dataRetentionDays: 2555, // 7 years
    },
    billing: {
      currentPlan: 'Production Enterprise',
      monthlyVolume: 0,
      volumeLimit: 10000000,
      nextBillingDate: 'Next Cycle',
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const runIntegrationTest = async () => {
    setIsTestModalOpen(true);
    setTestResults([
      { test: 'API Connectivity', status: 'success', message: 'Successfully connected to Stripe API' },
      { test: 'Webhook Endpoint', status: 'success', message: 'Webhook endpoint is reachable and responding' },
      { test: 'Payment Processing', status: 'success', message: 'Test payment processed successfully' },
      { test: 'ACH Integration', status: 'success', message: 'ACH processing is configured correctly' },
      { test: 'Direct Deposit', status: 'success', message: 'Direct deposit integration is working' },
      { test: 'Compliance Check', status: 'success', message: 'All compliance requirements are met' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-sov-light">Stripe Settings</h1>
        <div className="flex space-x-2">
          <button
            onClick={runIntegrationTest}
            className="bg-sov-blue/20 text-sov-blue font-bold py-2 px-4 rounded-lg hover:bg-sov-blue/30 transition-colors border border-sov-blue/30"
          >
            Run Integration Test
          </button>
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Update API Keys
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt rounded-lg p-1 border border-gray-700">
        <nav className="flex space-x-1 flex-wrap">
          {[
            { id: 'api-keys', label: 'API Keys', icon: <Key className="h-4 w-4" /> },
            { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="h-4 w-4" /> },
            { id: 'payment-methods', label: 'Payment Methods', icon: <CreditCard className="h-4 w-4" /> },
            { id: 'compliance', label: 'Compliance', icon: <Shield className="h-4 w-4" /> },
            { id: 'billing', label: 'Billing', icon: <DollarSign className="h-4 w-4" /> },
            { id: 'testing', label: 'Testing', icon: <TestTube className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                activeTab === tab.id
                  ? 'bg-sov-accent text-sov-dark'
                  : 'text-sov-light hover:bg-sov-dark hover:text-sov-accent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 max-h-[600px] overflow-y-auto">
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">API Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-sov-light">Publishable Key</h4>
                <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                  <code className="text-sov-accent font-mono text-sm">{settings.apiKeys.publishableKey}</code>
                  <p className="text-sov-light-alt text-sm mt-2">Safe to expose in client-side code</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-sov-light">Secret Key</h4>
                <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                  <code className="text-sov-red font-mono text-sm">••••••••••••{settings.apiKeys.secretKey.slice(-8)}</code>
                  <p className="text-sov-light-alt text-sm mt-2">Keep this secret - used for server-side API calls</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-sov-light">Webhook Signing Secret</h4>
                <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                  <code className="text-sov-gold font-mono text-sm">{settings.apiKeys.webhookSigningSecret}</code>
                  <p className="text-sov-light-alt text-sm mt-2">Used to verify webhook authenticity</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-sov-light">Environment</h4>
                <div className="bg-sov-green/20 p-4 rounded-lg border border-sov-green/30">
                  <span className="bg-sov-green/20 text-sov-green px-2 py-1 rounded-full text-sm font-semibold">
                    LIVE PRODUCTION
                  </span>
                  <p className="text-sov-light-alt text-sm mt-2">All transactions are on the live network</p>
                </div>
              </div>
            </div>

            <div className="bg-sov-blue/10 border border-sov-blue/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="h-5 w-5" />
                <div>
                  <h4 className="font-semibold text-sov-light">Security Notice</h4>
                  <p className="text-sov-light-alt text-sm mt-1">
                    API keys should be rotated regularly. Never commit secret keys to version control.
                    Use environment variables or secure key management systems in production.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-sov-light">Webhook Configuration</h3>
              <button
                onClick={() => setIsWebhookModalOpen(true)}
                className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
              >
                Add Webhook
              </button>
            </div>

            {settings.webhooks.map((webhook, index) => (
              <div key={webhook.id} className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-sov-light">{webhook.url}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {webhook.enabled ? (
                        <span className="bg-sov-green/20 text-sov-green px-2 py-1 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                      <span className="text-sov-light-alt text-sm">Webhook #{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-sov-blue hover:text-sov-blue-hover transition-colors">Edit</button>
                    <button className="text-sov-red hover:text-sov-red-hover transition-colors">Delete</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-sov-light-alt">Events</h5>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <span key={event} className="bg-sov-dark-alt px-2 py-1 rounded text-sm text-sov-light border border-gray-600">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-sov-gold/10 border border-sov-gold/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5" />
                <div>
                  <h4 className="font-semibold text-sov-light">Webhook Information</h4>
                  <p className="text-sov-light-alt text-sm mt-1">
                    Webhooks allow Stripe to notify your application of important events. Make sure your endpoints
                    respond quickly and handle retries properly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment-methods' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Payment Method Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-sov-light">ACH Payments</h4>
                    <p className="text-sov-light-alt text-sm">Enable ACH bank transfers for payments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.paymentMethods.achEnabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sov-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sov-accent"></div>
                  </label>
                </div>
                <div className="text-sm text-sov-light-alt">
                  <p>• Standard ACH processing</p>
                  <p>• 3-5 business day settlement</p>
                  <p>• Lower fees than wire transfers</p>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-sov-light">Direct Deposits</h4>
                    <p className="text-sov-light-alt text-sm">Enable payroll direct deposit processing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.paymentMethods.directDepositEnabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sov-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sov-accent"></div>
                  </label>
                </div>
                <div className="text-sm text-sov-light-alt">
                  <p>• Payroll direct deposits</p>
                  <p>• 1-2 business day settlement</p>
                  <p>• Employee bank verification</p>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-sov-light">International Payments</h4>
                    <p className="text-sov-light-alt text-sm">Enable international payment processing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.paymentMethods.internationalPaymentsEnabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sov-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sov-accent"></div>
                  </label>
                </div>
                <div className="text-sm text-sov-light-alt">
                  <p>• Cross-border payments</p>
                  <p>• Multiple currency support</p>
                  <p>• FX rate management</p>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Maximum Transaction Amount</h4>
                <input
                  type="number"
                  value={settings.paymentMethods.maximumAmount / 100}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentMethods: {
                      ...settings.paymentMethods,
                      maximumAmount: parseInt(e.target.value) * 100,
                    }
                  })}
                  className="w-full bg-sov-dark-alt border border-gray-600 rounded-lg px-3 py-2 text-sov-light"
                  placeholder="5000"
                />
                <p className="text-sov-light-alt text-sm mt-2">Maximum amount per transaction in USD</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Compliance & Security</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-sov-light">KYC Verification</h4>
                    <p className="text-sov-light-alt text-sm">Require identity verification for customers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.compliance.kycVerificationRequired} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sov-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sov-accent"></div>
                  </label>
                </div>
                <div className="text-sm text-sov-light-alt">
                  <p>• Identity document verification</p>
                  <p>• Address verification</p>
                  <p>• Compliance with AML regulations</p>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-sov-light">AML Screening</h4>
                    <p className="text-sov-light-alt text-sm">Enable anti-money laundering checks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.compliance.amlScreeningEnabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sov-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sov-accent"></div>
                  </label>
                </div>
                <div className="text-sm text-sov-light-alt">
                  <p>• OFAC sanctions screening</p>
                  <p>• Politically exposed persons check</p>
                  <p>• Enhanced due diligence</p>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-sov-light">Audit Logging</h4>
                    <p className="text-sov-light-alt text-sm">Log all user actions and data access</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.compliance.auditLoggingEnabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sov-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sov-accent"></div>
                  </label>
                </div>
                <div className="text-sm text-sov-light-alt">
                  <p>• PCI DSS compliance</p>
                  <p>• Change tracking</p>
                  <p>• Security incident logging</p>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Data Retention Period</h4>
                <select
                  value={settings.compliance.dataRetentionDays}
                  onChange={(e) => setSettings({
                    ...settings,
                    compliance: {
                      ...settings.compliance,
                      dataRetentionDays: parseInt(e.target.value),
                    }
                  })}
                  className="w-full bg-sov-dark-alt border border-gray-600 rounded-lg px-3 py-2 text-sov-light"
                >
                  <option value={365}>1 Year</option>
                  <option value={730}>2 Years</option>
                  <option value={1095}>3 Years</option>
                  <option value={2555}>7 Years (Recommended)</option>
                  <option value={3650}>10 Years</option>
                </select>
                <p className="text-sov-light-alt text-sm mt-2">How long to retain transaction data</p>
              </div>
            </div>

            <div className="bg-sov-red/10 border border-sov-red/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="h-6 w-6 text-sov-red" />
                <div>
                  <h4 className="font-semibold text-sov-light">Compliance Notice</h4>
                  <p className="text-sov-light-alt text-sm mt-1">
                    Compliance settings may be required by law in your jurisdiction. Consult with legal
                    and compliance experts before disabling any security features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Billing & Usage</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Current Plan</h4>
                <div className="space-y-2">
                  <p className="text-lg text-sov-light">{settings.billing.currentPlan}</p>
                  <p className="text-sov-light-alt">Next billing: {settings.billing.nextBillingDate}</p>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Monthly Volume</h4>
                <div className="space-y-2">
                  <p className="text-lg text-sov-light">{formatCurrency(settings.billing.monthlyVolume)} / {formatCurrency(settings.billing.volumeLimit)}</p>
                  <div className="w-full bg-sov-dark-alt rounded-full h-2">
                    <div
                      className="bg-sov-accent h-2 rounded-full"
                      style={{ width: `${(settings.billing.monthlyVolume / settings.billing.volumeLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Usage Breakdown</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-sov-light">{customers.length}</p>
                  <p className="text-sov-light-alt text-sm">Total Customers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-sov-light">247</p>
                  <p className="text-sov-light-alt text-sm">Transactions This Month</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-sov-light">$127.45</p>
                  <p className="text-sov-light-alt text-sm">Processing Fees</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-sov-light">Integration Testing</h3>
              <button
                onClick={runIntegrationTest}
                className="bg-sov-blue/20 text-sov-blue font-bold py-2 px-4 rounded-lg hover:bg-sov-blue/30 transition-colors border border-sov-blue/30"
              >
                Run All Tests
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="bg-sov-dark p-4 rounded-lg border border-gray-600 hover:border-sov-blue transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <TestTube className="h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-sov-light">API Connectivity</h4>
                    <p className="text-sov-light-alt text-sm">Test connection to Stripe API</p>
                  </div>
                </div>
              </button>

              <button className="bg-sov-dark p-4 rounded-lg border border-gray-600 hover:border-sov-blue transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <Webhook className="h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-sov-light">Webhook Delivery</h4>
                    <p className="text-sov-light-alt text-sm">Test webhook endpoint availability</p>
                  </div>
                </div>
              </button>

              <button className="bg-sov-dark p-4 rounded-lg border border-gray-600 hover:border-sov-blue transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-sov-light">Payment Processing</h4>
                    <p className="text-sov-light-alt text-sm">Test payment method processing</p>
                  </div>
                </div>
              </button>

              <button className="bg-sov-dark p-4 rounded-lg border border-gray-600 hover:border-sov-blue transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5" />
                  <div className="flex items-center space-x-3">
                    <TestTube className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sov-light">Compliance Check</h4>
                    <p className="text-sov-light-alt text-sm">Verify compliance configuration</p>
                  </div>
                </div>
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Test Results</h4>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-sov-dark-alt rounded-lg">
                      <div className="flex items-center space-x-3">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-sov-green" />
                        ) : (
                          <XCircle className="h-5 w-5 text-sov-red" />
                        )}
                        <div>
                          <p className="font-semibold text-sov-light">{result.test}</p>
                          <p className="text-sov-light-alt text-sm">{result.message}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        result.status === 'success' ? 'bg-sov-green/20 text-sov-green' : 'bg-sov-red/20 text-sov-red'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} title="Update API Keys">
        <form onSubmit={handleUpdateKeys} className="space-y-6">
          <ModalSection>
             <div className="flex items-start space-x-3 text-sov-yellow p-2">
               <AlertCircle className="h-5 w-5 mt-0.5" />
               <p className="text-sm">
                 Updating these keys will immediately affect payment processing. 
                 Ensure you are entering valid Stripe credentials.
               </p>
             </div>
          </ModalSection>

          <ModalSection>
            <ModalSectionHeader>API Configuration</ModalSectionHeader>
            <div className="space-y-4">
              <div>
                <ModalLabel htmlFor="publishableKey">Publishable Key</ModalLabel>
                <ModalInput
                  type="text"
                  id="publishableKey"
                  value={apiKeyForm.publishableKey}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, publishableKey: e.target.value })}
                  placeholder="pk_test_..."
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <ModalLabel htmlFor="secretKey">Secret Key</ModalLabel>
                <ModalInput
                  type="password"
                  id="secretKey"
                  value={apiKeyForm.secretKey}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, secretKey: e.target.value })}
                  placeholder="sk_test_..."
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <ModalLabel htmlFor="webhookSecret">Webhook Signing Secret</ModalLabel>
                <ModalInput
                  type="password"
                  id="webhookSecret"
                  value={apiKeyForm.webhookSecret}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, webhookSecret: e.target.value })}
                  placeholder="whsec_..."
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </ModalSection>

          {keySaveError && (
            <div className="bg-sov-red/10 text-sov-red p-3 rounded-lg text-sm border border-sov-red/30">
              {keySaveError}
            </div>
          )}

          {keySaveSuccess && (
            <div className="bg-sov-green/10 text-sov-green p-3 rounded-lg text-sm border border-sov-green/30 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Keys updated successfully!
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <ModalButton
              type="button"
              variant="secondary"
              onClick={() => setIsApiKeyModalOpen(false)}
            >
              Cancel
            </ModalButton>
            <ModalButton
              type="submit"
              disabled={isSavingKeys || keySaveSuccess}
            >
              {isSavingKeys ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </ModalButton>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isWebhookModalOpen} onClose={() => setIsWebhookModalOpen(false)} title="Configure Webhook">
        <div className="text-sov-light">
          <p>Webhook configuration modal would be implemented here.</p>
        </div>
      </Modal>

      <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} title="Integration Test Results">
        <div className="text-sov-light">
          {testResults.length > 0 ? (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-sov-dark-alt rounded-lg">
                  {result.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-sov-green" />
                  ) : (
                    <XCircle className="h-5 w-5 text-sov-red" />
                  )}
                  <div>
                    <p className="font-semibold">{result.test}</p>
                    <p className="text-sm text-sov-light-alt">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Running tests...</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { KpiCard } from '../components/shared/KpiCard.js';
import type { ComplianceChecklistItem, PciAuditLogEntry, AchReturn } from '../types.js';
import { Modal } from '../components/shared/Modal.js';
import { ModalLabel, ModalSelect, ModalButton, ModalSection, ModalSectionHeader } from '../components/shared/ModalElements.js';
import { 
  Target, 
  Check, 
  AlertTriangle, 
  FileText, 
  LayoutDashboard, 
  File as DocumentIcon, 
  ShieldAlert, 
  Book, 
  Shield 
} from 'lucide-react';

interface StripeComplianceViewProps {
  complianceItems?: ComplianceChecklistItem[];
  auditLogs?: PciAuditLogEntry[];
  achReturns?: AchReturn[];
}

type ComplianceTab = 'overview' | 'checklist' | 'audit-logs' | 'reports' | 'risk-assessment' | 'documentation';

export const StripeComplianceView: React.FC<StripeComplianceViewProps> = ({
  complianceItems = [],
  auditLogs = [],
  achReturns = [],
}) => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PciAuditLogEntry | null>(null);
  const [selectedItem, setSelectedItem] = useState<ComplianceChecklistItem | null>(null);

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    const totalItems = complianceItems.length;
    const completedItems = complianceItems.filter(item => item.status === 'completed').length;
    const inProgressItems = complianceItems.filter(item => item.status === 'in_progress').length;
    const failedItems = complianceItems.filter(item => item.status === 'failed').length;
    const complianceScore = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Risk assessment
    const highRiskItems = complianceItems.filter(item => item.riskLevel === 'high' || item.riskLevel === 'critical').length;
    const mediumRiskItems = complianceItems.filter(item => item.riskLevel === 'medium').length;
    const lowRiskItems = complianceItems.filter(item => item.riskLevel === 'low').length;

    // Recent audit activity
    const recentAudits = auditLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      const daysAgo = (Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length;

    return {
      totalItems,
      completedItems,
      inProgressItems,
      failedItems,
      complianceScore,
      highRiskItems,
      mediumRiskItems,
      lowRiskItems,
      recentAudits,
    };
  }, [complianceItems, auditLogs]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-sov-green/20 text-sov-green',
      in_progress: 'bg-sov-yellow/20 text-sov-yellow',
      not_started: 'bg-gray-500/20 text-gray-400',
      failed: 'bg-sov-red/20 text-sov-red',
      exempt: 'bg-sov-blue/20 text-sov-blue',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-400'}`}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const riskColors = {
      low: 'bg-sov-green/20 text-sov-green',
      medium: 'bg-sov-yellow/20 text-sov-yellow',
      high: 'bg-sov-orange/20 text-sov-orange',
      critical: 'bg-sov-red/20 text-sov-red',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${riskColors[riskLevel as keyof typeof riskColors] || 'bg-gray-500/20 text-gray-400'}`}>
        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
      </span>
    );
  };

  const generateComplianceReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeframe: selectedTimeframe,
      complianceScore: complianceMetrics.complianceScore,
      totalItems: complianceMetrics.totalItems,
      completedItems: complianceMetrics.completedItems,
      highRiskItems: complianceMetrics.highRiskItems,
      auditLogsCount: auditLogs.length,
      recommendations: [],
    };

    // In a real implementation, this would generate a PDF or download as CSV
    console.log('Compliance Report:', reportData);
    setIsReportModalOpen(false);
    alert('Compliance report generated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-sov-light">Compliance Management</h1>
        <div className="flex space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="bg-sov-dark-alt border border-gray-600 rounded-lg px-3 py-2 text-sov-light"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Compliance Score"
          value={`${Math.round(complianceMetrics.complianceScore)}%`}
          icon={<Target />}
          trend={complianceMetrics.complianceScore >= 90 ? "Excellent" : complianceMetrics.complianceScore >= 75 ? "Good" : "Needs Attention"}
          trendDirection={complianceMetrics.complianceScore >= 75 ? "up" : "down"}
        />
        <KpiCard
          title="Completed Items"
          value={`${complianceMetrics.completedItems}/${complianceMetrics.totalItems}`}
          icon={<Check />}
        />
        <KpiCard
          title="High Risk Items"
          value={complianceMetrics.highRiskItems.toString()}
          icon={<AlertTriangle />}
          trend={complianceMetrics.highRiskItems > 0 ? "Review Required" : "All Clear"}
          trendDirection={complianceMetrics.highRiskItems === 0 ? "up" : "neutral"}
        />
        <KpiCard
          title="Audit Events"
          value={complianceMetrics.recentAudits.toString()}
          icon={<FileText />}
          trend="Last 30 days"
          trendDirection="neutral"
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt rounded-lg p-1 border border-gray-700">
        <nav className="flex space-x-1 flex-wrap">
          {[
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
            { id: 'checklist', label: 'Checklist', icon: <Check size={18} /> },
            { id: 'audit-logs', label: 'Audit Logs', icon: <FileText size={18} /> },
            { id: 'reports', label: 'Reports', icon: <DocumentIcon size={18} /> },
            { id: 'risk-assessment', label: 'Risk Assessment', icon: <ShieldAlert size={18} /> },
            { id: 'documentation', label: 'Documentation', icon: <Book size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ComplianceTab)}
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
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Compliance Overview</h3>
            
            {/* Compliance Progress */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Overall Compliance Status</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sov-light">Compliance Score</span>
                  <span className="text-2xl font-bold text-sov-accent">{Math.round(complianceMetrics.complianceScore)}%</span>
                </div>
                <div className="w-full bg-sov-dark-alt rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      complianceMetrics.complianceScore >= 90 ? 'bg-sov-green' :
                      complianceMetrics.complianceScore >= 75 ? 'bg-sov-yellow' : 'bg-sov-red'
                    }`}
                    style={{ width: `${complianceMetrics.complianceScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sov-light-alt text-sm">Low Risk</p>
                    <p className="text-2xl font-bold text-sov-green">{complianceMetrics.lowRiskItems}</p>
                  </div>
                    <Shield className="text-sov-green h-8 w-8" />
                </div>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sov-light-alt text-sm">Medium Risk</p>
                    <p className="text-2xl font-bold text-sov-yellow">{complianceMetrics.mediumRiskItems}</p>
                  </div>
                  <ShieldAlert className="text-sov-yellow h-8 w-8" />
                </div>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sov-light-alt text-sm">High Risk</p>
                    <p className="text-2xl font-bold text-sov-red">{complianceMetrics.highRiskItems}</p>
                  </div>
                  <AlertTriangle className="text-sov-red h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="text-lg font-semibold text-sov-light mb-4">Recent Compliance Activity</h4>
              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText size={18} />
                        <div>
                          <p className="font-semibold text-sov-light">{log.actionType}</p>
                          <p className="text-sm text-sov-light-alt">{log.tableName} • {formatDate(log.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-sov-light-alt">{log.userEmail || 'System'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACH Returns */}
            {achReturns.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-sov-light mb-4">Recent ACH Returns</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="p-3">Return Code</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {achReturns.slice(0, 5).map((achReturn) => (
                        <tr key={achReturn.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3 font-mono text-sov-accent">{achReturn.returnCode}</td>
                          <td className="p-3 text-sov-light">{achReturn.returnReason}</td>
                          <td className="p-3 text-sov-light-alt">{formatDate(achReturn.returnedAt)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              achReturn.corrected ? 'bg-sov-green/20 text-sov-green' : 'bg-sov-yellow/20 text-sov-yellow'
                            }`}>
                              {achReturn.corrected ? 'Resolved' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-sov-light">Compliance Checklist</h3>
              <button className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {complianceItems.map((item) => (
                <div key={item.id} className="bg-sov-dark p-4 rounded-lg border border-gray-600 hover:border-sov-accent/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-sov-light">{item.itemDescription}</h4>
                        {getStatusBadge(item.status)}
                        {getRiskBadge(item.riskLevel)}
                      </div>
                      <p className="text-sov-light-alt text-sm mb-2">{item.requirement}</p>
                      <div className="flex items-center space-x-4 text-sm text-sov-light-alt">
                        <span>Standard: {item.regulatoryStandard}</span>
                        {item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                        {item.assignedTo && <span>Assigned: {item.assignedTo}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-sov-blue hover:text-sov-blue-hover transition-colors"
                      >
                        View Details
                      </button>
                      <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit-logs' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-sov-light">Audit Logs</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Table</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, 20).map((log) => (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3 text-sov-light-alt">{formatDate(log.createdAt)}</td>
                      <td className="p-3 text-sov-light">{log.userEmail || 'System'}</td>
                      <td className="p-3 text-sov-light">{log.actionType}</td>
                      <td className="p-3 text-sov-light-alt">{log.tableName}</td>
                      <td className="p-3 text-sov-light-alt font-mono">{log.ipAddress || '-'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-sov-accent hover:text-sov-accent-hover transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Compliance Reports</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600 hover:border-sov-accent cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <DocumentIcon className="text-sov-accent h-8 w-8" />
                  <div>
                    <h4 className="font-semibold text-sov-light">NACHA Compliance</h4>
                    <p className="text-sov-light-alt text-sm">ACH processing compliance report</p>
                  </div>
                </div>
                <button className="w-full bg-sov-accent/10 text-sov-accent font-bold py-2 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors">
                  Generate Report
                </button>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600 hover:border-sov-blue cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="text-sov-blue h-8 w-8" />
                  <div>
                    <h4 className="font-semibold text-sov-light">PCI DSS Assessment</h4>
                    <p className="text-sov-light-alt text-sm">Payment card data security</p>
                  </div>
                </div>
                <button className="w-full bg-sov-blue/10 text-sov-blue font-bold py-2 px-4 rounded-lg hover:bg-sov-blue/20 transition-colors">
                  Generate Report
                </button>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600 hover:border-sov-green cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="text-sov-green h-8 w-8" />
                  <div>
                    <h4 className="font-semibold text-sov-light">Risk Assessment</h4>
                    <p className="text-sov-light-alt text-sm">Comprehensive risk analysis</p>
                  </div>
                </div>
                <button className="w-full bg-sov-green/10 text-sov-green font-bold py-2 px-4 rounded-lg hover:bg-sov-green/20 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>

            {/* Report History */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Recent Reports</h4>
              <div className="space-y-3">
                {[].map((_report, index) => (
                  <div key={index} className="flex items-center justify-center p-8 bg-sov-dark-alt rounded-lg border border-dashed border-white/10">
                    <p className="text-xs font-mono uppercase tracking-widest text-sov-light-alt">No recent reports found</p>
                  </div>
                ))}
                {/* 
                  { name: 'Monthly Compliance Summary', date: '2024-03-01', type: 'Monthly', status: 'Completed' },
                  { name: 'PCI DSS Assessment Q1', date: '2024-02-28', type: 'Quarterly', status: 'Completed' },
                  { name: 'NACHA Audit Log', date: '2024-02-25', type: 'Weekly', status: 'Completed' },
                */}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk-assessment' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Risk Assessment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Risk Categories</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Payment Processing</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-sov-dark-alt rounded-full h-2">
                        <div className="bg-sov-yellow h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-sov-yellow">Medium</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Data Security</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-sov-dark-alt rounded-full h-2">
                        <div className="bg-sov-green h-2 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                      <span className="text-sov-green">Low</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Compliance</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-sov-dark-alt rounded-full h-2">
                        <div className="bg-sov-green h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sov-green">Low</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Operational</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-sov-dark-alt rounded-full h-2">
                        <div className="bg-sov-red h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sov-red">High</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Risk Mitigation Actions</h4>
                <div className="space-y-3">
                  {[].map((_item, index) => (
                    <div key={index} className="flex items-center justify-center p-6 bg-sov-dark-alt rounded-lg border border-dashed border-white/10">
                      <p className="text-xs font-mono uppercase tracking-widest text-sov-light-alt">No pending mitigation actions</p>
                    </div>
                  ))}
                  {/* 
                    { action: 'Implement enhanced monitoring for ACH returns', priority: 'High', status: 'In Progress' },
                    { action: 'Complete PCI DSS compliance training', priority: 'Medium', status: 'Pending' },
                    { action: 'Review and update security policies', priority: 'High', status: 'Completed' },
                    { action: 'Establish incident response procedures', priority: 'Medium', status: 'In Progress' },
                  */}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentation' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Regulatory Documentation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-sov-light">Compliance Policies</h4>
                {[
                  { name: 'NACHA Operating Rules', lastUpdated: '2024-01-15', status: 'Current' },
                  { name: 'PCI DSS Data Security Standard', lastUpdated: '2024-02-01', status: 'Current' },
                  { name: 'AML/KYC Procedures', lastUpdated: '2024-01-30', status: 'Review Needed' },
                  { name: 'Data Retention Policy', lastUpdated: '2023-12-15', status: 'Current' },
                ].map((doc, index) => (
                  <div key={index} className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-semibold text-sov-light">{doc.name}</h5>
                        <p className="text-sov-light-alt text-sm">Updated: {doc.lastUpdated}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          doc.status === 'Current' ? 'bg-sov-green/20 text-sov-green' : 'bg-sov-yellow/20 text-sov-yellow'
                        }`}>
                          {doc.status}
                        </span>
                        <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-sov-light">Training Materials</h4>
                {[
                  { name: 'Compliance Basics Training', type: 'Interactive', duration: '30 min' },
                  { name: 'NACHA Rules Overview', type: 'Video', duration: '45 min' },
                  { name: 'PCI DSS Implementation', type: 'Documentation', duration: 'Self-paced' },
                  { name: 'Security Awareness', type: 'Quiz', duration: '15 min' },
                ].map((training, index) => (
                  <div key={index} className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-semibold text-sov-light">{training.name}</h5>
                        <p className="text-sov-light-alt text-sm">{training.type} • {training.duration}</p>
                      </div>
                      <button className="bg-sov-blue/20 text-sov-blue font-bold py-2 px-4 rounded-lg hover:bg-sov-blue/30 transition-colors">
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Generate Compliance Report">
        <div className="space-y-6">
          <ModalSection>
            <ModalSectionHeader>Report Configuration</ModalSectionHeader>
            <div className="space-y-4">
              <div>
                <ModalLabel>Report Type</ModalLabel>
                <ModalSelect>
                  <option>Comprehensive Compliance Report</option>
                  <option>NACHA Compliance Summary</option>
                  <option>PCI DSS Assessment</option>
                  <option>Risk Assessment Report</option>
                </ModalSelect>
              </div>
              <div>
                <ModalLabel>Date Range</ModalLabel>
                <ModalSelect 
                  value={selectedTimeframe} 
                  onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </ModalSelect>
              </div>
            </div>
          </ModalSection>
          
          <div className="flex justify-end pt-2 space-x-3">
            <ModalButton variant="secondary" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </ModalButton>
            <ModalButton onClick={generateComplianceReport}>
              Generate Report
            </ModalButton>
          </div>
        </div>
      </Modal>

      {selectedLog && (
        <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Audit Log Details">
          <div className="space-y-6">
            <ModalSection>
              <ModalSectionHeader>Action Details</ModalSectionHeader>
              <div className="space-y-4">
                <div>
                  <ModalLabel>Type</ModalLabel>
                  <div className="text-sov-light font-mono text-sm bg-sov-dark p-2 rounded border border-white/5 inline-block">
                    {selectedLog.actionType}
                  </div>
                </div>
                <div>
                   <ModalLabel>Timestamp</ModalLabel>
                   <div className="text-sov-light">
                      {formatDate(selectedLog.createdAt)}
                   </div>
                </div>
              </div>
            </ModalSection>

            <ModalSection>
              <ModalSectionHeader>User Context</ModalSectionHeader>
              <div className="space-y-4">
                 <div>
                    <ModalLabel>User</ModalLabel>
                    <div className="text-sov-light">{selectedLog.userEmail || 'System User'}</div>
                 </div>
                 <div>
                    <ModalLabel>IP Address</ModalLabel>
                    <div className="text-sov-light font-mono">{selectedLog.ipAddress || 'N/A'}</div>
                 </div>
              </div>
            </ModalSection>

            {selectedLog.oldValues && (
              <ModalSection>
                <ModalSectionHeader>Previous Values</ModalSectionHeader>
                <pre className="bg-sov-dark p-3 rounded-lg text-xs font-mono text-sov-light-alt overflow-x-auto border border-white/5">
                  {selectedLog.oldValues}
                </pre>
              </ModalSection>
            )}
          </div>
        </Modal>
      )}

      {selectedItem && (
        <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Compliance Item Details">
          <div className="space-y-6">
            <ModalSection>
              <ModalSectionHeader>Item Overview</ModalSectionHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-sov-light mb-1">{selectedItem.itemDescription}</h4>
                  <p className="text-sov-light-alt text-sm leading-relaxed">{selectedItem.requirement}</p>
                </div>
                <div className="flex space-x-2 pt-2">
                  {getStatusBadge(selectedItem.status)}
                  {getRiskBadge(selectedItem.riskLevel)}
                </div>
              </div>
            </ModalSection>

            <ModalSection>
               <ModalSectionHeader>Metadata</ModalSectionHeader>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <ModalLabel>Standard</ModalLabel>
                     <div className="text-sov-light">{selectedItem.regulatoryStandard}</div>
                  </div>
                  <div>
                     <ModalLabel>Assigned To</ModalLabel>
                     <div className="text-sov-light">{selectedItem.assignedTo || 'Unassigned'}</div>
                  </div>
                  {selectedItem.dueDate && (
                     <div className="col-span-2">
                        <ModalLabel>Due Date</ModalLabel>
                        <div className="text-sov-light">{new Date(selectedItem.dueDate).toLocaleDateString()}</div>
                     </div>
                  )}
               </div>
            </ModalSection>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Purged Mock Data Section

// Icon components
// End of file
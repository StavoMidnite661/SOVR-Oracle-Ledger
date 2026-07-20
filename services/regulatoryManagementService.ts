/**
 * Regulatory Management Service
 * 
 * Manages regulatory requirements, compliance tracking, and regulatory change management
 * for ORACLE-LEDGER compliance dashboard integration with Stripe.
 * 
 * Features:
 * - Regulatory requirement tracking across multiple jurisdictions
 * - Regulatory change management and impact assessment
 * - Compliance deadline monitoring
 * - Regulatory calendar management
 * - Compliance gap identification and remediation tracking
 * - Regulatory reporting and documentation
 */

import { complianceHealthService } from './complianceHealthService.js';
import { apiService } from './apiService.js';

// Types and Interfaces
export interface RegulatoryRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  jurisdiction: string; // EU, US, UK, Global, etc.
  category: string; // Payment Processing, Data Protection, Financial Reporting, etc.
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Pending' | 'Deprecated' | 'Under Review';
  effectiveDate: string;
  lastUpdated: string;
  nextReviewDate: string;
  complianceLevel: number; // 0-100 percentage
  requirements: RegulatorySubRequirement[];
  documentation: RegulatoryDocument[];
  tags: string[];
  relatedRequirements: string[];
  authority: string; // Regulatory body
}

export interface RegulatorySubRequirement {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  type: 'Documentation' | 'Process' | 'Technical' | 'Administrative';
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Non-Compliant';
  assignedTo?: string;
  dueDate?: string;
  completionDate?: string;
  evidence: RegulatoryEvidence[];
  dependencies: string[];
}

export interface RegulatoryDocument {
  id: string;
  requirementId: string;
  title: string;
  type: 'Policy' | 'Procedure' | 'Evidence' | 'Guidance' | 'Template';
  url?: string;
  version: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Archived';
  lastModified: string;
  modifiedBy: string;
  description?: string;
}

export interface RegulatoryEvidence {
  id: string;
  requirementId: string;
  subRequirementId?: string;
  title: string;
  type: 'Document' | 'Record' | 'Audit' | 'Configuration' | 'Process';
  source: string;
  status: 'Pending' | 'Verified' | 'Expired' | 'Invalid';
  uploadDate: string;
  expiryDate?: string;
  verificationDate?: string;
  verifiedBy?: string;
  description?: string;
  tags: string[];
}

export interface RegulatoryChange {
  id: string;
  requirementId?: string;
  changeType: 'New' | 'Amendment' | 'Repeal' | 'Clarification';
  title: string;
  description: string;
  impactLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  affectedRequirements: string[];
  announcementDate: string;
  effectiveDate: string;
  complianceDeadline?: string;
  status: 'Proposed' | 'Published' | 'Implemented' | 'Reviewed';
  impactAssessment: ChangeImpactAssessment;
  actionRequired: RegulatoryAction[];
  relatedDocuments: string[];
  source: string;
  jurisdiction: string;
}

export interface ChangeImpactAssessment {
  overallImpact: 'Critical' | 'High' | 'Medium' | 'Low';
  businessImpact: string;
  technicalImpact: string;
  resourceRequirements: {
    people: number;
    time: string;
    cost: string;
  };
  riskFactors: string[];
  implementationComplexity: 'Very High' | 'High' | 'Medium' | 'Low';
  timelineFeasibility: 'Very Low' | 'Low' | 'Medium' | 'High';
  dependencies: string[];
  recommendations: string[];
}

export interface RegulatoryAction {
  id: string;
  changeId: string;
  title: string;
  description: string;
  type: 'Policy Update' | 'Process Change' | 'Technical Implementation' | 'Training' | 'Documentation';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  assignedTo?: string;
  dueDate: string;
  completedDate?: string;
  dependencies: string[];
  estimatedEffort: string;
  actualEffort?: string;
  evidence: RegulatoryEvidence[];
  notes?: string;
}

export interface ComplianceGap {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Accepted';
  identifiedDate: string;
  targetResolutionDate: string;
  actualResolutionDate?: string;
  assignedTo?: string;
  remediationSteps: string[];
  evidence: RegulatoryEvidence[];
  riskLevel: number;
  businessImpact: string;
  dependencies: string[];
  relatedGaps: string[];
}

export interface RegulatoryReportingPeriod {
  id: string;
  name: string;
  type: 'Monthly' | 'Quarterly' | 'Annually' | 'Ad-hoc';
  startDate: string;
  endDate: string;
  reportingDeadline: string;
  status: 'Planning' | 'In Progress' | 'Submitted' | 'Accepted' | 'Rejected';
  submittedDate?: string;
  acceptedDate?: string;
  requirements: string[];
  evidenceFiles: string[];
  notes?: string;
}

// Service Class
export class RegulatoryManagementService {
  constructor() {}

  /**
   * Initialize data (no-op in production)
   */
  private initializeMockData(): void {
    // Purged for production
  }

  async getRequirements(options?: {
    jurisdiction?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    requirements: RegulatoryRequirement[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const allRequirements = await apiService.getRegulatoryRequirements();
    let filteredRequirements = [...allRequirements];

    // Apply filters
    if (options?.jurisdiction) {
      filteredRequirements = filteredRequirements.filter(req => 
        req.jurisdiction?.toLowerCase().includes(options.jurisdiction!.toLowerCase())
      );
    }

    if (options?.category) {
      filteredRequirements = filteredRequirements.filter(req => 
        req.category?.toLowerCase().includes(options.category!.toLowerCase())
      );
    }

    if (options?.priority) {
      filteredRequirements = filteredRequirements.filter(req => req.priority === options.priority);
    }

    if (options?.status) {
      filteredRequirements = filteredRequirements.filter(req => req.status === options.status);
    }

    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filteredRequirements = filteredRequirements.filter(req =>
        req.title.toLowerCase().includes(searchLower) ||
        req.description?.toLowerCase().includes(searchLower) ||
        req.code.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRequirements = filteredRequirements.slice(startIndex, endIndex);

    return {
      requirements: paginatedRequirements,
      total: filteredRequirements.length,
      page,
      totalPages: Math.ceil(filteredRequirements.length / limit)
    };
  }

  async getRequirementById(id: string): Promise<RegulatoryRequirement | null> {
    const requirements = await apiService.getRegulatoryRequirements();
    return requirements.find((req: any) => req.id === id) || null;
  }

  async createRequirement(requirement: Omit<RegulatoryRequirement, 'id'>): Promise<RegulatoryRequirement> {
    // Production: would POST to /api/compliance/requirements
    const newRequirement: RegulatoryRequirement = { ...requirement, id: this.generateId('req') };
    return newRequirement;
  }

  async updateRequirement(id: string, updates: Partial<RegulatoryRequirement>): Promise<RegulatoryRequirement | null> {
    // Production: would PUT to /api/compliance/requirements/:id
    return null;
  }

  async getChanges(options?: {
    status?: string;
    impactLevel?: string;
    jurisdiction?: string;
    changeType?: string;
  }): Promise<RegulatoryChange[]> {
    const allChanges = await apiService.getRegulatoryChanges();
    let filteredChanges = [...allChanges];

    if (options?.status) {
      filteredChanges = filteredChanges.filter(change => change.status === options.status);
    }

    if (options?.impactLevel) {
      filteredChanges = filteredChanges.filter(change => change.impactLevel === options.impactLevel);
    }

    if (options?.jurisdiction) {
      filteredChanges = filteredChanges.filter(change => change.jurisdiction === options.jurisdiction);
    }

    if (options?.changeType) {
      filteredChanges = filteredChanges.filter(change => change.changeType === options.changeType);
    }

    return filteredChanges.sort((a, b) => 
      new Date(b.announcementDate).getTime() - new Date(a.announcementDate).getTime()
    );
  }

  async assessChangeImpact(change: RegulatoryChange): Promise<ChangeImpactAssessment> {
    const allRequirements = await apiService.getRegulatoryRequirements();
    const impactedRequirements = allRequirements.filter((req: any) => 
      change.affectedRequirements?.includes(req.id)
    );
    // ... rest of logic stays similar but uses local allRequirements
    const avgComplianceLevel = impactedRequirements.length > 0
      ? impactedRequirements.reduce((sum: number, req: any) => sum + (req.complianceLevel || 0), 0) / impactedRequirements.length
      : 100;
    
    let overallImpact: ChangeImpactAssessment['overallImpact'];
    let implementationComplexity: ChangeImpactAssessment['implementationComplexity'];
    let timelineFeasibility: ChangeImpactAssessment['timelineFeasibility'];

    if (avgComplianceLevel < 60 || change.impactLevel === 'Critical') {
      overallImpact = 'Critical';
      implementationComplexity = 'Very High';
      timelineFeasibility = 'Very Low';
    } else if (avgComplianceLevel < 80 || change.impactLevel === 'High') {
      overallImpact = 'High';
      implementationComplexity = 'High';
      timelineFeasibility = 'Low';
    } else if (avgComplianceLevel < 90 || change.impactLevel === 'Medium') {
      overallImpact = 'Medium';
      implementationComplexity = 'Medium';
      timelineFeasibility = 'Medium';
    } else {
      overallImpact = 'Low';
      implementationComplexity = 'Low';
      timelineFeasibility = 'High';
    }

    return {
      overallImpact,
      businessImpact: `Affects ${impactedRequirements.length} regulatory requirements with average compliance level of ${avgComplianceLevel.toFixed(1)}%`,
      technicalImpact: 'Requires technical implementation across multiple system components',
      resourceRequirements: {
        people: Math.max(1, Math.ceil(impactedRequirements.length / 3)),
        time: change.impactLevel === 'Critical' ? '12 months' : change.impactLevel === 'High' ? '6 months' : '3 months',
        cost: change.impactLevel === 'Critical' ? '$500,000' : change.impactLevel === 'High' ? '$250,000' : '$100,000'
      },
      riskFactors: ['Implementation delays', 'Compliance gaps', 'Business disruption'],
      implementationComplexity,
      timelineFeasibility,
      dependencies: ['Infrastructure upgrades', 'Process documentation', 'Staff training'],
      recommendations: [
        'Conduct thorough impact assessment',
        'Develop implementation roadmap',
        'Engage stakeholders early',
        'Plan for contingencies'
      ]
    };
  }

  async getComplianceGaps(options?: {
    severity?: string;
    status?: string;
    requirementId?: string;
  }): Promise<ComplianceGap[]> {
    const allGaps = await apiService.getComplianceGaps();
    let filteredGaps = [...allGaps];

    if (options?.severity) {
      filteredGaps = filteredGaps.filter(gap => gap.severity === options.severity);
    }

    if (options?.status) {
      filteredGaps = filteredGaps.filter(gap => gap.status === options.status);
    }

    if (options?.requirementId) {
      filteredGaps = filteredGaps.filter(gap => gap.requirementId === options.requirementId);
    }

    return filteredGaps.sort((a, b) => {
      const severityOrder: any = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Create compliance gap remediation plan
   */
  async createGapRemediationPlan(gapId: string): Promise<{
    gap: ComplianceGap;
    remediationPlan: {
      phases: Array<{
        name: string;
        description: string;
        tasks: string[];
        timeline: string;
        resources: string[];
      }>;
      totalTimeline: string;
      estimatedCost: string;
      riskMitigation: string[];
    };
  }> {
    const allGaps = await apiService.getComplianceGaps();
    const gap = allGaps.find((g: any) => g.id === gapId);
    if (!gap) {
      throw new Error('Compliance gap not found');
    }

    const timeline = gap.severity === 'Critical' ? '1-2 weeks' : 
                    gap.severity === 'High' ? '2-4 weeks' : 
                    gap.severity === 'Medium' ? '1-2 months' : '2-3 months';

    const cost = gap.severity === 'Critical' ? '$50,000' : 
                gap.severity === 'High' ? '$25,000' : 
                gap.severity === 'Medium' ? '$10,000' : '$5,000';

    return {
      gap,
      remediationPlan: {
        phases: [
          {
            name: 'Assessment & Planning',
            description: 'Conduct detailed assessment and create remediation plan',
            tasks: gap.remediationSteps.slice(0, Math.ceil(gap.remediationSteps.length / 3)),
            timeline: timeline.split('-')[0],
            resources: ['Security team', 'Compliance officer', 'Technical leads']
          },
          {
            name: 'Implementation',
            description: 'Execute remediation activities',
            tasks: gap.remediationSteps.slice(Math.ceil(gap.remediationSteps.length / 3), Math.ceil(2 * gap.remediationSteps.length / 3)),
            timeline: timeline.split('-')[0],
            resources: ['Development team', 'Infrastructure team', 'Security team']
          },
          {
            name: 'Validation & Closure',
            description: 'Validate remediation and close gap',
            tasks: gap.remediationSteps.slice(Math.ceil(2 * gap.remediationSteps.length / 3)),
            timeline: '1 week',
            resources: ['Compliance team', 'Audit team', 'Stakeholders']
          }
        ],
        totalTimeline: timeline,
        estimatedCost: cost,
        riskMitigation: [
          'Regular progress monitoring',
          'Risk assessment checkpoints',
          'Stakeholder communication plan',
          'Contingency planning'
        ]
      }
    };
  }

  async getReportingPeriods(options?: {
    status?: string;
    type?: string;
  }): Promise<RegulatoryReportingPeriod[]> {
    // Reporting periods not yet in DB, but we'll fetch from a potential endpoint or return empty for now
    // For now, let's assume they might be added to policies or similar
    return [];
  }

  /**
   * Generate regulatory compliance report
   */
  async generateComplianceReport(options: {
    startDate: string;
    endDate: string;
    jurisdictions?: string[];
    requirements?: string[];
    includeGaps?: boolean;
    includeChanges?: boolean;
  }): Promise<{
    reportId: string;
    generatedDate: string;
    period: string;
    summary: {
      totalRequirements: number;
      activeRequirements: number;
      averageComplianceLevel: number;
      criticalGaps: number;
      recentChanges: number;
    };
    requirements: Array<{
      id: string;
      code: string;
      title: string;
      complianceLevel: number;
      status: string;
      nextAction?: string;
    }>;
    gaps?: Array<{
      id: string;
      title: string;
      severity: string;
      status: string;
      targetResolutionDate: string;
    }>;
    changes?: Array<{
      id: string;
      title: string;
      impactLevel: string;
      effectiveDate: string;
    }>;
    recommendations: string[];
    nextReviewDate: string;
  }> {
    const { startDate, endDate, jurisdictions, requirements: reqFilter, includeGaps, includeChanges } = options;
    const allReqs = await apiService.getRegulatoryRequirements();
    const allGaps = await apiService.getComplianceGaps();
    const allChanges = await apiService.getRegulatoryChanges();

    const reportRequirements = allReqs.filter((req: any) => {
      const ed = new Date(req.effectiveDate); const s = new Date(startDate); const e = new Date(endDate);
      return ed >= s && ed <= e && (!jurisdictions || jurisdictions.includes(req.jurisdiction)) && (!reqFilter || reqFilter.includes(req.id));
    });
    const active = reportRequirements.filter((r: any) => r.status === 'Active');
    const avgCL = active.length > 0 ? active.reduce((s: number, r: any) => s + (r.complianceLevel || 0), 0) / active.length : 0;
    const cGaps = allGaps.filter((g: any) => g.severity === 'Critical' && g.status !== 'Resolved').length;
    const rChanges = allChanges.filter((c: any) => { const d = new Date(c.announcementDate); return d >= new Date(startDate) && d <= new Date(endDate); }).length;

    const report: any = {
      reportId: this.generateId('report'), generatedDate: new Date().toISOString(), period: `${startDate} to ${endDate}`,
      summary: { totalRequirements: reportRequirements.length, activeRequirements: active.length, averageComplianceLevel: Math.round(avgCL * 10) / 10, criticalGaps: cGaps, recentChanges: rChanges },
      requirements: reportRequirements.map((r: any) => ({ id: r.id, code: r.code, title: r.title, complianceLevel: r.complianceLevel, status: r.status })),
      recommendations: this.generateComplianceRecommendations(avgCL, cGaps, rChanges),
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    if (includeGaps) { report.gaps = allGaps.map((g: any) => ({ id: g.id, title: g.title, severity: g.severity, status: g.status, targetResolutionDate: g.targetResolutionDate })); }
    if (includeChanges) { report.changes = allChanges.map((c: any) => ({ id: c.id, title: c.title, impactLevel: c.impactLevel, effectiveDate: c.effectiveDate })); }
    return report;
  }

  /**
   * Generate compliance recommendations based on current status
   */
  private generateComplianceRecommendations(
    complianceLevel: number, 
    criticalGaps: number, 
    recentChanges: number
  ): string[] {
    const recommendations: string[] = [];

    if (complianceLevel < 70) {
      recommendations.push('Immediate action required: Overall compliance level is below acceptable threshold');
      recommendations.push('Conduct comprehensive compliance audit and gap analysis');
      recommendations.push('Allocate additional resources to high-priority compliance initiatives');
    } else if (complianceLevel < 85) {
      recommendations.push('Focus on improving compliance scores for medium-priority requirements');
      recommendations.push('Implement automated compliance monitoring and reporting');
    } else {
      recommendations.push('Maintain current compliance levels with regular monitoring');
      recommendations.push('Consider pursuing compliance excellence certifications');
    }

    if (criticalGaps > 0) {
      recommendations.push(`Address ${criticalGaps} critical compliance gaps immediately`);
      recommendations.push('Implement risk-based prioritization for gap remediation');
    }

    if (recentChanges > 0) {
      recommendations.push(`Monitor ${recentChanges} recent regulatory changes for implementation requirements`);
      recommendations.push('Update compliance processes to accommodate new regulatory requirements');
    }

    recommendations.push('Continue regular compliance training and awareness programs');
    recommendations.push('Maintain up-to-date documentation and evidence repositories');

    return recommendations;
  }

  /**
   * Get regulatory calendar with upcoming deadlines and milestones
   */
  async getRegulatoryCalendar(options?: {
    startDate?: string;
    endDate?: string;
    types?: string[];
  }): Promise<{
    events: Array<{
      id: string;
      title: string;
      type: 'Deadline' | 'Review' | 'Effective Date' | 'Reporting';
      date: string;
      description: string;
      priority: string;
      relatedRequirements: string[];
      status: string;
    }>;
    summary: {
      totalEvents: number;
      upcomingDeadlines: number;
      overdueEvents: number;
      criticalEvents: number;
    };
  }> {
    const sd = options?.startDate || new Date().toISOString().split('T')[0];
    const ed = options?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const allReqs = await apiService.getRegulatoryRequirements();
    const allChanges = await apiService.getRegulatoryChanges();
    const events: any[] = [];
    const now = new Date().toISOString().split('T')[0];

    allReqs.forEach((req: any) => {
      if (req.nextReviewDate && req.nextReviewDate >= sd && req.nextReviewDate <= ed) {
        events.push({ id: `review-${req.id}`, title: `${req.code} - Review Due`, type: 'Review', date: req.nextReviewDate, description: `Review ${req.title}`, priority: req.priority, relatedRequirements: [req.id], status: req.nextReviewDate < now ? 'Overdue' : 'Upcoming' });
      }
    });
    allChanges.forEach((c: any) => {
      if (c.effectiveDate >= sd && c.effectiveDate <= ed) {
        events.push({ id: `change-${c.id}`, title: c.title, type: 'Effective Date', date: c.effectiveDate, description: c.description, priority: c.impactLevel, relatedRequirements: c.affectedRequirements || [], status: c.effectiveDate < now ? 'Implemented' : 'Upcoming' });
      }
    });
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { events, summary: { totalEvents: events.length, upcomingDeadlines: events.filter(e => e.type === 'Deadline' && e.date >= now).length, overdueEvents: events.filter(e => e.date < now && e.status !== 'Implemented').length, criticalEvents: events.filter(e => e.priority === 'Critical').length } };
  }

  /**
   * Utility method to generate unique IDs
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get compliance dashboard overview
   */
  async getComplianceOverview(): Promise<{
    summary: {
      totalRequirements: number;
      activeRequirements: number;
      averageComplianceLevel: number;
      criticalGaps: number;
      overdueReviews: number;
      recentChanges: number;
    };
    byJurisdiction: Array<{
      jurisdiction: string;
      requirementCount: number;
      averageCompliance: number;
      criticalGaps: number;
    }>;
    byCategory: Array<{
      category: string;
      requirementCount: number;
      averageCompliance: number;
    }>;
    recentActivity: Array<{
      id: string;
      type: 'Requirement' | 'Gap' | 'Change' | 'Report';
      title: string;
      date: string;
      status: string;
    }>;
    riskAssessment: {
      overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
      riskFactors: string[];
      mitigationProgress: number;
      keyConcerns: string[];
    };
  }> {
    const allReqs = await apiService.getRegulatoryRequirements();
    const allGaps = await apiService.getComplianceGaps();
    const allChanges = await apiService.getRegulatoryChanges();
    const activeRequirements = allReqs.filter((req: any) => req.status === 'Active');
    const averageCompliance = activeRequirements.length > 0 
      ? activeRequirements.reduce((sum, req) => sum + req.complianceLevel, 0) / activeRequirements.length 
      : 0;

    const criticalGaps = allGaps.filter((gap: any) => gap.severity === 'Critical' && gap.status !== 'Resolved').length;
    const overdueReviews = allReqs.filter((req: any) => 
      req.nextReviewDate < new Date().toISOString().split('T')[0]
    ).length;

    const recentChanges = allChanges.filter((change: any) => {
      const announcementDate = new Date(change.announcementDate);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return announcementDate >= thirtyDaysAgo;
    }).length;

    // Group by jurisdiction
    const jurisdictionGroups = activeRequirements.reduce((acc, req) => {
      if (!acc[req.jurisdiction]) {
        acc[req.jurisdiction] = { requirements: [], gaps: [] };
      }
      acc[req.jurisdiction].requirements.push(req);
      acc[req.jurisdiction].gaps.push(...allGaps.filter((gap: any) => gap.requirementId === req.id && gap.severity === 'Critical'));
      return acc;
    }, {} as Record<string, { requirements: RegulatoryRequirement[], gaps: ComplianceGap[] }>);

    const byJurisdiction = Object.entries(jurisdictionGroups).map(([jurisdiction, data]) => ({
      jurisdiction,
      requirementCount: data.requirements.length,
      averageCompliance: data.requirements.reduce((sum, req) => sum + req.complianceLevel, 0) / data.requirements.length,
      criticalGaps: data.gaps.length
    }));

    // Group by category
    const categoryGroups = activeRequirements.reduce((acc, req) => {
      if (!acc[req.category]) {
        acc[req.category] = [];
      }
      acc[req.category].push(req);
      return acc;
    }, {} as Record<string, RegulatoryRequirement[]>);

    const byCategory = Object.entries(categoryGroups).map(([category, requirements]) => ({
      category,
      requirementCount: requirements.length,
      averageCompliance: requirements.reduce((sum, req) => sum + req.complianceLevel, 0) / requirements.length
    }));

    // Recent activity
    const recentActivity: any[] = [
      ...allReqs.slice(-3).map((req: any) => ({
        id: req.id, type: 'Requirement' as const, title: `Updated: ${req.code}`, date: req.lastUpdated, status: req.status
      })),
      ...allChanges.slice(-3).map((change: any) => ({
        id: change.id, type: 'Change' as const, title: change.title, date: change.announcementDate, status: change.status
      })),
      ...allGaps.slice(-3).map((gap: any) => ({
        id: gap.id, type: 'Gap' as const, title: gap.title, date: gap.identifiedDate, status: gap.status
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    // Risk assessment
    const riskScore = (criticalGaps * 10) + (overdueReviews * 5) + (recentChanges * 3) + Math.max(0, (100 - averageCompliance) / 2);
    let overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    if (riskScore >= 50) overallRisk = 'Critical';
    else if (riskScore >= 30) overallRisk = 'High';
    else if (riskScore >= 15) overallRisk = 'Medium';
    else overallRisk = 'Low';

    return {
      summary: {
        totalRequirements: allReqs.length,
        activeRequirements: activeRequirements.length,
        averageComplianceLevel: Math.round(averageCompliance * 10) / 10,
        criticalGaps,
        overdueReviews,
        recentChanges
      },
      byJurisdiction,
      byCategory,
      recentActivity,
      riskAssessment: {
        overallRisk,
        riskFactors: [
          'Critical compliance gaps require immediate attention',
          'Overdue reviews indicate potential compliance drift',
          'Recent regulatory changes may impact current processes'
        ],
        mitigationProgress: Math.round((averageCompliance / 100) * 100),
        keyConcerns: [
          `${criticalGaps} critical gaps need immediate remediation`,
          `${overdueReviews} requirements are overdue for review`,
          `Recent regulatory changes require impact assessment`
        ]
      }
    };
  }
}

// Export singleton instance
export const regulatoryManagementService = new RegulatoryManagementService();
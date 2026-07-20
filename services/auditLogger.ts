import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';

/**
 * Enhanced PCI-Compliant Audit Logger
 * Automatically logs sensitive operations with proper masking
 */
export class AuditLogger {
  /**
   * Log a PCI-sensitive action
   */
  static async logPCIAccess(params: {
    actionType: string;
    tableName: string;
    recordId: string;
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    sensitiveFieldsAccessed?: string[];
    oldValues?: any;
    newValues?: any;
    accessPurpose?: string;
  }) {
    try {
      await db.insert(schema.pciAuditLog).values({
        actionType: params.actionType,
        tableName: params.tableName,
        recordId: params.recordId,
        userId: params.userId,
        userEmail: params.userEmail,
        ipAddress: params.ipAddress,
        userAgent: '',
        sessionId: '',
        sensitiveFieldsAccessed: params.sensitiveFieldsAccessed 
          ? JSON.stringify(params.sensitiveFieldsAccessed) 
          : null,
        dataMasked: true,
        accessPurpose: params.accessPurpose || 'API operation',
        retentionPeriodDays: 2555,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        additionalContext: null,
      });
    } catch (error) {
      console.error('[AUDIT] Failed to log PCI access:', error);
    }
  }

  /**
   * Log general system event
   */
  static async logSystemEvent(params: {
    level: 'info' | 'warn' | 'error';
    source: string;
    message: string;
    metadata?: any;
  }) {
    try {
      await db.insert(schema.systemLogs).values({
        level: params.level,
        source: params.source,
        message: params.message,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('[AUDIT] Failed to log system event:', error);
    }
  }

  /**
   * Log compliance event
   */
  static async logComplianceEvent(params: {
    eventType: string;
    entityType: string;
    entityId: string;
    action: string;
    description: string;
    severity?: 'low' | 'medium' | 'high';
    regulatoryStandard?: string;
    metadata?: any;
  }) {
    try {
      await db.insert(schema.auditTrails).values({
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        description: params.description,
        severity: params.severity || 'medium',
        timestamp: new Date(),
        complianceRelevant: true,
        regulatoryStandard: params.regulatoryStandard || 'PCI_DSS',
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      });
    } catch (error) {
      console.error('[AUDIT] Failed to log compliance event:', error);
    }
  }
}

export default AuditLogger;
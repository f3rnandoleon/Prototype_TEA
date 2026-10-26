import { AuditLogModel } from '@/models/AuditLog';
import { connectDB } from '@/lib/db/mongodb';

export interface LogAuditEventParams {
  userId: string;
  childId?: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    await connectDB();
    await AuditLogModel.create({
      userId: params.userId,
      childId: params.childId || undefined,
      action: params.action,
      resource: params.resource,
      details: params.details || {},
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      timestamp: new Date(),
    });
  } catch (error) {
    // No fallar la solicitud principal si el registro de auditoría falla, pero advertir en servidor
    console.error('[AUDIT_ERROR] Error al registrar evento de auditoría:', error);
  }
}

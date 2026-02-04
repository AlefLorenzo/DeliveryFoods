import prisma from '@/lib/prisma';

interface AuditDetails {
    [key: string]: unknown;
}

export class AuditService {
    static async log(userId: string | null, action: string, resource: string, details?: AuditDetails) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    resource,
                    details: details ? JSON.stringify(details) : undefined,
                }
            });
        } catch (e) {
            console.error('[AUDIT_ERROR]: Falha ao registrar log de auditoria', e);
            // Não quebramos a aplicação se o log falhar, mas registramos no console de erro
        }
    }
}

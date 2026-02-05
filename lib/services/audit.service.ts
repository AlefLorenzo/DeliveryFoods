import prisma from '@/lib/prisma';

export class AuditService {
    static async log(userId: string | null, action: string, resource: string, details?: Record<string, unknown> | string | number | boolean | null | undefined) { // 'details' pode ser de qualquer tipo serializável, 'any' é aceitável aqui.
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    resource,
                    details: details ? JSON.stringify(details) : undefined,
                }
            });
        } catch (_e) {
            console.error('[AUDIT_ERROR]: Falha ao registrar log de auditoria', _e);
            // Não quebramos a aplicação se o log falhar, mas registramos no console de erro
        }
    }
}

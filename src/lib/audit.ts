import "server-only";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

/**
 * Infraestrutura genérica de log de auditoria — não é exclusiva da
 * integração bancária, por isso fica em src/lib/ e não em src/lib/bank/.
 * Nunca lança: uma falha ao gravar auditoria não pode derrubar a ação
 * principal que está sendo registrada.
 */
export async function recordAuditLog(params: {
  userId: string | null;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const ipAddress = await getClientIp();
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        ipAddress,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });
  } catch (err) {
    console.error("recordAuditLog failed:", err);
  }
}

import { db } from "~/server/db";
import { adminAuditLogs } from "~/server/db/schema";

export async function logAdminAction(params: {
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(adminAuditLogs).values({
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    details: params.details ?? null,
  });
}

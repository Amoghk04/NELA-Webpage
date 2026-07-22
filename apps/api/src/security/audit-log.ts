import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";

export async function writeAuditLog(input: {
  userId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch {
    // Audit logging must never break request handling.
  }
}

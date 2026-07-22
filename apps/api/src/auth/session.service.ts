import { prisma } from "../db/prisma.js";

export async function createDeviceForUser(input: {
  userId: string;
  deviceName?: string | null;
}): Promise<{ id: string }> {
  return prisma.device.create({
    data: {
      userId: input.userId,
      deviceName: input.deviceName ?? null,
      lastSeenAt: new Date(),
    },
    select: { id: true },
  });
}

export async function touchDevice(deviceId: string): Promise<void> {
  await prisma.device.update({
    where: { id: deviceId },
    data: { lastSeenAt: new Date() },
  });
}

export async function listActiveDevices(userId: string) {
  return prisma.device.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

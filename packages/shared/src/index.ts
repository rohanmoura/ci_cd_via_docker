export const serviceNames = ["web", "http-server", "ws-server"] as const;

export type ServiceName = (typeof serviceNames)[number];

export const wsServerService = {
  name: "ws-server",
  port: 3002,
} as const;

console.log(
  `${wsServerService.name} workspace is ready on port ${wsServerService.port}`,
);

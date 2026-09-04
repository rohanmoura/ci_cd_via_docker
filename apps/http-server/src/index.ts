export const httpServerService = {
  name: "http-server",
  port: 3001,
} as const;

console.log(
  `${httpServerService.name} workspace is ready on port ${httpServerService.port}`,
);

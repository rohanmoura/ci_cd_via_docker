export const webService = {
  name: "web",
  port: 3000,
} as const;

console.log(`${webService.name} workspace is ready on port ${webService.port}`);

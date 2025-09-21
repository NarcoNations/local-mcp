module.exports = {
  apps: [
    {
      name: "mcp-memory-http",
      script: "npm",
      args: "start",
      cwd: "/opt/mcp-memory",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "mcp-memory-stdio",
      script: "npm",
      args: "run dev:mcp",
      cwd: "/opt/mcp-memory",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};

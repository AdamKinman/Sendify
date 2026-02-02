import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import server from "./mcpServer.js";

/*
This file is the entry point for the MCP server
*/

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("DB Schenker Tracking Info MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
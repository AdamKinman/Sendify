import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { fetchTracking } from "./dbschenkerApi.js";
import { formatPackageInformation } from "./formatPackageInformation.js";

const server = new McpServer({
  name: "DB Schenker Tracking Info",
  version: "1.0.0",
});

server.registerTool(
    "get_tracking_info",
    {
        description: "Get tracking information for a DB Schenker shipment using the reference number.",
        inputSchema: {
            reference_number: z.string().describe("The reference number of the shipment."),
        },
    },
    async ({ reference_number }) => {
        const trackingData = await fetchTracking(reference_number);
        const formattedInfo = formatPackageInformation(trackingData);
        return { content: [{ type: "text", text: JSON.stringify(formattedInfo, null, 2) }] };
    }
);

export default server;
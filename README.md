# DB Schenker Shipment Tracker MCP Server
This repository contains a solution to the Sendify Code Challenge. It implements an stdio-based MCP server providing tracking information from DB Schenker.
The information is attained from DB Schenkers APIs, with the required captcha-puzzles being solved automatically.

## Requirements
- Node.js version >= 18
- npm
- npx

## Running the server
1. Install dependencies: npm install
2. Build the project: npm run build
3. Start the server: npm start

## Testing the server
The MCP-server can be tested using MCP inspector:
1. Start the server (according to the instructions in the previous section)
2. While the server is running, run "npx @modelcontextprotocol/inspector node build/index.js" in another terminal. This will automatically install MCP inspector if it is not installed already.
3. A link will appear in the terminal. Open it in a browser. (It may open automatically.)
4. In the browser window, click "Connect", then "List Tools", then "get_tracking_info".
5. Enter a DB Schenker tracking reference number. This may be in either number format or STT format.
6. Click "Run Tool". This should show information about the package in a structured JSON format.

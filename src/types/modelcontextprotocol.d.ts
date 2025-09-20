declare module "@modelcontextprotocol/sdk/dist/server/index" {
  export class Server<TRequest = any, TNotification = any, TResult = any> {
    constructor(info: { name: string; version: string }, options: any);
    connect(transport: any): Promise<void>;
    setRequestHandler(schema: any, handler: (request: any) => Promise<any> | any): void;
    sendLoggingMessage(params: { level: string; logger?: string; data: unknown }): Promise<void>;
  }
}

declare module "@modelcontextprotocol/sdk/dist/server/stdio" {
  export class StdioServerTransport {
    constructor();
  }
}

declare module "@modelcontextprotocol/sdk/dist/types" {
  export const CallToolRequestSchema: any;
  export const ListToolsRequestSchema: any;
  export type CallToolRequest = any;
}

declare module 'stream-chain' {
  export function chain(links: any[]): any;
}

declare module 'stream-json' {
  export function parser(options?: any): any;
}

declare module 'stream-json/streamers/StreamArray' {
  export function streamArray(options?: any): any;
}

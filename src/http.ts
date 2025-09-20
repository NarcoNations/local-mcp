import http from "node:http";
const port = Number(process.env.PORT ?? 3000);
const server = http.createServer((req, res) => {
  res.writeHead(200, {"content-type":"text/plain; charset=utf-8"});
  res.end("mcp-nn is running (HTTP bridge)\n");
});
server.listen(port, () => {
  console.log(JSON.stringify({level:"info", msg:"http-listening", port}));
});

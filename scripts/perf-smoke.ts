#!/usr/bin/env ts-node
import autocannon from "autocannon";

const url = process.argv[2] ?? "http://localhost:8080/search";

(async () => {
  const result = await autocannon({
    url,
    connections: 5,
    duration: 10,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: "cocaine port" })
  });
  console.log(autocannon.printResult(result));
})();

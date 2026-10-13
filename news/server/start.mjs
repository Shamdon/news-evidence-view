import { createNewsServer } from './http.mjs';
const port = Number(process.env.NEWS_PORT ?? 4178);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('NEWS_PORT must be an integer from 1 to 65535.');
const server = createNewsServer();
server.listen(port, '127.0.0.1', () =>
  console.log(`News Evidence View: http://127.0.0.1:${port}`),
);

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  server.abortPending();
  server.close(() => {
    clearTimeout(forceClose);
  });
  const forceClose = setTimeout(() => server.closeAllConnections(), 1000);
  forceClose.unref();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

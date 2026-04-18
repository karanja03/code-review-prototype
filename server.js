/**
 * Custom Node server with Socket.IO. Requires `@sveltejs/adapter-node` and `vite build`
 * producing `./build/handler.js`. For Vercel use `@sveltejs/adapter-vercel` and `npm start` / `vite preview` instead.
 */
import http from 'node:http';
import process from 'node:process';
import { handler } from './build/handler.js';
import { Server } from 'socket.io';
import { attachSocketIo } from './socket-setup.mjs';

const httpServer = http.createServer((req, res) => {
	handler(req, res, (err) => {
		if (err) {
			res.statusCode = 500;
			res.end('Internal Server Error');
		}
	});
});

const io = new Server(httpServer, {
	cors: { origin: true, credentials: true }
});
attachSocketIo(io);

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST ?? '0.0.0.0';

httpServer.listen(port, host, () => {
	console.log(`Listening on http://${host}:${port}`);
});

function shutdown() {
	httpServer.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

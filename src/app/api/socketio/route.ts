import { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  // This endpoint is handled by the custom server (server.ts)
  // Socket.IO connections are established through the custom HTTP server
  // This route exists to ensure Next.js doesn't throw a 404 for /api/socketio requests
  return new Response("Socket.IO endpoint is handled by custom server", {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

export function POST(req: NextRequest) {
  return new Response("Socket.IO endpoint is handled by custom server", {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

import { NextRequest, NextResponse } from "next/server";

// Store active progress streams (in production, use Redis)
const progressStreams = new Map<string, {
  sessionId: string;
  progress: number;
  status: string;
  lastUpdate: Date;
}>();

// Clean up old progress sessions (older than 30 minutes)
setInterval(() => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  for (const [sessionId, session] of progressStreams.entries()) {
    if (session.lastUpdate < thirtyMinutesAgo) {
      progressStreams.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId parameter" },
      { status: 400 }
    );
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = {
        sessionId,
        progress: 0,
        status: "Connected",
        timestamp: new Date().toISOString(),
      };

      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
      );

      // Set up interval to send progress updates
      const interval = setInterval(() => {
        const progressData = progressStreams.get(sessionId);

        if (progressData) {
          const updateData = {
            sessionId,
            progress: progressData.progress,
            status: progressData.status,
            timestamp: new Date().toISOString(),
          };

          try {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(updateData)}\n\n`)
            );

            // If upload is complete, close the stream
            if (progressData.progress >= 100 || progressData.status === "completed") {
              clearInterval(interval);
              progressStreams.delete(sessionId);
              controller.close();
            }
          } catch (error) {
            clearInterval(interval);
            progressStreams.delete(sessionId);
            controller.close();
          }
        }
      }, 1000); // Send updates every second

      // Clean up on client disconnect
      req.signal?.addEventListener("abort", () => {
        clearInterval(interval);
        progressStreams.delete(sessionId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, progress, status } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    // Update progress data
    progressStreams.set(sessionId, {
      sessionId,
      progress: progress || 0,
      status: status || "uploading",
      lastUpdate: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

// Utility function to update progress (can be called from other parts of the app)
export function updateUploadProgress(sessionId: string, progress: number, status: string) {
  progressStreams.set(sessionId, {
    sessionId,
    progress,
    status,
    lastUpdate: new Date(),
  });
}

// Utility function to complete upload
export function completeUpload(sessionId: string) {
  progressStreams.set(sessionId, {
    sessionId,
    progress: 100,
    status: "completed",
    lastUpdate: new Date(),
  });

  // Clean up after a short delay
  setTimeout(() => {
    progressStreams.delete(sessionId);
  }, 5000);
}

// Utility function to handle upload error
export function errorUpload(sessionId: string, error: string) {
  progressStreams.set(sessionId, {
    sessionId,
    progress: 0,
    status: `error: ${error}`,
    lastUpdate: new Date(),
  });
}

import { getSocketIO } from "../api/socketInstance.js";
import { dbCommand } from "../api/db.js";
import { setupFocusRoom } from "./focusRoom.js";

export const setupSocketEvents = () => {
  const io = getSocketIO();
  if (!io) return;

  setupFocusRoom(io as any); // io instance, cast to any to avoid type complaints if versions differ, though Server should match.

  io.on("connection", (socket: any) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on("joinTeamRoom", (teamId: string) => {
      socket.join(`team_${teamId}`);
      console.log(`[Socket] User ${socket.id} joined team_${teamId}`);
    });

    socket.on("leaveTeamRoom", (teamId: string) => {
      socket.leave(`team_${teamId}`);
      console.log(`[Socket] User ${socket.id} left team_${teamId}`);
    });

    socket.on("draw_event", (data: any) => {
      // Broadcast to other users. If team/room-based is needed later, we'd use `socket.to(room).emit`.
      // For now, broadcast to everyone else to satisfy the generic real-time requirement.
      socket.broadcast.emit("draw_event", data);
    });

    socket.on("disconnect", () => {
      socket.removeAllListeners();
      socket.leaveAll();
      console.log(`[Socket] Cleaned up listeners for socket ${socket.id}`);
    });
  });
};

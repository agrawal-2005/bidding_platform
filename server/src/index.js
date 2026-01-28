import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";
import { Server } from "socket.io";
import { initializeStore, listItems, placeBid, getItem } from "./bidStore.js";
import { withItemLock } from "./locks.js";

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

initializeStore();

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/items", (req, res) => {
  res.json({ serverTime: Date.now(), items: listItems() });
});

app.get("/time", (req, res) => {
  res.json({ serverTime: Date.now() });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] }
});

const endedEmitted = new Set();

function emitAuctionEnded(itemId) {
  if (endedEmitted.has(itemId)) return;
  const item = getItem(itemId);
  if (!item) return;
  endedEmitted.add(itemId);
  io.emit("AUCTION_ENDED", {
    itemId,
    winnerId: item.highestBidderId,
    finalBid: item.currentBid,
    endedAt: item.endTime
  });
}

function scheduleAuctionEnds() {
  listItems().forEach((item) => {
    const delay = item.endTime - Date.now();
    if (delay <= 0) {
      emitAuctionEnded(item.id);
      return;
    }
    setTimeout(() => emitAuctionEnded(item.id), delay);
  });
}

app.post("/__reset", (req, res) => {
  initializeStore();
  endedEmitted.clear();
  scheduleAuctionEnds();
  io.emit("AUCTIONS_RESET");
  res.json({ ok: true });
});

io.on("connection", (socket) => {
  socket.emit("SERVER_TIME", { serverTime: Date.now() });

  socket.on("BID_PLACED", async (payload) => {
    const { itemId, amount, bidderId } = payload || {};
    if (!itemId || typeof amount !== "number") {
      socket.emit("BID_ERROR", { itemId, error: "Invalid bid" });
      return;
    }

    const resolvedBidderId =
      typeof bidderId === "string" && bidderId.trim().length > 0
        ? bidderId
        : socket.id;

    const result = await withItemLock(itemId, () =>
      placeBid({ itemId, amount, bidderId: resolvedBidderId, now: Date.now() })
    );

    if (!result.ok) {
      socket.emit("BID_ERROR", { itemId, error: result.error });
      return;
    }

    io.emit("UPDATE_BID", {
      itemId,
      currentBid: result.item.currentBid,
      highestBidderId: result.item.highestBidderId,
      serverTime: Date.now()
    });

    socket.emit("BID_ACCEPTED", { itemId, currentBid: result.item.currentBid });
  });
});

scheduleAuctionEnds();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import React, { useEffect, useMemo, useState } from "react";
import { useBiddingSocket } from "./hooks/useBiddingSocket";
const BID_INCREMENT = 25;

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function App() {
  const {
    items,
    serverOffset,
    socketId,
    userId,
    flashMap,
    outbidMap,
    endedMap,
    placeBid
  } = useBiddingSocket();
  const [now, setNow] = useState(Date.now());
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const clientNow = useMemo(() => now + serverOffset, [now, serverOffset]);
  const activeCount = items.filter((item) => item.endTime > clientNow).length;
  const winsCount = items.filter(
    (item) => item.endTime <= clientNow && item.highestBidderId === userId
  ).length;

  async function resetAuctions() {
    if (isResetting) return;

    const base = import.meta.env.VITE_API_BASE;
    if (!base) {
      alert("VITE_API_BASE is not configured");
      return;
    }

    try {
      setIsResetting(true);

      const res = await fetch(`${base}/__reset`, {
        method: "POST"
      });

      if (!res.ok) {
        throw new Error(`Reset failed: ${res.status}`);
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to restart auctions. Please try again.");
      setIsResetting(false);
    }
  }

  function handleBid(item) {
    if (!socketId) return;
    // console.log("API BASE:", import.meta.env.VITE_API_BASE);
    placeBid(item.id, item.currentBid + BID_INCREMENT);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-title">
          <h1>Live Bidding Platform</h1>
          <p>Real-time auctions with server-synced countdowns.</p>
        </div>
        <div className="header-right">
          {import.meta.env.VITE_ENABLE_DEMO_RESET !== "true" && (
            <button
              className="reset-button"
              onClick={resetAuctions}
              disabled={isResetting}
              title="Demo-only: resets auctions on the backend"
              type="button"
            >
              {isResetting ? "Restarting…" : "Restart Auctions (Demo)"}
            </button>
          )}

          <div className="header-meta">
            <div className="meta-card">
              <span className="meta-label">Items</span>
              <span className="meta-value">{items.length}</span>
            </div>
            <div className="meta-card">
              <span className="meta-label">Active</span>
              <span className="meta-value">{activeCount}</span>
            </div>
            <div className="meta-card">
              <span className="meta-label">Wins</span>
              <span className="meta-value">{winsCount}</span>
            </div>
            <div className="meta-card subtle">
              <span className="meta-label">Sync</span>
              <span className="meta-value">{serverOffset}ms</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid">
        {items.map((item) => {
          const remaining = Math.max(0, item.endTime - clientNow);
          const isEnded = endedMap[item.id] || remaining <= 0;
          const isWinning = item.highestBidderId === userId;
          const isOutbid = outbidMap[item.id] && !isWinning;
          const hasWinner = item.highestBidderId !== null;
          const didWin = isEnded && hasWinner && isWinning;
          const didLose = isEnded && hasWinner && !isWinning;
          const status = isEnded
            ? "Ended"
            : isWinning
              ? "Winning"
              : isOutbid
                ? "Outbid"
                : "Active";

          return (
            <div
              key={item.id}
              className={`card ${flashMap[item.id] ? "flash" : ""} ${isOutbid ? "outbid" : ""
                }`}
            >
              <div className="card-header">
                <h2>{item.title}</h2>
                <span className={`chip ${status.toLowerCase()}`}>
                  {status}
                </span>
              </div>

              <div className="price">
                ${item.currentBid.toFixed(0)}
                <span className="starting">
                  Starting ${item.startingPrice}
                </span>
              </div>

              <div className="timer-row">
                <span className="timer-label">Time left</span>
                <span className={`timer-pill ${isEnded ? "ended" : ""}`}>
                  {isEnded ? "Ended" : formatTime(remaining)}
                </span>
              </div>

              {didWin && <div className="result win">🏆 You won</div>}
              {didLose && <div className="result lose">❌ You lost</div>}

              <button
                className="bid-button"
                onClick={() => handleBid(item)}
                disabled={isEnded}
              >
                Place bid +${BID_INCREMENT}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

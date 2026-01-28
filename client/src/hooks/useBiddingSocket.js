import { useEffect, useRef, useState } from "react";
import { getOrCreateUserId, socket } from "../socket";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function useBiddingSocket() {
  const [items, setItems] = useState([]);
  const [serverOffset, setServerOffset] = useState(0);
  const [socketId, setSocketId] = useState(null);
  const [flashMap, setFlashMap] = useState({});
  const [outbidMap, setOutbidMap] = useState({});
  const [endedMap, setEndedMap] = useState({});
  const socketIdRef = useRef(null);
  const winningRef = useRef({});
  const userIdRef = useRef(getOrCreateUserId());

  useEffect(() => {
    fetch(`${API_BASE}/items`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setServerOffset((data.serverTime || Date.now()) - Date.now());
      })
      .catch(() => {
        setItems([]);
      });
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      socketIdRef.current = socket.id;
      setSocketId(socket.id);
    });

    socket.on("SERVER_TIME", (payload) => {
      if (payload?.serverTime) {
        setServerOffset(payload.serverTime - Date.now());
      }
    });

    socket.on("UPDATE_BID", (payload) => {
      if (!payload) return;
      const { itemId, currentBid, highestBidderId, serverTime } = payload;

      if (serverTime) {
        setServerOffset(serverTime - Date.now());
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, currentBid, highestBidderId }
            : item
        )
      );

      setFlashMap((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setFlashMap((prev) => ({ ...prev, [itemId]: false }));
      }, 350);

      const wasWinning = winningRef.current[itemId] === true;
      const isWinning = highestBidderId === userIdRef.current;
      if (wasWinning && !isWinning) {
        setOutbidMap((prev) => ({ ...prev, [itemId]: true }));
        setTimeout(() => {
          setOutbidMap((prev) => ({ ...prev, [itemId]: false }));
        }, 1500);
      }
      if (isWinning) {
        setOutbidMap((prev) => ({ ...prev, [itemId]: false }));
      }
      winningRef.current[itemId] = isWinning;
    });

    socket.on("BID_ERROR", (payload) => {
      if (!payload?.itemId) return;
      setOutbidMap((prev) => ({ ...prev, [payload.itemId]: true }));
      setTimeout(() => {
        setOutbidMap((prev) => ({ ...prev, [payload.itemId]: false }));
      }, 1500);
    });

    socket.on("AUCTION_ENDED", (payload) => {
      if (!payload?.itemId) return;
      const { itemId, winnerId, finalBid, endedAt } = payload;
      setEndedMap((prev) => ({ ...prev, [itemId]: true }));
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                currentBid:
                  typeof finalBid === "number" ? finalBid : item.currentBid,
                highestBidderId:
                  typeof winnerId === "string" ? winnerId : item.highestBidderId,
                endTime: endedAt || item.endTime
              }
            : item
        )
      );
    });

    return () => {
      socket.off("connect");
      socket.off("SERVER_TIME");
      socket.off("UPDATE_BID");
      socket.off("BID_ERROR");
      socket.off("AUCTION_ENDED");
    };
  }, []);

  function placeBid(itemId, amount) {
    if (!socketIdRef.current) return;
    socket.emit("BID_PLACED", {
      itemId,
      amount,
      bidderId: userIdRef.current
    });
  }

  return {
    items,
    serverOffset,
    socketId,
    userId: userIdRef.current,
    flashMap,
    outbidMap,
    endedMap,
    placeBid
  };
}

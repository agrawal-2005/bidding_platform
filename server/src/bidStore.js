import { createItems } from "./items.js";

const items = new Map();

export function initializeStore() {
  items.clear();
  const initialItems = createItems();
  initialItems.forEach((item) => items.set(item.id, item));
}

export function listItems() {
  return Array.from(items.values()).map((item) => ({ ...item }));
}

export function getItem(itemId) {
  return items.get(itemId);
}

export function placeBid({ itemId, amount, bidderId, now }) {
  const item = items.get(itemId);
  if (!item) {
    return { ok: false, error: "Item not found" };
  }

  if (now >= item.endTime) {
    return { ok: false, error: "Auction ended" };
  }

  if (amount <= item.currentBid) {
    return { ok: false, error: "Outbid" };
  }

  item.currentBid = amount;
  item.highestBidderId = bidderId;
  return { ok: true, item: { ...item } };
}

export function getWinner(itemId) {
  const item = items.get(itemId);
  if (!item || Date.now() < item.endTime) return null;

  return {
    itemId,
    winnerId: item.highestBidderId,
    finalBid: item.currentBid
  };
}
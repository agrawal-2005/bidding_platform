const baseItems = [
  { id: "item-1", title: "Air Purifier", startingPrice: 210, durationMs: 4 * 60 * 1000 },
  { id: "item-2", title: "Mechanical Keyboard", startingPrice: 160, durationMs: 3 * 60 * 1000 },
  { id: "item-3", title: "Noise Cancelling Earbuds", startingPrice: 190, durationMs: 4 * 60 * 1000 },
  { id: "item-4", title: "Smart Light Kit", startingPrice: 140, durationMs: 3 * 60 * 1000 }
];

export function createItems(now = Date.now()) {
  return baseItems.map((item) => ({
    id: item.id,
    title: item.title,
    startingPrice: item.startingPrice,
    currentBid: item.startingPrice,
    highestBidderId: null,
    endTime: now + item.durationMs
  }));
}

import assert from "node:assert/strict";
import { test } from "node:test";
import { initializeStore, listItems, placeBid } from "../src/bidStore.js";
import { withItemLock } from "../src/locks.js";

function getFirstItem() {
  const [first] = listItems();
  if (!first) {
    throw new Error("No items in store");
  }
  return first;
}

test("rejects bid that is not higher", () => {
  initializeStore();
  const item = getFirstItem();
  const result = placeBid({
    itemId: item.id,
    amount: item.currentBid,
    bidderId: "user-1",
    now: Date.now()
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Outbid");
});

test("rejects bid after auction end", () => {
  initializeStore();
  const item = getFirstItem();
  const result = placeBid({
    itemId: item.id,
    amount: item.currentBid + 10,
    bidderId: "user-2",
    now: item.endTime + 1
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Auction ended");
});

test("accepts higher bid", () => {
  initializeStore();
  const item = getFirstItem();
  const result = placeBid({
    itemId: item.id,
    amount: item.currentBid + 10,
    bidderId: "user-3",
    now: Date.now()
  });

  assert.equal(result.ok, true);
  assert.equal(result.item.currentBid, item.currentBid + 10);
  assert.equal(result.item.highestBidderId, "user-3");
});

test("serializes concurrent bids to prevent same-amount race", async () => {
  initializeStore();
  const item = getFirstItem();
  const amount = item.currentBid + 10;

  const [first, second] = await Promise.all([
    withItemLock(item.id, () =>
      placeBid({ itemId: item.id, amount, bidderId: "user-4", now: Date.now() })
    ),
    withItemLock(item.id, () =>
      placeBid({ itemId: item.id, amount, bidderId: "user-5", now: Date.now() })
    )
  ]);

  const results = [first, second];
  const okCount = results.filter((r) => r.ok).length;
  const outbidCount = results.filter((r) => r.error === "Outbid").length;

  assert.equal(okCount, 1);
  assert.equal(outbidCount, 1);
});

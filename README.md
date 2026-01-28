# Live Bidding Platform

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js\&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?logo=express\&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socket.io\&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react\&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite\&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker\&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?logo=render\&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel\&logoColor=white)

A **real-time auction platform** with **server-authoritative countdowns**, **Socket.io–powered live bidding**, and **race-condition safety** to deterministically handle concurrent bids.

This project was built as part of a **real-time systems challenge**, focusing on **correctness under concurrency**, **synchronization**, and **production-grade architecture**.

---

## 🌐 Live Demo

* **Frontend (Vercel)**
  👉 [https://bidding-platform-iota.vercel.app](https://bidding-platform-iota.vercel.app)

* **Backend (Render)**
  👉 [https://bidding-platform-w29z.onrender.com](https://bidding-platform-w29z.onrender.com)

> ⚠️ Backend runs on Render free tier — the first request may take a few seconds due to cold start.

---

## 🧪 How to Evaluate This Demo (Important)

* Auctions **automatically end** after their configured duration
* To allow reviewers to **actively test bidding**, a **demo-only reset button** is provided
* The **“Restart Auctions (Demo)”** button:

  * Resets all auctions on the server
  * Re-seeds items with fresh countdown timers
  * Is intentionally **not production behavior**

This ensures the project is **testable even after deployment** and avoids appearing as a static UI.

---

## 🚀 Key Highlights

* 🔄 Real-time bid updates using **Socket.io**
* ⏱️ **Server-synchronized countdown timers** (client time cannot be trusted)
* 🏁 **Authoritative auction end enforced on the server**
* 🔒 Per-item locking to prevent same-millisecond bid races
* ⚡ Immediate outbid / validation feedback
* 🧪 Unit-tested bid validation and concurrency logic
* 🐳 Dockerfile included for reproducible local setup

---

## 🧠 What This Project Demonstrates

* Designing **real-time distributed systems**
* Preventing **race conditions** under concurrent writes
* Mixing **REST (initial state)** + **WebSockets (live updates)**
* Clean separation of concerns (store, locks, sockets, UI)
* Writing **testable backend business logic**
* Making deliberate **scope vs complexity trade-offs**

---

## 🛠️ Tech Stack

### Backend

* Node.js
* Express
* Socket.io
* In-memory data store
* Custom per-item locking mechanism

### Frontend

* React
* Vite
* Socket.io client
* Custom hooks for socket lifecycle management

### Infrastructure

* Docker
* Render (Backend)
* Vercel (Frontend)

---

## 🧩 System Architecture

```
Client (React)
  │
  ├── REST API (initial items + server time)
  │
  └── Socket.io (live bidding & events)
        │
        └── Node.js Server
              ├── In-memory bid store
              ├── Per-item locks
              └── Server-controlled auction timers
```

### Why this design?

* REST provides a clean initial snapshot
* WebSockets ensure instant synchronization
* Server time is the **single source of truth**

---

## 📁 Project Structure

```
.
├── client
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── src
│   │   ├── App.jsx
│   │   ├── hooks
│   │   │   └── useBiddingSocket.js
│   │   ├── main.jsx
│   │   ├── socket.js
│   │   └── styles.css
│   └── vite.config.js
│
├── server
│   ├── package.json
│   ├── src
│   │   ├── index.js        # Express + Socket.io setup
│   │   ├── bidStore.js    # Core bidding logic
│   │   ├── locks.js       # Per-item concurrency control
│   │   └── items.js       # Seeded auction items
│   └── test
│       └── bidStore.test.js
│
├── Dockerfile
├── .env.example
└── README.md
```

---

## ⚙️ Environment Configuration

### Server `.env`

```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

### Client `.env`

```
VITE_API_BASE=https://bidding-platform-w29z.onrender.com
VITE_SOCKET_URL=https://bidding-platform-w29z.onrender.com
```

All runtime configuration is externalized to avoid environment-specific hardcoding.

---

## ⏱️ Server-Synced Countdown (Critical Requirement)

Auction timers are **derived from server time**, not the client clock.

* Server provides:

  * `serverTime`
  * `endTime` per auction
* Client computes remaining time using a server–client offset
* Server **always validates bids using its own clock**

This guarantees:

* Client-side time manipulation is impossible
* Auction end is deterministic
* Bid acceptance is authoritative

---

## 🏁 Auction Lifecycle

* Auctions are **seeded in memory** on server startup
* Each auction runs for a fixed duration
* Once ended, auctions are closed
* Restarting the server or using the demo reset reinitializes auctions

> This intentional design keeps focus on **real-time correctness** rather than persistence.

---

## 🔗 REST API

### `GET /items`

```json
{
  "items": [
    {
      "id": "item-1",
      "title": "Air Purifier",
      "currentBid": 210,
      "endTime": 1710000000000
    }
  ],
  "serverTime": 1710000000123
}
```

---

## 🔌 Socket Events

### Client → Server

* `BID_PLACED`

```json
{ "itemId": "item-1", "amount": 235 }
```

### Server → Client

* `UPDATE_BID`
* `BID_ERROR`
* `AUCTION_ENDED`
* `SERVER_TIME`

---

## 🏆 Winner Determination

Winner is decided **entirely on the server**:

```js
if (Date.now() >= item.endTime) {
  winner = item.highestBidderId;
}
```

UI displays:

* 🏆 **You won**
* ❌ **You lost**

---

## 🔒 Race Condition Handling

* Each auction item has its own in-memory lock
* Bids are serialized per item
* Same-millisecond bids are deterministically resolved

✔ Exactly one bid wins
✔ Others receive immediate feedback

---

## 🧪 Tests

```bash
cd server
npm test
```

Covered cases:

* Lower bid rejection
* Auction end enforcement
* Valid bid acceptance
* Concurrent bid race prevention

---

## ▶️ Run Locally

```bash
# Backend
cd server
npm install
npm start

# Frontend
cd client
npm install
npm run dev
```

Open 👉 [http://localhost:5173](http://localhost:5173)

---

## 🐳 Docker

```bash
docker build -t bidding-platform .
docker run -p 4000:4000 bidding-platform
```

---

## 🔮 Future Improvements

* Persistent database
* Redis-based distributed locks
* Authentication
* Admin auction management
* Horizontal Socket.io scaling

---

## 👨‍💻 Author

Built to demonstrate **real-time system design**, **concurrency correctness**, and **engineering judgment** under time constraints.

---

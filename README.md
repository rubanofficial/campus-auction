# 🎓 Campus Auction — Peer-to-Peer Student Marketplace

[![Node.js](https://img.shields.io/badge/Node.js-v20+-68a063?style=flat&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-336791?style=flat&logo=postgresql)](https://neon.tech/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=flat&logo=socket.io)](https://socket.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-Search-4285f4?style=flat&logo=google)](https://ai.google.dev/)

**Campus Auction** is a modern, real-time peer-to-peer auction platform built for college students to buy and sell textbooks, electronics, cycles, lab gear, calculators, and campus essentials transparently. It features live WebSocket bidding, automated proxy auto-bidding, anti-sniping closing time extensions, seller decision workflows, and an AI-powered natural language product search.

---

## 🚀 Key Features

### ⚡ 1. Live Real-Time Bidding (Socket.IO)
- **Zero-Refresh Updates:** Watch bids arrive live. When another student places a bid, the current leading bid, bid counter, leader's name, and public bid history update instantly on all active viewers' screens via isolated Socket.IO rooms (`auction:<id>`).
- **Resilient Reconnection:** Automatically rejoins the active auction room and synchronizes data on network disruptions.

### 🤖 2. Concurrency-Safe Auto-Bid (Proxy Bidding)
- Students can set a **Maximum Budget** for an item.
- The backend automatic bidding engine automatically places the minimum necessary counter-bid whenever a competitor bids, keeping the student in the lead without exceeding their preset limit.
- Protected by PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) to guarantee zero race conditions or over-bids.

### ⏱️ 3. Anti-Sniping / Last-Minute Auction Extension
- **Fair Play Guarantee:** If a valid bid arrives within the final **30 seconds** of an auction, the auction's closing time automatically extends to **60 seconds after that bid was accepted**.
- Subsequent bids within the 30-second window extend the deadline again, giving all genuine campus bidders an equal opportunity to compete.
- Emits real-time visual alerts and instantly synchronizes the countdown timer across all connected browsers.

### 🤝 4. Seller Accept / Reject Winning Bid Workflow
- When an auction concludes, the seller has full authority over the final physical sale.
- Sellers can **Accept** the highest bid (reserving the item for physical exchange on campus) or **Reject** the winning bid.
- In-app notifications are automatically dispatched to the winning bidder with the seller's decision.
- Seller action controls remain strictly hidden while the auction is active or extended.

### 🧠 5. AI-Powered Natural Language Search (Google Gemini)
- Integrated with Google Gemini to understand natural language buyer intent:
  - *"I need a scientific calculator under ₹800"*
  - *"Show me bicycles in good condition closing soon"*
  - *"Find textbooks below ₹400"*
- Extracts product keywords, categories, budget ceilings, and urgency filters, returning real matching listings from the PostgreSQL database.

### 📲 6. Shareable Auction Listings
- Clean modal with one-click **Copy Link** and automatic fallback support for all browsers.
- Integrates the native **Web Share API** (`navigator.share`) on mobile devices to easily share listings via WhatsApp, Telegram, or email.

### 📊 7. Live Activity & Notifications Dashboard
- **My Activity:** Real-time personal overview displaying Active Listings, Active Bids, Won Auctions, and Sales History with live PostgreSQL data.
- **Notifications Center:** Instant alerts when outbid, when winning an auction, or when a seller accepts/declines a bid.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS v4, Lucide React, React Router v6, Socket.IO Client |
| **Backend** | Node.js (ES Modules), Express.js, Helmet, CORS, Express-Session, Connect-PG-Simple, Multer |
| **Database** | Neon Serverless PostgreSQL (`pg` connection pool with SSL) |
| **Real-Time** | Socket.IO WebSockets |
| **AI / Search** | Google Gemini API |
| **Media Hosting** | Cloudinary API |
| **Authentication**| Session-based authentication with `bcryptjs` password hashing |

---

## 📂 Project Structure

```text
Campus Auction/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Button, PageHeader, Cards)
│   │   ├── context/            # AuthContext (session state, user profile)
│   │   ├── pages/              # Application views
│   │   │   ├── Home.jsx        # Marketplace landing & live feed
│   │   │   ├── Auctions.jsx    # Browse & filter listings
│   │   │   ├── AuctionDetails.jsx # Real-time live bidding, auto-bid & anti-sniping
│   │   │   ├── CreateAuction.jsx  # Create listing with image upload
│   │   │   ├── MyActivity.jsx  # Student activity, bids, wins & sales
│   │   │   ├── AiAssistant.jsx # Natural language AI search interface
│   │   │   ├── Notifications.jsx # In-app notification center
│   │   │   ├── Login.jsx       # Student login
│   │   │   └── Register.jsx    # New student registration
│   │   ├── routes/             # AppRoutes (Public & Protected routes)
│   │   └── utils/              # Socket.IO client singleton & helpers
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Express + Node.js API
│   ├── src/
│   │   ├── config/             # Database pool (Neon) & Socket.IO initialization
│   │   ├── controllers/        # Business logic
│   │   │   ├── auction.controller.js # Auction CRUD
│   │   │   ├── bid.controller.js     # Manual bidding & transactional placement
│   │   │   ├── autoBid.controller.js # Proxy auto-bidding engine & anti-sniping
│   │   │   ├── decision.controller.js# Seller accept / reject winning bid
│   │   │   ├── ai.controller.js      # Natural language search controller
│   │   │   ├── activity.controller.js# Student activity statistics
│   │   │   └── auth.controller.js    # Authentication & session management
│   │   ├── middleware/         # Session authentication guards
│   │   ├── migrations/         # PostgreSQL DDL migrations
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Gemini AI extraction service & Cloudinary
│   │   ├── app.js              # Express app configuration & middleware
│   │   └── server.js           # Server entry point & graceful shutdown
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Neon PostgreSQL**: A free Neon database account or any PostgreSQL 14+ instance
- **Cloudinary Account**: (Optional, for item image hosting)
- **Google Gemini API Key**: (Optional, for AI Natural Language Search)

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/campus-auction.git
cd "campus-auction"
```

---

### 2. Backend Setup

1. Navigate to the `server` directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file in the `server` directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Populate the required environment variables in `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   # Neon PostgreSQL Connection String
   DATABASE_URL=postgresql://<user>:<password>@<neon-endpoint>.neon.tech/<dbname>?sslmode=require

   # Session secret (min 32 characters)
   SESSION_SECRET=super_secret_campus_auction_session_key_12345

   # Cloudinary Media Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Google Gemini API Key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. Run the database migrations to set up the tables:
   ```bash
   npm run migrate
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000`.*

---

### 3. Frontend Setup

1. Open a new terminal, navigate to the `client` directory, and install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Create a `.env` file in the `client` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will start on `http://localhost:5173`.*

---

## 🗄️ Database Migrations

Database tables are versioned and managed under `server/src/migrations/`:

| Migration | Purpose |
| :--- | :--- |
| `001_create_users_table.sql` | Student accounts, display names, emails, roles, and password hashes |
| `002_create_auctions_table.sql` | Listings, starting price, minimum increment, current leader, closing date |
| `003_create_bids_table.sql` | Public bid ledger with timestamps and whole-rupee amounts |
| `004_create_notifications_table.sql` | User notifications for outbids, won auctions, and seller decisions |
| `005_create_auto_bids_table.sql` | Proxy auto-bid budget ceilings per student and auction |
| `006_add_seller_decision_to_auctions.sql` | Seller decision state (`accepted` / `rejected`), decided timestamps |

To re-run migrations at any time:
```bash
npm --prefix server run migrate
```

---

## 📡 API Reference Overview

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new student account |
| `POST` | `/api/auth/login` | Login and establish session cookie |
| `POST` | `/api/auth/logout` | Terminate session |
| `GET` | `/api/auth/me` | Fetch currently logged-in student profile |

### 🏷️ Auctions (`/api/auctions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auctions` | List active auctions with category and sorting filters |
| `POST` | `/api/auctions` | Create a new auction listing |
| `GET` | `/api/auctions/:id` | Get authoritative auction details and seller info |
| `GET` | `/api/auctions/:id/bids` | Get public bid history |
| `POST` | `/api/auctions/:id/bids` | Place a manual bid (with anti-sniping evaluation) |
| `GET` | `/api/auctions/:id/auto-bid`| Get the logged-in student's configured Auto-Bid limit |
| `POST` | `/api/auctions/:id/auto-bid`| Set or update Auto-Bid budget ceiling |
| `DELETE` | `/api/auctions/:id/auto-bid`| Cancel active Auto-Bid |
| `POST` | `/api/auctions/:id/accept` | Seller accepts the winning bid |
| `POST` | `/api/auctions/:id/reject` | Seller rejects the winning bid |

### 🔍 AI Assistant (`/api/ai`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/search` | Natural language query search powered by Google Gemini |

### 📊 Activity & Notifications
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/activity` | Personal summary of active listings, bids, won auctions, and sales |
| `GET` | `/api/notifications` | List user notifications |
| `PATCH`| `/api/notifications/:id/read` | Mark a notification as read |

---

## ⚡ Socket.IO Events

| Event | Direction | Description |
| :--- | :--- | :--- |
| `auction:join` | Client $\to$ Server | Joins the room `auction:<auctionId>` |
| `auction:leave` | Client $\to$ Server | Leaves the room `auction:<auctionId>` |
| `auction:bid-updated` | Server $\to$ Client | Broadcasts newly accepted bid, new price, leader, and `endsAt` extension |
| `auction:decision-updated` | Server $\to$ Client | Broadcasts seller's decision outcome (`accepted` or `rejected`) |

---

## 🛡️ Anti-Sniping Rules Summary

1. **Threshold:** If a valid bid is placed with **$\le 30$ seconds** remaining before the closing time.
2. **Action:** The closing time (`ends_at`) is automatically set to **60 seconds after that bid was accepted**.
3. **Chaining:** If another valid bid arrives within the final 30 seconds of the new extended period, the closing time extends again by 60 seconds.
4. **Integrity:** Invalid bids, unauthorized bids, or bids arriving after closing never extend the auction.

---

## 🧪 Verification & Production Build

To verify frontend bundling and syntax integrity:
```bash
npm --prefix client run build
```

To run the application in production mode:
```bash
# In server directory
npm start

# In client directory
npm run preview
```

---

## 👥 Authors & Pair Programming

Developed for the Campus Marketplace Hackathon with paired human-agent pairing on **Antigravity**.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

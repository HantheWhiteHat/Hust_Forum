<p align="center">
  <img src="frontend/public/favico.png" alt="BK Forum Logo" width="80" height="80">
</p>

<h1 align="center">🎓 BK Forum</h1>

<p align="center">
  <strong>A modern, real-time forum platform for university students</strong>
</p>

<p align="center">
  <a href="https://hust-forum.vercel.app">🌐 Live Demo</a> •
  <a href="#features">✨ Features</a> •
  <a href="#tech-stack">🛠 Tech Stack</a> •
  <a href="#getting-started">🚀 Getting Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Socket.io-4.8-010101?style=flat-square&logo=socket.io" alt="Socket.io">
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | JWT-based login/register with secure password hashing |
| 📝 **Rich Text Posts** | WYSIWYG editor with inline images & videos |
| 💬 **Nested Comments** | Threaded comment system with infinite replies |
| ⬆️ **Voting System** | Upvote/downvote posts and comments |
| 🔍 **Search** | Full-text search for posts and users |
| 📱 **Responsive** | Mobile-first design, works on all devices |
| ⚡ **Real-time** | Live updates via Socket.io |
| 🖼️ **Media Upload** | Support for images and videos |
| 👤 **User Profiles** | Customizable avatars and bio |

---

## 🛠 Tech Stack

### Frontend
```
React 18 • Vite • Tailwind CSS • React Router • Socket.io Client
React Hook Form • React Hot Toast • Lucide Icons • Axios
```

### Backend
```
Node.js • Express.js • MongoDB • Mongoose • JWT • Socket.io
Multer • bcryptjs • Express Validator • Helmet
```

### Deployment
```
Frontend: Vercel • Backend: Render • Database: MongoDB Atlas
```

---

## 📁 Project Structure

```
BK-Forum/
├── 📂 backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # Auth, validation, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── app.js          # Express app setup
│   │   ├── server.js       # Entry point
│   │   └── socket.js       # Socket.io configuration
│   └── uploads/            # User uploaded media
│
├── 📂 frontend/
│   ├── src/
│   │   ├── api/            # Axios & Socket.io clients
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Auth context
│   │   ├── App.jsx         # Main app with routing
│   │   └── main.jsx        # Entry point
│   └── public/             # Static assets
│
├── .env.example            # Environment template
├── render.yaml             # Render deploy config
└── docker-compose.yml      # Docker configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/HantheWhiteHat/Hust_Forum.git
cd Hust_Forum

# Install backend
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI

# Install frontend
cd ../frontend
npm install
```

### Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bkforum
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| **Posts** |
| GET | `/api/posts` | Get posts (paginated) |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:id` | Get single post |
| DELETE | `/api/posts/:id` | Delete post |
| **Comments** |
| GET | `/api/comments/post/:id` | Get post comments |
| POST | `/api/comments` | Create comment |
| **Votes** |
| POST | `/api/votes` | Vote on post/comment |
| **Users** |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update profile |

---

## 🌐 Deployment

### Live URLs
| Service | URL |
|---------|-----|
| 🌐 Frontend | https://hust-forum.vercel.app |
| 🔧 Backend | https://bk-forum-api.onrender.com |

### Deploy Your Own

1. **MongoDB Atlas** - Create free cluster
2. **Render** - Deploy backend with env variables
3. **Vercel** - Deploy frontend with `VITE_API_URL`

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/HantheWhiteHat">HantheWhiteHat</a>
</p>

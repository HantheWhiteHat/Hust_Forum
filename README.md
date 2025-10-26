# BK Forum

A modern forum application built with Node.js, Express, MongoDB, and React.

## Features

- **User Authentication**: Register, login, and user management
- **Posts**: Create, read, update, and delete forum posts
- **Comments**: Nested comment system with replies
- **Voting**: Upvote and downvote posts and comments
- **Categories**: Organize posts by categories
- **Search**: Full-text search functionality
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live comment and vote updates

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Express Rate Limiting
- CORS support

### Frontend
- React 18
- React Router DOM
- Vite
- Tailwind CSS
- Axios for API calls
- React Hook Form
- React Hot Toast
- Lucide React icons

## Project Structure

```
bkforum/
├─ backend/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ env.example
│  ├─ src/
│  │  ├─ server.js                    # entry point
│  │  ├─ app.js                       # express app + middlewares
│  │  ├─ config/
│  │  │  └─ db.js
│  │  ├─ middlewares/
│  │  │  ├─ auth.js                   # verify JWT
│  │  │  └─ errorHandler.js
│  │  ├─ controllers/
│  │  │  ├─ authController.js
│  │  │  ├─ userController.js
│  │  │  ├─ postController.js
│  │  │  ├─ commentController.js
│  │  │  └─ voteController.js
│  │  ├─ models/
│  │  │  ├─ User.js
│  │  │  ├─ Post.js
│  │  │  ├─ Comment.js
│  │  │  └─ Vote.js
│  │  ├─ routes/
│  │  │  ├─ auth.js
│  │  │  ├─ users.js
│  │  │  ├─ posts.js
│  │  │  ├─ comments.js
│  │  │  └─ votes.js
│  │  └─ utils/
│  │     └─ paginate.js
│  └─ tests/                           # unit tests
│
├─ frontend/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ src/
│  │  ├─ main.jsx
│  │  ├─ App.jsx
│  │  ├─ index.css
│  │  ├─ api/                         # axios instances
│  │  │  └─ api.js
│  │  ├─ pages/
│  │  │  ├─ Home.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ Register.jsx
│  │  │  ├─ PostDetail.jsx
│  │  │  ├─ CreatePost.jsx
│  │  │  └─ Profile.jsx
│  │  ├─ components/
│  │  │  ├─ Header.jsx
│  │  │  ├─ PostCard.jsx
│  │  │  └─ CommentTree.jsx
│  │  └─ store/                       # context
│  │     └─ authContext.js
│  └─ public/
│
├─ docker-compose.yml
└─ README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bkforum
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Using Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bkforum
MONGODB_TEST_URI=mongodb://localhost:27017/bkforum_test

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get all posts (with pagination, search, filters)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create new comment (auth required)
- `PUT /api/comments/:id` - Update comment (auth required)
- `DELETE /api/comments/:id` - Delete comment (auth required)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user (auth required)
- `DELETE /api/users/:id` - Delete user (admin only)

### Votes
- `POST /api/votes` - Create vote (auth required)
- `PUT /api/votes/:id` - Update vote (auth required)
- `DELETE /api/votes/:id` - Delete vote (auth required)

## Development

### Running Tests
```bash
cd backend
npm test
```

### Linting
```bash
cd frontend
npm run lint
```

## Deployment

The application is containerized and ready for deployment with Docker Compose. Simply run:

```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Backend API on port 3000
- Frontend on port 5173

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.


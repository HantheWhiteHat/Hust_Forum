<p align="center">
  <strong>TRƯỜNG ĐẠI HỌC BÁCH KHOA HÀ NỘI</strong><br>
  <strong>VIỆN CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG</strong>
</p>

<h1 align="center">📋 BÁO CÁO ĐỒ ÁN BÀI TẬP LỚN</h1>
<h2 align="center">MÔN: CÔNG NGHỆ WEB VÀ DỊCH VỤ TRỰC TUYẾN</h2>

<p align="center">
  <strong>Đề tài: Xây dựng diễn đàn trực tuyến BK Forum</strong>
</p>

---

## 👥 Thông tin nhóm

| STT | Họ và tên | MSSV | Vai trò |
|-----|-----------|------|---------|
| 1 | Bùi Trung Hoàng | 20235333 | Team Leader, Backend Developer |
| 2 | Đỗ Bá Hoàng | 20225190 | Frontend Developer |
| 3 | Lê Việt Hoàng | 20225321 | Full-stack Developer |
| 4 | Ngô Hữu Hoàng | 20225191 | Database & Deployment |

**Nhóm:** 12  
**Giảng viên hướng dẫn:** Đỗ Bá Lâm  
**Repository:** https://github.com/HantheWhiteHat/Hust_Forum.git  
**Demo:** https://hust-forum.vercel.app

---

## 📌 Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Mô tả bài toán và yêu cầu](#2-mô-tả-bài-toán-và-yêu-cầu)
3. [Nhóm người dùng và kịch bản sử dụng](#3-nhóm-người-dùng-và-kịch-bản-sử-dụng)
4. [Kiến trúc hệ thống](#4-kiến-trúc-hệ-thống)
5. [Công nghệ sử dụng](#5-công-nghệ-sử-dụng)
6. [Thiết kế Backend và API](#6-thiết-kế-backend-và-api)
7. [Thiết kế Frontend và UI/UX](#7-thiết-kế-frontend-và-uiux)
8. [Cơ chế cập nhật Realtime](#8-cơ-chế-cập-nhật-realtime)
9. [Kết quả và Demo](#9-kết-quả-và-demo)
10. [Kết luận](#10-kết-luận)

---

## 1. Giới thiệu

### 1.1 Bối cảnh
Trong bối cảnh chuyển đổi số mạnh mẽ, nhu cầu trao đổi thông tin và thảo luận trực tuyến ngày càng tăng cao. Đặc biệt trong môi trường đại học, sinh viên cần một nền tảng để:
- Chia sẻ kiến thức học thuật
- Đặt câu hỏi và nhận giải đáp từ cộng đồng
- Kết nối với các sinh viên cùng chuyên ngành
- Thảo luận về các chủ đề đa dạng

### 1.2 Mục tiêu đề tài
Xây dựng **BK Forum** - một diễn đàn trực tuyến hiện đại với các mục tiêu:

| Mục tiêu | Mô tả |
|----------|-------|
| **Ứng dụng kiến thức** | Áp dụng kiến thức Công nghệ Web vào thực tế |
| **Full-stack Development** | Xây dựng ứng dụng hoàn chỉnh từ Frontend đến Backend |
| **Real-time Communication** | Triển khai WebSocket cho cập nhật thời gian thực |
| **Production Deployment** | Triển khai ứng dụng lên môi trường thực tế |

### 1.3 Phạm vi dự án
- **Frontend:** Single Page Application với React
- **Backend:** RESTful API với Node.js/Express
- **Database:** MongoDB với Mongoose ODM
- **Real-time:** WebSocket với Socket.io
- **Deployment:** Vercel (FE) + Render (BE) + MongoDB Atlas (DB)

---

## 2. Mô tả bài toán và yêu cầu

### 2.1 Bài toán
Xây dựng một hệ thống diễn đàn trực tuyến cho phép người dùng:
- Đăng ký tài khoản và quản lý hồ sơ cá nhân
- Tạo, xem, sửa, xóa bài viết với nội dung rich text và media
- Bình luận và phản hồi theo dạng cây (nested comments)
- Bình chọn (upvote/downvote) bài viết và bình luận
- Tìm kiếm nội dung và người dùng
- Nhận cập nhật thời gian thực khi có tương tác mới

### 2.2 Yêu cầu chức năng

| STT | Module | Chức năng | Mô tả |
|-----|--------|-----------|-------|
| 1 | **Auth** | Đăng ký | Tạo tài khoản với email, username, password |
| 2 | | Đăng nhập | Xác thực bằng JWT token |
| 3 | | Đăng xuất | Hủy session phía client |
| 4 | **Post** | Tạo bài viết | Rich text editor, upload media |
| 5 | | Xem danh sách | Pagination, filter, sort |
| 6 | | Xem chi tiết | Hiển thị đầy đủ nội dung + comments |
| 7 | | Xóa bài viết | Chỉ tác giả được xóa |
| 8 | **Comment** | Bình luận | Comment trực tiếp vào bài viết |
| 9 | | Reply | Phản hồi comment khác (nested) |
| 10 | | Xóa comment | Chỉ tác giả được xóa |
| 11 | **Vote** | Upvote/Downvote | Toggle vote cho post/comment |
| 12 | **Search** | Tìm kiếm | Tìm posts và users |
| 13 | **Profile** | Xem hồ sơ | Thông tin user, danh sách bài viết |
| 14 | | Cập nhật | Đổi avatar, bio |

### 2.3 Yêu cầu phi chức năng

| Yêu cầu | Tiêu chí |
|---------|----------|
| **Hiệu năng** | Response time < 2s |
| **Bảo mật** | Password hashing (bcrypt), JWT auth, CORS, Helmet |
| **Khả dụng** | Uptime > 99% (với free tier) |
| **Mở rộng** | Kiến trúc modular, dễ thêm tính năng |
| **Responsive** | Hoạt động tốt trên Desktop, Tablet, Mobile |

---

## 3. Nhóm người dùng và kịch bản sử dụng

### 3.1 Nhóm người dùng

| Actor | Mô tả | Quyền hạn |
|-------|-------|-----------|
| **Guest** | Khách chưa đăng nhập | Xem posts, comments, tìm kiếm |
| **User** | Thành viên đã đăng ký | Tất cả quyền Guest + Tạo/xóa posts, comments, vote |
| **Author** | User là tác giả nội dung | Quyền xóa posts/comments của mình |

### 3.2 Use Case Diagram

```
                    ┌─────────────────────────────────────────┐
                    │             BK FORUM                     │
                    │                                          │
    ┌────────┐      │  ┌─────────────┐    ┌─────────────┐     │
    │ Guest  │──────┼──│ View Posts  │    │   Search    │─────│
    └────────┘      │  └─────────────┘    └─────────────┘     │
         │          │                                          │
         │          │  ┌─────────────┐    ┌─────────────┐     │
         ▼          │  │  Register   │    │    Login    │     │
    ┌────────┐      │  └─────────────┘    └─────────────┘     │
    │  User  │──────┤                                          │
    └────────┘      │  ┌─────────────┐    ┌─────────────┐     │
         │          │  │ Create Post │    │   Comment   │     │
         │          │  └─────────────┘    └─────────────┘     │
         │          │                                          │
         │          │  ┌─────────────┐    ┌─────────────┐     │
         │          │  │    Vote     │    │Edit Profile │     │
         │          │  └─────────────┘    └─────────────┘     │
         ▼          │                                          │
    ┌────────┐      │  ┌─────────────┐                        │
    │ Author │──────┼──│ Delete Own  │                        │
    └────────┘      │  └─────────────┘                        │
                    └─────────────────────────────────────────┘
```

### 3.3 Kịch bản sử dụng chi tiết

#### Kịch bản 1: Đăng ký và đăng nhập
```
1. User truy cập trang Register
2. Nhập username, email, password
3. System validate và tạo account
4. Redirect đến Login
5. User nhập credentials
6. System xác thực và trả về JWT token
7. Frontend lưu token vào localStorage
8. Redirect đến Home với trạng thái đã đăng nhập
```

#### Kịch bản 2: Tạo bài viết mới
```
1. User click "Create Post"
2. Nhập title, chọn category
3. Soạn nội dung với rich text editor
4. Chèn ảnh/video (optional)
5. Click "Post"
6. API upload media → save post → emit socket event
7. Post xuất hiện trên Home (real-time)
```

#### Kịch bản 3: Vote và Comment real-time
```
1. User A đang xem Post X
2. User B vote/comment trên Post X
3. Socket emit event "post:voted" / "comment:new"
4. User A nhận update ngay lập tức (không cần refresh)
```

---

## 4. Kiến trúc hệ thống

### 4.1 Kiến trúc tổng quan (3-Tier Architecture)

```
┌───────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                           │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    React Application                         │  │
│  │   • Single Page Application (SPA)                           │  │
│  │   • Vite Build Tool                                         │  │
│  │   • Tailwind CSS Styling                                    │  │
│  │   • Socket.io Client (Real-time)                            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                    HTTP REST API / WebSocket                       │
│                              ▼                                     │
├───────────────────────────────────────────────────────────────────┤
│                       BUSINESS LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   Express.js Server                          │  │
│  │   • RESTful API Endpoints                                   │  │
│  │   • JWT Authentication Middleware                           │  │
│  │   • Input Validation (express-validator)                    │  │
│  │   • Socket.io Server (Real-time events)                     │  │
│  │   • File Upload (Multer)                                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                       Mongoose ODM                                 │
│                              ▼                                     │
├───────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    MongoDB Atlas                             │  │
│  │   • Collections: users, posts, comments, votes, media       │  │
│  │   • Indexes for performance optimization                    │  │
│  │   • Cloud-hosted with automatic backups                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### 4.2 Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     VERCEL      │     │     RENDER      │     │  MONGODB ATLAS  │
│   (Frontend)    │────▶│    (Backend)    │────▶│   (Database)    │
│                 │     │                 │     │                 │
│ • React SPA     │     │ • Node.js API   │     │ • Cloud DB      │
│ • Static files  │     │ • Socket.io     │     │ • Auto scaling  │
│ • CDN global    │     │ • File uploads  │     │ • Backups       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                          HTTPS / WSS
```

### 4.3 Cấu trúc thư mục chi tiết

```
BK-Forum/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js  # Login, Register, Me
│   │   │   ├── postController.js  # CRUD Posts
│   │   │   ├── commentController.js
│   │   │   ├── voteController.js
│   │   │   └── userController.js
│   │   ├── middlewares/
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── validation.js      # Input validation
│   │   │   └── errorHandler.js    # Global error handler
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Post.js
│   │   │   ├── Comment.js
│   │   │   ├── Vote.js
│   │   │   └── Media.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── posts.js
│   │   │   ├── comments.js
│   │   │   ├── votes.js
│   │   │   └── users.js
│   │   ├── app.js                 # Express configuration
│   │   ├── server.js              # Entry point + Socket.io
│   │   └── socket.js              # Socket event handlers
│   ├── uploads/                   # Uploaded media files
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── api.js             # Axios instance
│   │   │   └── socket.js          # Socket.io client
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── CommentTree.jsx
│   │   │   ├── MediaGallery.jsx
│   │   │   └── ImageCropper.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── PostDetail.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   └── Profile.jsx
│   │   ├── store/
│   │   │   └── authContext.js     # Auth state management
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   │   └── favico.png
│   ├── vercel.json
│   └── package.json
│
├── render.yaml                     # Render deploy config
├── README.md
└── PROJECT_REPORT.md
```

---

## 5. Công nghệ sử dụng

### 5.1 Frontend Stack

| Công nghệ | Version | Vai trò |
|-----------|---------|---------|
| **React** | 18.2 | UI Library - Component-based architecture |
| **Vite** | 4.4 | Build tool - Fast HMR, optimized builds |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **React Router** | 6.15 | Client-side routing |
| **Axios** | 1.5 | HTTP client với interceptors |
| **Socket.io Client** | 4.8 | Real-time WebSocket client |
| **React Hook Form** | 7.45 | Form validation & handling |
| **React Hot Toast** | 2.4 | Toast notifications |
| **Lucide React** | 0.263 | Icon library |
| **React Easy Crop** | 5.5 | Image cropping |

### 5.2 Backend Stack

| Công nghệ | Version | Vai trò |
|-----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.18 | Web framework |
| **MongoDB** | 6.0 | NoSQL Database |
| **Mongoose** | 7.5 | MongoDB ODM |
| **Socket.io** | 4.8 | WebSocket server |
| **JWT** | 9.0 | Token-based authentication |
| **bcryptjs** | 2.4 | Password hashing |
| **Multer** | 2.0 | File upload middleware |
| **express-validator** | 7.0 | Input validation |
| **Helmet** | 7.0 | Security headers |
| **CORS** | 2.8 | Cross-Origin Resource Sharing |
| **express-rate-limit** | 6.10 | Rate limiting |

### 5.3 DevOps & Deployment

| Service | Mục đích | Tier |
|---------|----------|------|
| **Vercel** | Frontend hosting, CDN | Free |
| **Render** | Backend hosting | Free |
| **MongoDB Atlas** | Cloud database | Free (M0) |
| **GitHub** | Version control, CI/CD trigger | Free |

---

## 6. Thiết kế Backend và API

### 6.1 Database Schema Design

#### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    USER      │       │     POST     │       │   COMMENT    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ _id          │◄──────│ author       │       │ _id          │
│ username     │       │ _id          │◄──────│ post         │
│ email        │       │ title        │       │ author ──────┼──┐
│ password     │       │ content      │       │ content      │  │
│ avatar       │       │ category     │       │ parentComment│──┼──┐
│ bio          │       │ media[]      │       │ upvotes      │  │  │
│ createdAt    │       │ upvotes      │       │ downvotes    │  │  │
└──────────────┘       │ downvotes    │       │ createdAt    │  │  │
       ▲               │ views        │       └──────────────┘  │  │
       │               │ createdAt    │              │          │  │
       │               └──────────────┘              └──────────┘  │
       │                      │                            (self)  │
       │                      ▼                                    │
       │               ┌──────────────┐                            │
       │               │    VOTE      │                            │
       │               ├──────────────┤                            │
       └───────────────│ user         │                            │
                       │ post (opt)   │────────────────────────────┘
                       │ comment (opt)│
                       │ type         │
                       └──────────────┘
```

### 6.2 API Design (RESTful)

#### Authentication APIs

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response: 201 Created
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "_id": "...", "username": "johndoe", ... }
}
```

```http
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Post APIs

```http
GET /api/posts?page=1&category=technology&sort=newest&search=react

Response: 200 OK
{
  "posts": [...],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 48,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "My First Post",
  "content": "<p>Hello World</p>",
  "category": "general",
  "media": [File]
}
```

#### Vote API (Toggle mechanism)

```http
POST /api/votes
Authorization: Bearer <token>

{
  "postId": "648a...",     // OR commentId
  "type": "upvote"         // or "downvote"
}

Response: 200 OK
{
  "upvotes": 15,
  "downvotes": 3,
  "userVote": "upvote"     // or null if toggled off
}
```

### 6.3 Middleware Pipeline

```
Request
   │
   ▼
┌─────────────────┐
│     Helmet      │  Security headers
└────────┬────────┘
         ▼
┌─────────────────┐
│   Rate Limit    │  Prevent abuse (1000 req/15min)
└────────┬────────┘
         ▼
┌─────────────────┐
│      CORS       │  Cross-origin control
└────────┬────────┘
         ▼
┌─────────────────┐
│   Body Parser   │  JSON/URL-encoded
└────────┬────────┘
         ▼
┌─────────────────┐
│  Auth Middleware│  JWT verification (if required)
└────────┬────────┘
         ▼
┌─────────────────┐
│   Validation    │  Input validation
└────────┬────────┘
         ▼
┌─────────────────┐
│   Controller    │  Business logic
└────────┬────────┘
         ▼
┌─────────────────┐
│ Error Handler   │  Global error handling
└────────┬────────┘
         ▼
     Response
```

---

## 7. Thiết kế Frontend và UI/UX

### 7.1 Component Architecture

```
App.jsx
├── Header.jsx (Navigation, Search, User menu)
│
├── Routes
│   ├── Home.jsx
│   │   ├── SortButtons (New, Hot, Top)
│   │   ├── CategoryFilter
│   │   └── PostCard.jsx (multiple)
│   │       ├── VoteSection
│   │       ├── PostMeta (author, time, category)
│   │       └── MediaPreview
│   │
│   ├── PostDetail.jsx
│   │   ├── VoteSection
│   │   ├── MediaGallery.jsx
│   │   ├── ContentRenderer
│   │   └── CommentSection
│   │       ├── CommentForm
│   │       └── CommentTree.jsx (recursive)
│   │
│   ├── CreatePost.jsx
│   │   ├── TitleInput
│   │   ├── CategorySelect
│   │   ├── RichTextEditor
│   │   └── MediaUploader
│   │
│   ├── Profile.jsx
│   │   ├── AvatarEditor (ImageCropper.jsx)
│   │   ├── BioEditor
│   │   └── UserPosts
│   │
│   ├── Login.jsx
│   └── Register.jsx
│
└── AuthContext (Global state)
```

### 7.2 Responsive Design Strategy

#### Breakpoints (Tailwind CSS)

| Breakpoint | Min Width | Target Devices |
|------------|-----------|----------------|
| `sm` | 640px | Landscape phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

#### Mobile-First Approach

```jsx
// Example: Sort Buttons responsive
<div className="flex items-center gap-0.5 sm:gap-1">
  <button className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
    <Icon className="w-4 h-4" />
    <span className="hidden sm:inline">New</span>  {/* Hide text on mobile */}
  </button>
</div>
```

### 7.3 UI Components Showcase

#### Header Component
```
┌───────────────────────────────────────────────────────────────┐
│ 🎓 BK Forum    [________🔍]     [Create Post]  👤 Username ▼  │
└───────────────────────────────────────────────────────────────┘
```

#### Post Card Component
```
┌─────────────────────────────────────────────────────┐
│ ▲  │  u/username • r/technology • 2h ago           │
│ 15 │  Post Title Here...                           │
│ ▼  │  Content preview text goes here...            │
│    │  [💬 12 Comments] [👁 45 Views]               │
└─────────────────────────────────────────────────────┘
```

#### Comment Tree (Nested)
```
┌─ Comment 1 by user1
│  └─ Reply 1.1 by user2
│     └─ Reply 1.1.1 by user3
│  └─ Reply 1.2 by user4
└─ Comment 2 by user5
```

---

## 8. Cơ chế cập nhật Realtime

### 8.1 Kiến trúc Socket.io

```
┌─────────────────┐         ┌─────────────────┐
│   Browser A     │         │   Browser B     │
│ (Socket Client) │         │ (Socket Client) │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    WebSocket Connection   │
         ▼                           ▼
┌───────────────────────────────────────────────┐
│              Socket.io Server                  │
│  ┌─────────────────────────────────────────┐  │
│  │              Event Router                │  │
│  │  • post:voted    → broadcast to room    │  │
│  │  • comment:new   → broadcast to room    │  │
│  │  • post:deleted  → broadcast globally   │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │              Room Management             │  │
│  │  • join_post     → socket.join(postId) │  │
│  │  • leave_post    → socket.leave(postId)│  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

### 8.2 Socket Events

| Event | Direction | Payload | Mô tả |
|-------|-----------|---------|-------|
| `join_post` | Client → Server | `postId` | Join room để nhận updates của post |
| `leave_post` | Client → Server | `postId` | Leave room khi rời trang |
| `post:voted` | Server → Clients | `{postId, upvotes, downvotes}` | Vote count thay đổi |
| `post:viewed` | Server → Clients | `{postId, views}` | View count tăng |
| `comment:new` | Server → Clients | `{postId, comment}` | Comment mới được tạo |
| `comment:voted` | Server → Clients | `{commentId, upvotes, downvotes}` | Vote comment |
| `comment:deleted` | Server → Clients | `{postId, commentId}` | Comment bị xóa |
| `post:new` | Server → All | `post` | Bài viết mới (Home page) |
| `post:deleted` | Server → All | `{postId}` | Bài viết bị xóa |

### 8.3 Implementation Details

#### Server-side (socket.js)
```javascript
const emitSocketEvent = (eventName, payload, roomName = null) => {
  const io = getIO();
  if (roomName) {
    io.to(roomName).emit(eventName, payload);  // Emit to specific room
  }
  io.emit(eventName, payload);  // Broadcast to all
};

// Example: After vote is saved
emitSocketEvent('post:voted', {
  postId: postId.toString(),
  upvotes: result.upvotes,
  downvotes: result.downvotes,
}, `post:${postId}`);
```

#### Client-side (PostDetail.jsx)
```javascript
useEffect(() => {
  const socket = getSocket();
  socket.emit('join_post', id);  // Join room when entering post

  const handlePostVoted = (payload) => {
    if (payload?.postId === id) {
      setPost(prev => ({
        ...prev,
        upvotes: payload.upvotes,
        downvotes: payload.downvotes
      }));
    }
  };

  socket.on('post:voted', handlePostVoted);

  return () => {
    socket.emit('leave_post', id);  // Leave room when exiting
    socket.off('post:voted', handlePostVoted);
  };
}, [id]);
```

### 8.4 Incremental Update Strategy

Thay vì fetch lại toàn bộ data, áp dụng **incremental updates**:

```javascript
// ❌ Old approach (expensive)
socket.on('post:voted', () => fetchPosts());

// ✅ New approach (incremental)
socket.on('post:voted', (data) => {
  setPosts(prev => prev.map(p =>
    p._id === data.postId
      ? { ...p, upvotes: data.upvotes, downvotes: data.downvotes }
      : p
  ));
});
```

---

## 9. Kết quả và Demo

### 9.1 Screenshots

**Trang chủ (Desktop)**
- Hiển thị danh sách bài viết
- Filter theo category
- Sort: New / Hot / Top
- Search bar trong header

**Trang bài viết chi tiết**
- Vote section bên trái
- Nội dung rich text với media
- Hệ thống comment nested

**Responsive (Mobile)**
- Header thu gọn
- Sort buttons chỉ hiện icon
- Category dropdown compact

### 9.2 Live Demo

| Platform | URL |
|----------|-----|
| **Website** | https://hust-forum.vercel.app |
| **API** | https://bk-forum-api.onrender.com/api |
| **Health Check** | https://bk-forum-api.onrender.com/api/health |

### 9.3 Thống kê dự án

| Metric | Giá trị |
|--------|---------|
| Tổng số files | ~50 files |
| Lines of Code (Frontend) | ~3,500 lines |
| Lines of Code (Backend) | ~2,500 lines |
| API Endpoints | 15+ routes |
| React Components | 12 components |
| Database Collections | 5 collections |
| Socket Events | 8 events |

---

## 10. Kết luận

### 10.1 Kết quả đạt được

✅ **Hoàn thành mục tiêu đề ra:**
- Xây dựng ứng dụng web full-stack hoàn chỉnh
- Triển khai thành công lên môi trường production
- Áp dụng kiến thức: REST API, JWT Auth, WebSocket, Responsive Design
- Đảm bảo bảo mật: HTTPS, password hashing, input validation

✅ **Tính năng nổi bật:**
- Real-time updates với Socket.io
- Rich text editor với media support
- Nested comments system
- Mobile-responsive UI

### 10.2 Hạn chế

| Hạn chế | Giải thích |
|---------|------------|
| Ephemeral Storage | Render free tier không lưu files vĩnh viễn |
| Cold Start | Server mất ~30s để "wake up" sau 15 phút không hoạt động |
| No Admin Panel | Chưa có giao diện quản trị |
| Limited SEO | SPA không tối ưu cho search engines |

### 10.3 Hướng phát triển

| Tính năng | Mô tả |
|-----------|-------|
| **Cloud Storage** | Migrate sang Cloudinary/S3 cho media |
| **OAuth** | Đăng nhập bằng Google/GitHub |
| **Notifications** | Thông báo real-time |
| **Admin Dashboard** | Quản lý users, posts, reports |
| **SEO Optimization** | Server-side rendering với Next.js |
| **PWA** | Progressive Web App cho mobile |

### 10.4 Bài học kinh nghiệm

1. **Thiết kế trước, code sau** - Lên kiến trúc rõ ràng giúp code nhanh hơn
2. **Real-time phức tạp** - Cần xử lý race conditions, cleanup listeners
3. **Responsive quan trọng** - 50%+ traffic từ mobile
4. **Free tier có giới hạn** - Cần plan cho production scaling

---

## 📎 Tài liệu tham khảo

1. React Documentation - https://react.dev
2. Express.js Guide - https://expressjs.com
3. MongoDB Manual - https://docs.mongodb.com
4. Socket.io Documentation - https://socket.io/docs
5. Tailwind CSS - https://tailwindcss.com
6. JWT Introduction - https://jwt.io/introduction
7. Vite Documentation - https://vitejs.dev

---

<p align="center">
  <strong>© 2024 - Nhóm 12 - Công nghệ Web và Dịch vụ Trực tuyến</strong><br>
  Trường Đại học Bách khoa Hà Nội
</p>

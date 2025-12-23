# BK-Forum Deployment Guide

Deploy Backend → **Render.com** | Database → **MongoDB Atlas** | Frontend → **Vercel**

---

## 📦 Prerequisites

- GitHub repository với code đã push
- Tài khoản: [Render](https://render.com), [MongoDB Atlas](https://cloud.mongodb.com), [Vercel](https://vercel.com)

---

## 1️⃣ MongoDB Atlas (Database)

### 1.1 Tạo Cluster
1. Đăng nhập [MongoDB Atlas](https://cloud.mongodb.com)
2. **Create Cluster** → Chọn **M0 Free Tier**
3. Chọn Region gần nhất (Singapore recommended)

### 1.2 Cấu hình Database Access
1. **Database Access** → **Add New Database User**
   - Username: `bkforum_user`
   - Password: (tự tạo mạnh)
   - Role: `Read and write to any database`

### 1.3 Cấu hình Network Access
1. **Network Access** → **Add IP Address**
2. Chọn **Allow Access from Anywhere** (`0.0.0.0/0`) cho Render

### 1.4 Lấy Connection String
1. **Connect** → **Connect your application**
2. Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/bkforum?retryWrites=true&w=majority
   ```

### 1.5 Xóa Indexes cũ (nếu cần)
```javascript
// Trong MongoDB Compass hoặc Atlas UI
db.votes.dropIndex("user_1_comment_1")
db.votes.dropIndex("user_1_post_1")
```

---

## 2️⃣ Render.com (Backend)

### 2.1 Tạo Web Service
1. Đăng nhập [Render](https://render.com)
2. **New** → **Web Service**
3. Connect GitHub repository

### 2.2 Cấu hình Build
| Setting | Value |
|---------|-------|
| **Name** | `bk-forum-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### 2.3 Environment Variables
Thêm các biến môi trường:

```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/bkforum
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=30d
```

### 2.4 Kiểm tra package.json backend
Đảm bảo có script `start`:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

### 2.5 Deploy
Click **Create Web Service** → Render tự động deploy

> **URL Backend**: `https://bk-forum-api.onrender.com`

---

## 3️⃣ Vercel (Frontend)

### 3.1 Import Project
1. Đăng nhập [Vercel](https://vercel.com)
2. **Add New** → **Project**
3. Import từ GitHub repository

### 3.2 Cấu hình Build
| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.3 Environment Variables
```env
VITE_API_URL=https://bk-forum-api.onrender.com/api
```

### 3.4 Deploy
Click **Deploy** → Vercel tự build và deploy

> **URL Frontend**: `https://bk-forum.vercel.app`

---

## 4️⃣ Post-Deployment Checklist

### ✅ Backend (Render)
- [ ] Check logs: `https://dashboard.render.com` → Service → Logs
- [ ] Test API: `https://bk-forum-api.onrender.com/api/posts`

### ✅ Frontend (Vercel)
- [ ] Check deployment: `https://vercel.com/dashboard`
- [ ] Test website load
- [ ] Test login/register

### ✅ Database (Atlas)
- [ ] Check connections in Atlas dashboard
- [ ] Verify data is being saved

---

## 5️⃣ Cấu hình CORS (Quan trọng!)

Cập nhật `backend/src/app.js` để cho phép Vercel domain:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://bk-forum.vercel.app',  // Thêm domain Vercel
    /\.vercel\.app$/  // Cho phép tất cả subdomains vercel.app
  ],
  credentials: true
};
app.use(cors(corsOptions));
```

---

## 6️⃣ File Uploads (Lưu ý)

> ⚠️ **Render Free Tier** không lưu files vĩnh viễn (ephemeral filesystem).

**Giải pháp cho production:**
1. **Cloudinary** - Free tier có 25GB
2. **AWS S3** - Pay as you go
3. **Uploadcare** - Free 3000 uploads/month

---

## 🔗 Links After Deployment

| Service | URL |
|---------|-----|
| Frontend | `https://bk-forum.vercel.app` |
| Backend API | `https://bk-forum-api.onrender.com/api` |
| Database | MongoDB Atlas Dashboard |

---

## 🐛 Troubleshooting

### Backend không start
- Check logs trong Render dashboard
- Verify `MONGO_URI` đúng format
- Ensure `npm start` script tồn tại

### CORS errors
- Thêm Vercel domain vào CORS whitelist
- Redeploy backend sau khi sửa

### Database connection failed
- Check IP whitelist trong Atlas (cần `0.0.0.0/0`)
- Verify username/password đúng
- Check connection string format

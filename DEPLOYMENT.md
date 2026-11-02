# EduPre Plus - Deployment Guide

## 1. Instant Live Link (Active Now)

Your local development instance is currently exposed online via a secure public tunnel:

- **Public URL**: `https://edupre-plus-3438.loca.lt`
- **Tunnel Password / IP**: `106.219.181.153`
  *(If the landing page asks for a tunnel password or "Tunnel IP", enter `106.219.181.153` and click "Click to Submit".)*

### Demo Credentials
| Role | Email | Password |
|---|---|---|
| **Faculty** | `faculty@edupreplus.edu` | `faculty123` |
| **Mentor** | `mentor@edupreplus.edu` | `mentor123` |
| **Admin** | `admin@edupreplus.edu` | `admin123` |
| **Student** | `student@edupreplus.edu` | `student123` |

### To Start the Tunnel Again in the Future
In your root terminal:
```bash
npm run live
```

---

## 2. Permanent 24/7 Cloud Deployment on Render (Recommended)

To host your project 24/7 in the cloud without needing your laptop to stay awake, follow these steps:

### Step 1: Create a Free MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Click **Create** and select the free **M0 (Free)** cluster.
3. In **Database Access**, create a user (e.g. `edupre_user` with a secure password).
4. In **Network Access**, click **Add IP Address** -> select **Allow Access from Anywhere (`0.0.0.0/0`)** -> Confirm.
5. In **Clusters**, click **Connect** -> **Drivers** -> Copy your connection string:
   ```
   mongodb+srv://edupre_user:<password>@cluster0.xxxxx.mongodb.net/edupre_plus?retryWrites=true&w=majority
   ```

### Step 2: Push to GitHub
If you haven't pushed this repository to GitHub yet:
```bash
git init
git add .
git commit -m "Deploy EduPre Plus full-stack"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Step 3: Deploy on Render
1. Go to [Render.com](https://render.com) and log in.
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository.
4. Render will automatically detect `render.yaml` or you can fill:
   - **Name**: `edupre-plus`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
5. In **Environment Variables**, add:
   - `MONGO_URI`: *(your MongoDB Atlas connection string from Step 1)*
   - `JWT_SECRET`: *(a random string, e.g. `super_secret_jwt_key_123`)*
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**!
7. Render will build both the frontend and backend and give you a permanent `https://<your-service>.onrender.com` link!

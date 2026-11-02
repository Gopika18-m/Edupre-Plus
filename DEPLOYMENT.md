# EduPre Plus - Production Deployment

## Live Production Links

- **Frontend (Single Public Production URL)**: *(Deploys to Vercel - see below)*
- **Backend API**: `https://edupre-plus.onrender.com`
- **Backend Health Check**: `https://edupre-plus.onrender.com/api/health`
- **Database**: MongoDB Atlas (`Cluster0` on AWS Mumbai)

---

## Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Faculty Coordinator** | `faculty@edupreplus.edu` | `faculty123` | Full dashboard, students, intervention approvals |
| **Mentor** | `mentor@edupreplus.edu` | `mentor123` | Assigned students, propose interventions, attendance |
| **Admin** | `admin@edupreplus.edu` | `admin123` | Everything + user management & system reports |
| **Student** | `student@edupreplus.edu` | `student123` | Personal progress, attendance & academic records |

---

## Deploying Frontend to Vercel

1. Go to [Vercel New Project](https://vercel.com/new).
2. Import `Gopika18-m/Edupre-Plus`.
3. Select **Root Directory**: `frontend` (or leave default root).
4. Environment Variables:
   - `VITE_API_URL` = `https://edupre-plus.onrender.com/api`
5. Click **Deploy**!

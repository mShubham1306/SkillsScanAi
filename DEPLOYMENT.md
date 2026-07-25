# 🚀 SkillScan AI — Deployment Guide

This guide walks you through deploying **SkillScan AI** to production:
- **Backend**: Deployed on [Render](https://render.com) (Node.js + Express)
- **Frontend**: Deployed on [Vercel](https://vercel.com) (Vite + React)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free Cloud Tier)

---

## 1. Prepare MongoDB Atlas (Database)

Render does not run local MongoDB. Set up a free MongoDB cloud database:

1. Sign up/log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Free Cluster** (M0).
3. Under **Database Access**, create a database user (e.g., `skillscan-user` with a strong password).
4. Under **Network Access**, click **Add IP Address** and choose `0.0.0.0/0` (Allow Access from Anywhere so Render can connect).
5. Click **Connect** -> **Drivers** -> Copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/skillscan?retryWrites=true&w=majority
   ```

---

## 2. Deploy Backend to Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`SkillScan-AI`).
4. Configure service settings:
   - **Name**: `skillscan-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add **Environment Variables**:
   | Key | Value | Description |
   | --- | --- | --- |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `GEMINI_API_KEY` | `AIzaSy...` | (Optional) Global Gemini API Key fallback |
   | `FRONTEND_URL` | `https://skillscan-ai.vercel.app` | Your Vercel domain (after step 3) |
6. Click **Create Web Service**.
7. Copy your backend URL once deployed (e.g. `https://skillscan-backend.onrender.com`).

---

## 3. Deploy Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`SkillScan-AI`).
4. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
5. Expand **Environment Variables** and add:
   | Key | Value |
   | --- | --- |
   | `VITE_API_BASE_URL` | `https://skillscan-backend.onrender.com` (Your Render Backend URL) |
6. Click **Deploy**.

---

## 4. Verification

1. Open your Vercel deployment URL (e.g. `https://skillscan-ai.vercel.app`).
2. Verify that:
   - Stats load cleanly from your Render backend.
   - Uploading a resume extracts skills, computes ATS score, and stores the resume in MongoDB Atlas.
   - Gemini AI analysis and Chatbot respond seamlessly.

🎉 **Congratulations! Your SkillScan AI app is live in production!**

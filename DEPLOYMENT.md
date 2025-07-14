# 🚀 TableTalk AI Deployment Guide

## Complete Step-by-Step Deployment to Render

### **Prerequisites**
- [x] GitHub account
- [x] Render account (free at render.com)
- [x] Your TableTalk AI code

### **Step 1: Prepare Your Code for Deployment**

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial TableTalk AI deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/tabletalk-ai.git
   git push -u origin main
   ```

### **Step 2: Deploy Backend to Render**

1. **Go to [render.com](https://render.com)** and sign in
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `tabletalk-ai-backend`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   APP_ENV=production
   PORT=10000
   APP_URL=https://your-backend-url.onrender.com
   FROM_EMAIL=noreply@tabletalk.ai
   SALES_EMAIL=sales@tabletalk.ai
   JWT_SECRET=your_secure_jwt_secret_here
   SESSION_SECRET=your_secure_session_secret_here
   
   # Email (Optional - for notifications)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

6. **Click "Create Web Service"**

### **Step 3: Add PostgreSQL Database**

1. **In your Render dashboard**, click **"New +"** → **"PostgreSQL"**
2. **Configure database**:
   - **Name**: `tabletalk-postgres`
   - **Database Name**: `tabletalk_ai`
   - **User**: `tabletalk_user`
   - **Plan**: `Free`

3. **Connect database to backend**:
   - Copy the **"External Database URL"**
   - Go to your backend service → **"Environment"**
   - Add: `DATABASE_URL=your_database_url_here`

### **Step 4: Run Database Migration**

1. **In Render backend service**, go to **"Shell"**
2. **Run migration**:
   ```bash
   npm run migrate -- --demo
   ```

### **Step 5: Deploy Frontend**

**Option A: Same Render Service (Recommended)**
1. **In your backend service**, add to environment:
   ```
   SERVE_STATIC=true
   ```
   Your frontend will be accessible at the same URL as your backend.

**Option B: Separate Static Site**
1. **Click "New +"** → **"Static Site"**
2. **Connect same GitHub repo**
3. **Configure**:
   - **Build Command**: `echo "No build needed"`
   - **Publish Directory**: `public`

### **Step 6: Test Your Deployment**

1. **Visit your backend URL**: `https://your-app.onrender.com`
2. **Test the contact form**
3. **Check health endpoint**: `https://your-app.onrender.com/health`

---

## 🔧 Alternative: Railway Deployment

### **Quick Deploy to Railway**

1. **Go to [railway.app](https://railway.app)**
2. **Click "Start a New Project"**
3. **Connect GitHub repo**
4. **Railway auto-detects Node.js**
5. **Add PostgreSQL**: Click "Add Plugin" → "PostgreSQL"
6. **Set environment variables** (same as above)
7. **Deploy!**

---

## 🌍 Alternative: Vercel + Supabase

### **Frontend on Vercel**
1. **Go to [vercel.com](https://vercel.com)**
2. **Import GitHub repo**
3. **Configure**:
   - **Framework Preset**: Static
   - **Root Directory**: `public`

### **Backend + Database on Supabase**
1. **Go to [supabase.com](https://supabase.com)**
2. **Create new project**
3. **Get database URL**
4. **Deploy backend to Render/Railway**

---

## 🔍 Debug Deployment Issues

### **Backend Not Working?**
1. **Check logs** in Render dashboard
2. **Verify environment variables**
3. **Test health endpoint**: `/health`

### **Form Not Submitting?**
1. **Open browser console** (F12)
2. **Check for API URL errors**
3. **Verify CORS settings**

### **Database Connection Errors?**
1. **Check DATABASE_URL format**
2. **Verify SSL settings**
3. **Run migration manually**

---

## 📊 Post-Deployment Checklist

- [ ] ✅ Backend health check working
- [ ] ✅ Frontend loads properly  
- [ ] ✅ Contact form submits successfully
- [ ] ✅ Database saves submissions
- [ ] ✅ Email notifications working (optional)
- [ ] ✅ Analytics endpoint accessible
- [ ] ✅ HTTPS enabled
- [ ] ✅ Custom domain configured (optional)

---

## 🎯 Production URLs

**Your deployed app will be accessible at:**
- **Frontend**: `https://your-app.onrender.com`
- **API**: `https://your-app.onrender.com/api/contact`
- **Health**: `https://your-app.onrender.com/health`
- **Analytics**: `https://your-app.onrender.com/api/contact/analytics`

## 💡 Pro Tips

1. **Custom Domain**: Add your own domain in Render settings
2. **Monitoring**: Enable Render health checks
3. **Scaling**: Upgrade to paid plan for better performance
4. **Backups**: Enable automatic database backups
5. **SSL**: Automatic HTTPS with Render

**🎉 Your TableTalk AI app will be live and accessible worldwide!** 
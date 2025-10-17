# NextNest Deployment Guide

## 🚀 Quick Setup Commands

### **Fix Security Issues & Test Locally**
```powershell
# Fix Next.js security vulnerability
npm audit fix --force

# Start development server
npm run dev
```

Visit http://localhost:3000 to view the application.

---

## 🚂 Railway Deployment

### **Prerequisites**
1. Railway account (https://railway.app)
2. Git repository
3. Railway CLI (optional)

### **Deployment Steps**

#### **Option 1: Railway Dashboard (Recommended)**
1. **Connect Repository**
   - Go to Railway dashboard
   - Click "New Project"
   - Connect your GitHub repository
   - Select the NextNest repository

2. **Configure Build Settings**
   - Railway will auto-detect Next.js
   - Build command: `npm run build`
   - Start command: `npm start`
   - Port: `3000` (auto-configured)

3. **Environment Variables**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_SITE_URL=https://your-app.railway.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Railway will build and deploy automatically

#### **Option 2: Railway CLI**
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### **Railway Configuration Files**
- `railway.toml` - Railway-specific configuration
- `Procfile` - Process configuration
- `.env.example` - Environment variables template

---

## 🌐 Localhost Development

### **Setup**
```powershell
# Install dependencies
npm install

# Fix security vulnerabilities
npm audit fix --force

# Start development server
npm run dev
```

### **Available Scripts**
```powershell
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # Code linting
```

### **Development Workflow**
1. Make changes to code
2. Hot reload automatically updates browser
3. Test functionality locally
4. Commit and push to trigger Railway deployment

---

## 🔧 Environment Configuration

### **Local Development (.env.local)**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **Production (Railway)**
```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-app.railway.app
PORT=3000
```

### **Optional Integrations**
```env
# Database
DATABASE_URL=your_database_connection

# Email Service
EMAIL_SERVICE_API_KEY=your_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

---

## 📋 Pre-Deployment Checklist

### **Code Quality**
- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run build` - Successful build
- [ ] Test all pages and functionality locally
- [ ] Verify responsive design on mobile/desktop

### **Security**
- [ ] Run `npm audit fix` - No critical vulnerabilities
- [ ] Environment variables properly configured
- [ ] No hardcoded secrets in code

### **Performance**
- [ ] Images optimized
- [ ] Bundle size acceptable
- [ ] Core Web Vitals passing

### **Functionality**
- [ ] Contact form submits successfully
- [ ] Mortgage calculator works correctly
- [ ] Navigation links functional
- [ ] API endpoints responding

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Build Failures**
```powershell
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Port Issues (Railway)**
- Railway automatically assigns PORT environment variable
- Next.js uses `process.env.PORT || 3000`
- No manual port configuration needed

#### **Environment Variables Not Loading**
- Check file naming: `.env.local` for local, Railway dashboard for production
- Restart development server after changes
- Verify variable names (NEXT_PUBLIC_ prefix for client-side)

#### **API Routes Not Working**
- Verify file structure: `app/api/[route]/route.ts`
- Check HTTP method exports (GET, POST, etc.)
- Test with tools like Postman or browser dev tools

### **Performance Optimization**
```powershell
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

### **Debugging**
```powershell
# Enable debug mode
DEBUG=* npm run dev

# Check logs in Railway
railway logs
```

---

## 🔄 Continuous Deployment

### **Automatic Deployment**
1. Push to main branch
2. Railway detects changes
3. Automatic build and deployment
4. Live site updates

### **Manual Deployment**
```powershell
# Using Railway CLI
railway up

# Or redeploy from dashboard
# Go to Railway dashboard → Your project → Deploy
```

---

## 📊 Monitoring

### **Railway Dashboard**
- Deployment status
- Build logs
- Runtime metrics
- Custom domains

### **Application Monitoring**
- Check `/api/contact` endpoint functionality
- Monitor form submissions
- Verify calculator accuracy
- Test responsive design

### **Performance Metrics**
- Page load times
- Core Web Vitals
- Error rates
- User interactions

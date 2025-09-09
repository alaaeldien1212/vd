# Vercel Deployment Guide

This guide will help you deploy the Vendor Milestone Management System to Vercel.

## 🚀 Quick Deployment

### Option 1: Deploy with Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? `Your account`
   - Link to existing project? `N`
   - Project name: `vendor-milestone-management-system`
   - Directory: `./`
   - Override settings? `N`

### Option 2: Deploy via Vercel Dashboard

1. **Connect GitHub Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the project directory

2. **Configure Build Settings**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

## 🔧 Environment Variables

Add these environment variables in your Vercel project settings:

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://gbnmunfdgdnvlzcabyxf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdibm11bmZkZ2Rudmx6Y2FieXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTg5OTIsImV4cCI6MjA3Mjk3NDk5Mn0.dW5qalrprjBpW-A1SjKQ72dU-99JErIawkOuqHnVSBI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdibm11bmZkZ2Rudmx6Y2FieXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM5ODk5MiwiZXhwIjoyMDcyOTc0OTkyfQ.kMtYWVEBHqDjCZyHIHUMsE8zck-IzibEeHtgc5bWhXM
JWT_SECRET=ZRETyZEelQiukEh3AvUmzFoC6j6Ezxw5bt3gizeeaq9LGbWUInEFAMXZekLbN6ytnvJ4fcfBqWdYCw/PCieT5w==
```

### Optional Variables

```env
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Riyadh
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png,txt
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
ENCRYPTION_KEY=your_encryption_key_for_file_hashes
```

## 🗄️ Database Setup

After deployment, set up your Supabase database:

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase**
   ```bash
   supabase init
   ```

3. **Link to your project**
   ```bash
   supabase link --project-ref gbnmunfdgdnvlzcabyxf
   ```

4. **Run migrations**
   ```bash
   supabase db push
   ```

5. **Create admin user**
   ```bash
   node setup-admin.js
   ```

## 🔍 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Domain configured (if custom)
- [ ] SSL certificate active
- [ ] Application accessible
- [ ] Login functionality working
- [ ] Database connections working

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (requires 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify Supabase credentials are correct

3. **Database Connection**
   - Verify Supabase project is active
   - Check RLS policies are configured
   - Ensure migrations are applied

4. **Authentication Issues**
   - Check Supabase Auth settings
   - Verify redirect URLs are configured
   - Check JWT secret is set

### Debug Commands

```bash
# Check build locally
npm run build

# Type check
npm run type-check

# Lint code
npm run lint

# Test database connection
npx supabase status
```

## 📊 Monitoring

After deployment, monitor:

- **Vercel Analytics**: Performance metrics
- **Supabase Dashboard**: Database usage
- **Application Logs**: Error tracking
- **User Activity**: Authentication logs

## 🔄 Updates

To update your deployment:

1. **Push changes to GitHub**
2. **Vercel auto-deploys** (if connected)
3. **Or manually deploy**: `vercel --prod`

## 🛡️ Security

- Enable Vercel Security Headers
- Configure Supabase RLS policies
- Set up proper CORS settings
- Use environment variables for secrets
- Regular security updates

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console for errors
4. Verify environment variables
5. Test locally first

---

**Your Vendor Milestone Management System is now live on Vercel! 🎉**

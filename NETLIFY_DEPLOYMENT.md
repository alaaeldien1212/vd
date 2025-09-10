# Netlify Deployment Guide

This guide will help you deploy the Vendor Milestone Management System to Netlify.

## 🚀 Quick Deployment

### Option 1: Deploy via Netlify Dashboard

1. **Prepare your repository**
   - Ensure all code is committed to your Git repository
   - Push changes to your main branch

2. **Connect to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Choose your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your repository

3. **Configure Build Settings**
   - Build command: `npm run build:static`
   - Publish directory: `out`
   - Node version: `18`

### Option 2: Deploy with Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy from project directory**
   ```bash
   # Build the project first
   npm run build:static
   
   # Deploy to Netlify
   netlify deploy --prod --dir=out
   ```

## 🔧 Environment Variables

Add these environment variables in your Netlify project settings:

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://gbnmunfdgdnvlzcabyxf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdibm11bmZkZ2Rudmx6Y2FieXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTg5OTIsImV4cCI6MjA3Mjk3NDk5Mn0.dW5qalrprjBpW-A1SjKQ72dU-99JErIawkOuqHnVSBI
```

### Optional Variables

```env
NEXT_PUBLIC_APP_URL=https://your-app-name.netlify.app
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Riyadh
```

## 📁 Build Configuration

The project is configured for static export with the following settings:

- **Output**: Static export (`output: 'export'` in `next.config.js`)
- **Images**: Unoptimized for static hosting
- **Trailing Slash**: Enabled for better routing
- **Redirects**: Configured in `public/_redirects` for SPA routing

## 🗄️ Database Setup

After deployment, ensure your Supabase database is properly configured:

1. **Verify Supabase Project**
   - Check that your Supabase project is active
   - Verify RLS policies are configured
   - Ensure migrations are applied

2. **Test Database Connection**
   - Visit your deployed site
   - Check browser console for any connection errors
   - Verify authentication works

## 🔍 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Site accessible via Netlify URL
- [ ] Database connections working
- [ ] Authentication functional
- [ ] All pages loading correctly
- [ ] Mobile responsiveness working
- [ ] SSL certificate active

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
   - Ensure CORS settings allow your domain

4. **Routing Issues**
   - Check `_redirects` file is present
   - Verify SPA routing is working
   - Test direct URL access

### Debug Commands

```bash
# Check build locally
npm run build:static

# Type check
npm run type-check

# Lint code
npm run lint

# Test locally
npm run dev
```

## 📊 Monitoring

After deployment, monitor:

- **Netlify Analytics**: Traffic and performance metrics
- **Supabase Dashboard**: Database usage and performance
- **Browser Console**: Client-side errors
- **Netlify Functions**: Server-side logs (if using)

## 🔄 Updates

To update your deployment:

1. **Push changes to Git**
2. **Netlify auto-deploys** (if connected to Git)
3. **Or manually deploy**: `netlify deploy --prod --dir=out`

## 🛡️ Security

- Enable Netlify Security Headers
- Configure Supabase RLS policies
- Set up proper CORS settings
- Use environment variables for secrets
- Regular security updates

## 📞 Support

If you encounter issues:

1. Check Netlify deployment logs
2. Review Supabase logs
3. Check browser console for errors
4. Verify environment variables
5. Test locally first

## 🎯 Performance Optimization

- Enable Netlify's CDN
- Configure caching headers
- Optimize images (consider using Netlify's image optimization)
- Enable compression
- Use Netlify's edge functions for dynamic features

---

**Your Vendor Milestone Management System is now live on Netlify! 🎉**

## 📝 Notes

- Dynamic routes (`/projects/[id]`, `/vendor/[token]`) are temporarily disabled for static export
- To enable dynamic routes, consider using Netlify Functions or switching to a different hosting platform
- The application is fully functional for static pages and can be enhanced with serverless functions as needed

#!/bin/bash

# Vendor Milestone Management System - Deployment Script
# This script helps deploy the application to Vercel

echo "🚀 Vendor Milestone Management System - Deployment Script"
echo "========================================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel first:"
    vercel login
fi

echo "📦 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

echo "🚀 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Run database migrations: npx supabase db push"
echo "3. Create admin user: node setup-admin.js"
echo "4. Test the application"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"

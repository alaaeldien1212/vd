# Vendor Milestone Management System (VMMS)

A secure, auditable Vendor Milestone Management System for enterprise project management with real-time tracking, approval workflows, and comprehensive audit trails.

## 🚀 Features

- **Project Management**: Create and manage projects with milestones and dependencies
- **Vendor Portal**: Secure token-based access for vendor submissions
- **Approval Workflows**: Multi-level approval with SLA tracking
- **Real-time Dashboard**: Portfolio-wide progress monitoring
- **Audit Trails**: Comprehensive logging and compliance tracking
- **Internationalization**: English and Arabic support
- **Role-based Access**: Admin, Project Manager, Vendor, Client roles

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **Internationalization**: i18next

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd vendor-milestone-management-system
npm install
```

### 2. Environment Setup

Copy the environment file and configure your variables:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### 3. Database Setup

Run the database migrations:

```bash
npx supabase db push
```

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 5. Default Login

- **Email**: `admin@acme.com`
- **Password**: `admin123`

## 🚀 Vercel Deployment

### 1. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/vendor-milestone-management-system)

### 2. Environment Variables

Add these environment variables in your Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gbnmunfdgdnvlzcabyxf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=ZRETyZEelQiukEh3AvUmzFoC6j6Ezxw5bt3gizeeaq9LGbWUInEFAMXZekLbN6ytnvJ4fcfBqWdYCw/PCieT5w==
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Riyadh
```

### 3. Database Migration

After deployment, run the database migration:

```bash
npx supabase db push
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility functions
├── supabase/              # Database migrations
├── types/                 # TypeScript types
└── public/                # Static assets
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Run the migration script in `supabase/migrations/`
3. Set up Row Level Security (RLS) policies
4. Configure authentication settings

### Vercel Configuration

The project includes optimized Vercel configuration:

- `vercel.json`: Deployment settings
- `next.config.js`: Next.js optimization
- Security headers and performance optimizations

## 🛡 Security Features

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control
- **File Security**: Virus scanning, type validation, checksum verification
- **Audit Logging**: Comprehensive activity tracking
- **Data Encryption**: AES-256 encryption for sensitive data

## 🌐 Internationalization

- **Languages**: English, Arabic
- **Timezone**: Asia/Riyadh (UTC+3)
- **RTL Support**: Full right-to-left layout support

## 📊 Monitoring & Analytics

- Real-time dashboard with project statistics
- Milestone progress tracking
- Overdue items monitoring
- Vendor performance metrics
- Audit trail exports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔄 Updates

Stay updated with the latest features and security patches by:

- Watching the repository
- Following release notes
- Updating dependencies regularly

---

**Built with ❤️ for enterprise project management**
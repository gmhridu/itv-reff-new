# 🎬 VideoTask Rewards Platform

A modern video task rewards platform built with Next.js, TypeScript, and Prisma. Users can earn rewards by watching videos, refer friends, and manage their earnings through a comprehensive dashboard.

## 🌟 Features

### 👤 User Management
- **User Registration & Authentication** - Secure JWT-based authentication
- **Profile Management** - Complete user profile with verification status
- **Referral System** - Earn bonuses by referring friends with unique codes
- **Multi-tier User Status** - Active, Suspended, and Banned user states

### 🎬 Video Task System
- **Daily Video Limits** - Configurable daily video watching limits per plan
- **Reward Tracking** - Automatic reward calculation and distribution
- **Anti-cheat Protection** - IP and device verification for task completion
- **Video Management** - Admin-controlled video content with scheduling

### 💰 Wallet & Payments
- **Digital Wallet** - Track earnings and balance in real-time
- **Transaction History** - Complete audit trail of all transactions
- **Withdrawal System** - Multiple payment methods for earnings withdrawal
- **Plan Subscriptions** - Flexible subscription plans with different reward rates

### 🔧 Admin Features
- **Admin Dashboard** - Comprehensive admin panel for platform management
- **User Management** - Monitor and manage user accounts and activities
- **Plan Management** - Create and modify subscription plans
- **Withdrawal Processing** - Review and process user withdrawal requests

## ✨ Technology Stack

### 🎯 Core Framework
- **⚡ Next.js 15** - React framework with App Router and custom server
- **📘 TypeScript 5** - Type-safe development with strict configuration
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode support

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation with runtime checking

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client for API communication

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 Custom JWT Auth** - Secure authentication with bcrypt password hashing
- **🔌 Socket.IO** - Real-time communication for live updates

### 🎨 Advanced Features
- **📊 TanStack Table** - Headless UI for building data tables
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Chart library for data visualization
- **🖼️ Sharp** - High performance image processing

### 🛡️ Security & Utilities
- **🛡️ Security Middleware** - Rate limiting, IP tracking, and fraud detection
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm** or **yarn** - Package manager (npm comes with Node.js)
- **Git** - Version control system

### 1. Clone the Repository

```bash
git clone <repository-url>
cd itv-reff
```

### 2. Environment Setup

Copy the environment example file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL="file:./db/custom.db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# Application Settings
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Security Settings (Optional)
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=3600000
```

### 3. Database Setup

Initialize and set up the database:

```bash
# Generate Prisma client
npm run db:generate

# Push database schema (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 6. Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
├── prisma/
│   └── schema.prisma           # Database schema definition
├── public/
│   ├── logo.svg               # Application logo
│   └── robots.txt             # SEO robots configuration
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── dashboard/    # Dashboard data endpoints
│   │   │   ├── plans/        # Subscription plan endpoints
│   │   │   ├── videos/       # Video management endpoints
│   │   │   ├── wallet/       # Wallet and transaction endpoints
│   │   │   └── withdrawals/  # Withdrawal request endpoints
│   │   ├── dashboard/        # User dashboard pages
│   │   ├── plans/           # Subscription plan pages
│   │   ├── videos/          # Video task pages
│   │   ├── wallet/          # Wallet management pages
│   │   ├── withdraw/        # Withdrawal pages
│   │   ├── layout.tsx       # Root layout component
│   │   └── page.tsx         # Landing page with auth
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utility functions and configurations
│       ├── auth.ts          # Authentication utilities
│       ├── db.ts            # Database connection
│       ├── middleware.ts    # Authentication middleware
│       ├── security.ts      # Security utilities
│       ├── socket.ts        # Socket.IO configuration
│       └── utils.ts         # General utilities
├── examples/
│   └── websocket/           # WebSocket example implementation
├── server.ts                # Custom Next.js server with Socket.IO
├── package.json             # Dependencies and scripts
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── components.json          # shadcn/ui configuration
└── .env.example            # Environment variables template
```

## 🎨 Available Features & Components

### 🧩 UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch, Tabs
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Overlay**: Dialog, Sheet, Popover, Tooltip, Hover Card
- **Data Display**: Badge, Avatar, Calendar, Accordion

### 📊 Data Management Features
- **Tables**: Powerful data tables with sorting, filtering, pagination (TanStack Table)
- **Charts**: Beautiful visualizations with Recharts for analytics
- **Forms**: Type-safe forms with React Hook Form + Zod validation
- **Real-time Updates**: Socket.IO integration for live data

### 🎨 Interactive Features
- **Animations**: Smooth micro-interactions with Framer Motion
- **Drag & Drop**: Modern drag-and-drop functionality with DND Kit
- **Theme Switching**: Built-in dark/light mode support
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Built-in protection against abuse
- **Security Headers**: Comprehensive security middleware
- **Session Management**: Secure session handling with cookies

### 🗄️ Database Features
- **Prisma ORM**: Type-safe database operations
- **SQLite Database**: Lightweight database for development
- **Migrations**: Database schema versioning
- **Relationships**: Complex data relationships with foreign keys
- **Transactions**: ACID-compliant database transactions

### 🌍 Production Features
- **Custom Server**: Next.js with custom server for Socket.IO
- **Image Optimization**: Automatic image processing with Sharp
- **Type Safety**: End-to-end TypeScript with strict configuration
- **Error Handling**: Comprehensive error handling and logging
- **Performance**: Optimized builds and caching strategies

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm start              # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push        # Push schema changes to database (dev)
npm run db:migrate     # Run database migrations (prod)
npm run db:reset       # Reset database and run migrations

# Code Quality
npm run lint           # Run ESLint for code quality checks
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/plan` - Get user subscription plan

### Video Tasks
- `GET /api/videos` - Get available videos
- `POST /api/videos/[id]/watch` - Mark video as watched
- `GET /api/videos/[id]` - Get video details

### Wallet & Transactions
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/withdrawals` - Request withdrawal

### Plans & Referrals
- `GET /api/plans` - Get available subscription plans
- `POST /api/plans/subscribe` - Subscribe to a plan
- `GET /api/referral/code` - Get user referral code
- `GET /api/referral/stats` - Get referral statistics

## 🔒 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="file:./db/custom.db"

# JWT Authentication (REQUIRED)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"

# Application Settings
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Security Settings (Optional)
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=3600000

# Socket.IO Settings (Optional)
SOCKET_IO_PATH="/api/socketio"
```

## 🚀 Deployment

### Production Environment

1. **Set Environment Variables**:
   ```env
   NODE_ENV="production"
   DATABASE_URL="your-production-database-url"
   JWT_SECRET="your-production-jwt-secret"
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

2. **Build and Start**:
   ```bash
   npm run build
   npm start
   ```

### Docker Deployment

The application includes Docker support for easy deployment:

1. **Using Docker Compose (Recommended)**:
   ```bash
   # For production with PostgreSQL database
   docker-compose up -d
   
   # For development with SQLite database
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Using Docker only**:
   ```bash
   # Build the image
   docker build -t itv-reff-new .
   
   # Run the container
   docker run -p 3000:3000 itv-reff-new
   ```

See [DOCKER_COMPOSE.md](docs/DOCKER_COMPOSE.md) for detailed instructions on using the Docker Compose configurations.

### Database Migration

For production deployments, use migrations instead of `db:push`:

```bash
# Create migration
npx prisma migrate dev --name init

# Deploy migrations to production
npx prisma migrate deploy
```

## 🛠️ Development

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma` and run migrations
2. **API Routes**: Add new routes in `src/app/api/`
3. **UI Components**: Create components in `src/components/`
4. **Pages**: Add new pages in `src/app/`

### Security Considerations

- Always validate input data with Zod schemas
- Use the security middleware for sensitive endpoints
- Implement proper rate limiting for public APIs
- Keep JWT secrets secure and rotate them regularly
- Monitor for suspicious activities and implement logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for modern web development. Ready for production deployment! 🚀

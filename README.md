<div align="center">

# 🏛️ Kosh — Your Digital Treasury

### *Track every rupee. Own your financial story.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://expense-tracker-spring-boot-and-rea.vercel.app/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Project Overview

**Kosh** (Hindi: *कोश* — treasury/vault) is a full-stack personal finance management platform designed to give individuals complete, real-time visibility into their financial health. Built with a production-grade Spring Boot backend and a responsive React frontend, Kosh solves the everyday problem of fragmented, manual expense tracking by offering a centralized, intelligent, and beautiful digital treasury.

> **Why Kosh?** Most finance apps are either too simple (basic spreadsheets) or too complex (enterprise accounting tools). Kosh sits at the sweet spot — powerful enough to generate professional PDF statements and email them, yet clean enough for daily casual use.

**Core problems it solves:**
- 🗂️ Scattered, hard-to-query transaction history
- 📉 No clear picture of spending patterns by category
- 📬 Manual, error-prone report generation for monthly reviews
- ⏰ Forgetting to log daily financial activity

---

## 🌐 Live Demo

| Resource | Link |
|---|---|
| 🚀 **Live Application** | [expense-tracker-spring-boot-and-rea.vercel.app](https://expense-tracker-spring-boot-and-rea.vercel.app/) |
| 🔧 **Backend API** | Hosted on [Render](https://render.com) |
| 🗄️ **Database** | Neon Serverless PostgreSQL |

### 🔑 Test Credentials

> [!IMPORTANT]
> The backend is hosted on Render's **free tier** and may take 30–60 seconds to wake up on the first request. Please be patient after the first login attempt.

| Role | Username | Password | Access |
|---|---|---|---|
| 👤 **Regular User** | `demo` | `demo123` | Dashboard, Transactions, Reports |
| 🛡️ **Admin** | `admin` | `admin123` | All user data, Admin Dashboard |

> [!TIP]
> You can also **register a new account** directly from the landing page to experience the full onboarding flow.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔒 **Secure JWT Authentication** | Stateless JWT-based login and registration. Separate Admin/User role hierarchy. BCrypt password hashing. Google OAuth2 sign-in support. |
| 📊 **Interactive Dashboard** | Real-time KPIs (Total Income, Expenses, Net Balance). Paginated transaction feed with filters. Daily activity calendar heatmap. Category donut/radial charts via Recharts. |
| 📄 **Smart Statement Reports** | Filter transactions by custom date ranges. Download professionally formatted **PDF reports** (iText 7 / OpenPDF). Directly **email reports** to your inbox via SMTP. |
| 🔔 **Automated Daily Reminders** | Scheduled backend tasks (`@Scheduled`) send email reminders if no transaction was logged for the day. |
| 💡 **AI Insights** | Intelligent spending insights and recommendations via the dedicated Insights page. |
| 📁 **CSV Import / Export** | Bulk-import historical transactions via CSV. Export your data anytime. |
| 💰 **Budget & Category Caps** | Set monthly spending caps per category. Get warned when approaching or exceeding limits. |
| 🎯 **Savings Goals** | Create and track savings goals with progress visualization. |
| 👥 **Group Expenses** | Split and manage shared expenses with other users. |
| 🌗 **Dark Mode & Responsive UI** | Glassmorphism-styled dark-first UI, fully responsive across desktop and mobile. |
| 🔍 **Audit Trail** | Full transaction revision history powered by Spring Data Envers. |

---

## 🏗️ Tech Stack & Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│              React 18 + Tailwind CSS + Recharts                 │
│                    Hosted on ▲ Vercel                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │  HTTPS / REST (JWT Bearer Token)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Spring Boot 3.2.4)                 │
│   Spring Security · Spring Data JPA · JavaMailSender · iText   │
│                    Hosted on ● Render                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │  JDBC / JPA
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE (Neon Serverless PostgreSQL)           │
│    users · transactions · budgets · savings_goals · groups      │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Breakdown

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React.js | 18 | Component-based UI |
| **Styling** | Tailwind CSS | 3 | Utility-first responsive design |
| **Charts** | Recharts | Latest | KPI graphs, donut/radial charts |
| **Icons** | Lucide React | Latest | Consistent icon system |
| **Routing** | React Router DOM | v6 | Client-side navigation |
| **Notifications** | React Toastify | Latest | Toast notification system |
| **Frontend Host** | Vercel | — | CDN-backed static deployment |
| **Backend Framework** | Spring Boot | 3.2.4 | REST API and business logic |
| **Language** | Java | 17 | Backend runtime |
| **Security** | Spring Security + JWT | JJWT 0.11.5 | Authentication and authorization |
| **OAuth2** | Google OAuth2 Client | 2.6.0 | Social login |
| **ORM** | Spring Data JPA / Hibernate | — | Database abstraction |
| **Audit** | Spring Data Envers | — | Revision history tracking |
| **PDF Generation** | iText 7 / OpenPDF | 7.2.5 / 1.3.30 | Report generation |
| **Email** | Spring Boot Mail (Jakarta Mail) | — | SMTP email delivery |
| **CSV** | OpenCSV | 5.9 | Import/export support |
| **SMS** | Twilio SDK | 9.14.1 | Notification channel |
| **Code Gen** | Lombok | 1.18.38 | Boilerplate reduction |
| **Build Tool** | Maven | — | Dependency and build management |
| **Backend Host** | Render | — | Cloud backend deployment |
| **Database** | Neon PostgreSQL | — | Serverless Postgres |
| **Containerization** | Docker / Docker Compose | — | Local multi-service setup |

---

## 🚀 Getting Started — Local Setup

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Java JDK | 17+ | [adoptium.net](https://adoptium.net/) |
| Maven | 3.8+ | [maven.apache.org](https://maven.apache.org/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | Bundled with Node.js |
| PostgreSQL | 15+ (or Neon) | [neon.tech](https://neon.tech/) |

---

<details>
<summary><strong>⚙️ Step 1 — Clone the Repository</strong></summary>

```bash
git clone https://github.com/your-username/Expense_Tracker-Spring-boot-And-React-.git
cd Expense_Tracker-Spring-boot-And-React-
```

</details>

---

<details>
<summary><strong>🗄️ Step 2 — Database Setup</strong></summary>

**Option A: Use Neon (Recommended — Free Serverless Postgres)**

1. Create a free account at [neon.tech](https://neon.tech/)
2. Create a new project and database
3. Copy the JDBC connection string — you will need it in Step 3

**Option B: Local PostgreSQL**

```sql
-- Run in psql or pgAdmin
CREATE DATABASE finance_db;
```

Then run the included SQL scripts:

```bash
psql -U postgres -d finance_db -f create_users_table.sql
psql -U postgres -d finance_db -f create_savings_goals_table.sql
psql -U postgres -d finance_db -f create_envers_audit_tables.sql
```

> Spring Boot will auto-create and update tables on startup via `spring.jpa.hibernate.ddl-auto=update`.

</details>

---

<details>
<summary><strong>🔧 Step 3 — Backend Configuration and Startup</strong></summary>

**1. Create `src/main/resources/application.properties`**

```properties
# ── Database ───────────────────────────────────────────────────
spring.datasource.url=jdbc:postgresql://<your-neon-host>/<your-db>?sslmode=require
spring.datasource.username=<db-username>
spring.datasource.password=<db-password>
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# ── JWT ────────────────────────────────────────────────────────
app.jwtSecret=<your-256-bit-secret-key>
app.jwtExpirationMs=86400000

# ── SMTP Email ─────────────────────────────────────────────────
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=<your-gmail-address>
spring.mail.password=<your-gmail-app-password>
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# ── CORS / Origins ─────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# ── Google OAuth2 ──────────────────────────────────────────────
app.googleClientId=<your-google-client-id>

# ── Server ─────────────────────────────────────────────────────
server.port=8080
```

> [!WARNING]
> Never commit `application.properties` with real credentials. Add it to `.gitignore` or use environment variables on your hosting platform.

**2. Build and run the backend**

```bash
# Linux / macOS
./mvnw clean spring-boot:run

# Windows (PowerShell)
.\mvnw.cmd clean spring-boot:run
```

**Expected output:**

```
Tomcat started on port(s): 8080 (http)
Started FinanceTrackerApplication in 8.xxx seconds
```

</details>

---

<details>
<summary><strong>⚛️ Step 4 — Frontend Setup and Startup</strong></summary>

**1. Navigate to the frontend directory**

```bash
cd frontend
```

**2. Create a `.env` file in `frontend/`**

```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_GOOGLE_CLIENT_ID=<your-google-client-id>
```

**3. Install dependencies and start the dev server**

```bash
npm install
npm start
```

**Expected output:**

```
Compiled successfully!

You can now view personal-finance-tracker-frontend in the browser.
  Local:   http://localhost:3001
```

</details>

---

<details>
<summary><strong>🐳 Step 5 (Optional) — Run with Docker Compose</strong></summary>

Run the backend and a local Postgres instance together in one command:

```bash
docker-compose up --build
```

This starts:
- `backend` service on port `8080`
- `postgres` service on port `5432`

> Ensure Docker Desktop is running before executing this command.

</details>

---

## 🔐 Environment Variables Reference

### Backend — `application.properties`

| Variable | Description | Example |
|---|---|---|
| `spring.datasource.url` | JDBC connection string | `jdbc:postgresql://host/db?sslmode=require` |
| `spring.datasource.username` | Database username | `neondb_owner` |
| `spring.datasource.password` | Database password | `••••••••` |
| `app.jwtSecret` | Secret key for signing JWTs (min 256-bit) | `change-me-to-long-random-string` |
| `app.jwtExpirationMs` | JWT token lifetime in milliseconds | `86400000` (24 h) |
| `spring.mail.host` | SMTP server host | `smtp.gmail.com` |
| `spring.mail.port` | SMTP server port | `587` |
| `spring.mail.username` | SMTP sender email address | `yourapp@gmail.com` |
| `spring.mail.password` | SMTP app password | `••••••••` |
| `ALLOWED_ORIGINS` | Comma-separated CORS-allowed origins | `https://yourapp.vercel.app` |
| `app.googleClientId` | Google OAuth2 Client ID | `884510...apps.googleusercontent.com` |

> [!TIP]
> For Gmail SMTP, enable **2-Factor Authentication** and generate an **App Password** from Google Account Security. Do **not** use your regular Gmail password.

### Frontend — `frontend/.env`

| Variable | Description | Example |
|---|---|---|
| `REACT_APP_API_BASE_URL` | Base URL of the Spring Boot backend | `https://your-app.onrender.com` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | `884510...apps.googleusercontent.com` |

---

## 📡 API Endpoints Reference

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <JWT>` in the request header.

### 🔑 Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | ❌ | Register a new user account |
| `POST` | `/api/auth/login` | ❌ | Login and receive a JWT token |
| `POST` | `/api/auth/google` | ❌ | Authenticate via Google OAuth2 ID token |
| `GET` | `/api/auth/ping` | ❌ | Health check / wake up the backend |

### 💸 Transactions — `/api/transactions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/transactions` | ✅ | List all transactions (filterable by `month`, `year`, `category`, `startDate`, `endDate`) |
| `POST` | `/api/transactions` | ✅ | Create a new transaction |
| `PUT` | `/api/transactions/{id}` | ✅ | Update an existing transaction |
| `DELETE` | `/api/transactions/{id}` | ✅ | Delete a transaction |
| `GET` | `/api/transactions/summary` | ✅ | Monthly income vs expense summary |
| `GET` | `/api/transactions/category-totals` | ✅ | Spending totals grouped by category |
| `GET` | `/api/transactions/daily-spending` | ✅ | Daily spending breakdown |
| `GET` | `/api/transactions/{id}/history` | ✅ | Full audit/revision history for a transaction |

### 📄 Reports — `/api/reports`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reports/download` | ✅ | Download PDF report for a date range |
| `POST` | `/api/reports/send-email` | ✅ | Email PDF report to the authenticated user |

### 💰 Budgets and Categories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/budgets` | ✅ | Get all budgets for the user |
| `POST` | `/api/budgets` | ✅ | Create or update a monthly budget |
| `GET` | `/api/categories` | ✅ | Get all available categories |
| `POST` | `/api/category-cap` | ✅ | Set a spending cap for a category |

### 🎯 Savings Goals — `/api/savings-goals`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/savings-goals` | ✅ | List all savings goals |
| `POST` | `/api/savings-goals` | ✅ | Create a new savings goal |
| `PUT` | `/api/savings-goals/{id}` | ✅ | Update a savings goal |
| `DELETE` | `/api/savings-goals/{id}` | ✅ | Delete a savings goal |

### 📥 Import / Export

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/import/csv` | ✅ | Bulk import transactions from a CSV file |
| `GET` | `/api/export/csv` | ✅ | Export all transactions as CSV |

### 🛡️ Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | ✅ Admin | List all registered users |
| `DELETE` | `/api/admin/users/{id}` | ✅ Admin | Delete a user account |
| `GET` | `/api/admin/stats` | ✅ Admin | Platform-wide usage statistics |

---

## 📁 Project Structure

```
Expense_Tracker-Spring-boot-And-React-/
├── src/main/java/com/financetracker/
│   ├── config/          # Security, CORS, AOP configuration
│   ├── controller/      # 15 REST API controllers
│   ├── dto/             # Data Transfer Objects
│   ├── entity/          # JPA entities (User, Transaction, Budget…)
│   ├── exception/       # Custom exception classes
│   ├── repository/      # Spring Data JPA repositories
│   ├── security/        # JWT TokenProvider, UserDetailsService
│   ├── service/         # Business logic layer
│   └── task/            # Scheduled tasks (daily reminders)
│
├── frontend/src/
│   ├── components/      # React components (Dashboard, Login, Charts…)
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service layer
│   ├── styles/          # Component-level CSS files
│   ├── utils/           # Helper utilities
│   ├── App.js           # Root component and routing
│   └── api.js           # Axios instance configuration
│
├── docker-compose.yml   # Multi-container local setup
├── Dockerfile           # Backend container definition
├── pom.xml              # Maven dependencies
└── SETUP_GUIDE.md       # Detailed local development guide
```

---

## 🤝 Contributing

Contributions are welcome!

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 👨‍💻 Author and License

**Built with ❤️ as a Full-Stack Development Mini Project**

| | |
|---|---|
| 🌐 **Live App** | [expense-tracker-spring-boot-and-rea.vercel.app](https://expense-tracker-spring-boot-and-rea.vercel.app/) |
| 📧 **Contact** | [Open an Issue](https://github.com/your-username/Expense_Tracker-Spring-boot-And-React-/issues) |

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

*If you found this useful, please consider giving it a ⭐ on GitHub!*

</div>

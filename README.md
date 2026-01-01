# Suzana Education Center - School Management System

A comprehensive MERN stack school management system for managing students, staff, grades, attendance, and finances.

## 🎓 About

Suzana Education Center & School was established in May 2025 to provide quality, child-centered education. Located in Mapera Center, Migori County, Kenya.

**Motto:** Discipline • Integrity • Teamwork

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
```bash
cd suzana-hub
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Set up environment variables**

The server `.env` file is already configured with your MongoDB Atlas connection.

5. **Seed the database**
```bash
cd ../server
node seed.js
```

6. **Start the development servers**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Default Login Credentials
- **Username:** admin
- **Password:** 12345678

## 📦 Features

### User Roles
| Role | Permissions |
|------|-------------|
| Admin | Full access, can delete records |
| Head Teacher | Manage students, grades, fees, attendance |
| Teacher | View classes, mark attendance |

### Modules

1. **Dashboard** - Overview stats based on user role
2. **Student Management** - Registration, profiles, search/filter
3. **Staff Management** - Employee records and management
4. **Grades & Classes** - Grade creation, classroom capacity management
5. **Schedule** - Daily timetable (08:00 - 15:30)
6. **Attendance** - Mark Present/Absent/Late
7. **Finance** - Fee management, payment processing

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT

## 📁 Project Structure

```
suzana-hub/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context (Auth)
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   └── public/             # Static assets
│
├── server/                 # Node.js Backend
│   ├── config/             # Database config
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth middleware
│   ├── models/             # MongoDB schemas
│   └── routes/             # API routes
│
└── README.md
```

## 🎨 Color Scheme

- **Primary (Maroon):** #722F37
- **Secondary (Gold):** #D4A84B
- **Accent (Navy):** #1E3A5F

## 📞 Contact

Suzana Education Center & School  
Mapera Center, Suna East, Migori County, Kenya

---

© 2025 Suzana Education Center. All rights reserved.

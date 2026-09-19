# TaskBoard - Project Management Tool

A simple Trello-style app where teams can create projects, add members, assign tasks, set due dates and discuss on tasks with comments.

Built as **Task 3** of the **CodeAlpha Full Stack Development Internship**.

## Live Demo

- **App:** https://codealpha-project-management-tool.netlify.app
- **API:** https://codealpha-project-management-tool-gomj.onrender.com

> The backend runs on Render's free plan, so the **first request can take up to 50 seconds** while the server wakes up. If you see "Cannot reach the server", wait a moment and try again.

To try it, click **Register** and create an account with any email. To see the teamwork features, create a second account and add it to a project using its email.

## Features

- Register and login with JWT authentication (passwords hashed with bcrypt)
- Create projects and add members by email (only the project owner can add members)
- Create tasks with priority, due date and an assigned member
- Move tasks between To-Do, In-Progress and Done, or delete them
- Comment on tasks
- Overdue tasks are highlighted in red
- Only project members can see or change a project's tasks and comments

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas (Mongoose)
- **Hosting:** Netlify (frontend), Render (backend)

## Run Locally

**Requirements:** Node.js 20 or newer and a MongoDB database (a free MongoDB Atlas cluster works).

1. Clone the repository
```bash
   git clone https://github.com/Vishal912026/CodeAlpha_Project_Management_Tool.git
   cd CodeAlpha_Project_Management_Tool/backend
```

2. Install dependencies
```bash
   npm install
```

3. Create a `.env` file inside the `backend` folder
```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=any_long_random_string
   PORT=5000
```

4. Start the server
```bash
   npm run dev
```

5. In `frontend/script.js`, change the first line to `const API_URL = "http://localhost:5000/api";` and open `frontend/index.html` in your browser.

## What I Learned

- Building a REST API with Express and Mongoose
- Access control: checking project membership on every route
- Input validation and protection against NoSQL injection and XSS
- Deploying a full stack app and handling free-tier cold starts

## Author

**Vishal Kumar Prajapati** - [GitHub](https://github.com/Vishal912026)
 TrustScoreX

AI Powered Student Integrity & Examination Monitoring Platform

📌 Overview

TrustScoreX is a web-based platform designed to help educational institutions monitor student integrity and identify high-risk students using trust score analytics.

The platform allows administrators to:

- Register students
- Assign trust scores
- Monitor student performance
- Identify high-risk students
- View leaderboards
- Analyze student data through dashboards

---

🚀 Features

Student Registration

- Register students with name and email
- Automatic Trust Score generation

Student Dashboard

- View all registered students
- Color-coded trust score display

Admin Dashboard

- Analytics overview
- Student search functionality
- View all students

Leaderboard

- Rank students by Trust Score
- Highlight top performers

Risk Monitoring

- Identify students with Trust Score below 70
- Risk-based student tracking

Export Data

- Export student records in JSON format

---

🛠 Technology Stack

Frontend

- HTML
- CSS
- JavaScript

Backend

- Node.js
- Express.js

Database

- JSON File Storage

---

📊 API Endpoints

Method| Endpoint
POST| /register
GET| /students
GET| /analytics
GET| /leaderboard
GET| /risk-students
GET| /search/:name
POST| /update-score
DELETE| /delete/:id
GET| /export

---

👨‍💻 Project Structure

trustscorex/

├── public/

│ ├── index.html

│ ├── dashboard.html

│ ├── admin.html

│ ├── leaderboard.html

│ └── risk.html

├── data/

│ └── students.json

├── server.js

├── package.json

└── README.md

---

▶ Run Project

npm install
node server.js

Open:

# Brain Mentors Project

A full-stack web application for managing workshop feedback, OTP verification, and automated certificate generation.

## Live Demo

https://brain-mentors-project.vercel.app/

## GitHub Repository

https://github.com/faizan-docx/brainMentorsProject.git

---

## Features

* OTP-based Email Verification (EmailJS)
* Workshop Feedback Submission
* Admin Dashboard (view user responses)
* Automated Certificate Generation (PDF)
* Instant Certificate Download after submission
* Responsive UI (Mobile + Desktop)
* Modern UI using Tailwind CSS and shadcn/ui

---

## Tech Stack

**Frontend**

* React (Vite)
* Tailwind CSS
* shadcn/ui

**Backend / Services**

* Firebase (Firestore)
* EmailJS (OTP verification & emails)
* jsPDF (certificate generation)

---

## Project Flow

1. User enters details in form
2. OTP is sent via EmailJS
3. User verifies OTP
4. Feedback form is submitted
5. Certificate is generated dynamically
6. Certificate is downloaded instantly in browser

---

## Admin Access

Use the following credentials:

* Email: [admin@example.com](mailto:admin@example.com)
* Password: 123456

Admin can:

* View all submissions
* Monitor user data

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/faizan-docx/brainMentorsProject.git
cd brainMentorsProject
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the project

```bash
npm run dev
```

---

## Environment Setup

Create a `.env` file and add your EmailJS credentials:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## Folder Structure (Simplified)

```bash
src/
│── components/
│   ├── ui/            # shadcn components
│   ├── forms/
│   ├── dashboard/
│
│── pages/
│   ├── Home.jsx
│   ├── Admin.jsx
│   ├── ThankYou.jsx
│
│── utils/
│   ├── generatePDF.js
│
│── App.jsx
│── main.jsx
```

---

## Key Highlights

* No Firebase Storage dependency (optimized PDF handling)
* Lightweight PDF generation (~3KB)
* No CORS issues
* Clean and scalable UI
* Beginner-friendly architecture

---

## Future Improvements

* WhatsApp certificate delivery
* Role-based authentication
* Analytics dashboard
* Export data as CSV/PDF

---

## Author

Faizan Ahmad
BTech (CSE)
Delhi, India

---

## License

This project is for educational and demonstration purposes.


# AI Quiz Builder

It is a sleek, responsive quiz platform that allows users to create, host, and take quizzes effortlessly. It supports multiple question types, timed quizzes, and provides analytics of results, offering a smooth experience for both quiz creators and participants.

## Features

- Create quizzes with multiple question types:
  - MCQ (single/multiple answer)
  - True/False
  - One-word answers
  - Subjective questions
- Set quiz time limits and end times.
- Host quizzes and share session links with participants.
- Analytics dashboard for results.
- Responsive design for mobile and desktop.
- Autosave answers during quiz attempts.

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <repo-folder>
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables in a `.env` file (example):

```
MONGO_URI=<your-mongodb-uri>
PORT=5000
JWT_SECRET=<your-jwt-secret>
```

4. Start the server:

```bash
npm run dev
```

5. Access the app at `http://localhost:3000` (or the port your frontend is configured to run on).

## Usage

- **Creating a Quiz:** Log in, click the "+" button on the dashboard, and add questions.
- **Hosting a Quiz:** Click the "Host" button on your quiz card to generate a session link.
- **Taking a Quiz:** Join via session link, answer questions, and submit. Results will be stored for analytics.
- **Analytics:** Check the quiz dashboard to see participants’ performance summaries.

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Authentication:** JWT
- **Hosting:** Can be hosted on platforms like Vercel, Netlify, or Heroku

## Contributing

Feel free to fork this repository, make improvements, and submit a pull request. For major changes, please open an issue first.

## License

This project is licensed under the MIT License.

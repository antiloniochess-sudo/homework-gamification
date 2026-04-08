# 📚 Study Quest - Homework Gamification with AI

A gamified homework tracking app with AI-powered question and flashcard generation using Google Gemini.

## ✨ Features

- **Task Management**: Add homework tasks with subjects and track completion
- **Gamification**: Earn XP and level up as you complete tasks
- **AI Generator**: Generate practice questions or flashcards on any topic
- **Questions Mode**: Multiple-choice questions with answers
- **Flashcard Mode**: Interactive flip cards with 3D animations
- **Secure Backend**: API key stored safely on backend server

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Your Gemini API Key

Get a free API key from [Google AI Studio](https://ai.google.dev)

#### Option A: Environment Variable (Recommended)
```bash
# On Windows (PowerShell)
$env:GEMINI_API_KEY = "your-api-key-here"
npm start

# On Windows (CMD)
set GEMINI_API_KEY=your-api-key-here
npm start

# On Mac/Linux
export GEMINI_API_KEY=your-api-key-here
npm start
```

#### Option B: Edit server.js
Replace `'your-gemini-api-key-here'` in `server.js`:
```javascript
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-actual-api-key';
```

### 3. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### 4. Open in Browser

Navigate to `http://localhost:3000` in your web browser

## 🎮 How to Use

### 📝 Adding Tasks
1. Enter task name (e.g., "Read Chapter 5")
2. Add subject (optional, e.g., "Math")
3. Click "+ Add Task" or press **Ctrl+K**

### ✅ Completing Tasks
- Click "Complete" button next to a task
- Earn 10 XP per task
- Level up at 100 XP

### 🤖 Generating Questions/Flashcards
1. Click "🤖 AI Generator" or press **Ctrl+G**
2. Enter a topic (e.g., "Photosynthesis")
3. Choose:
   - **Questions**: Multiple-choice format
   - **Flashcards**: Flip-card format
4. Select quantity (1-10)
5. Click "Generate"

### 📋 Results
- **Questions**: Click "Show Answer" to reveal the correct answer
- **Flashcards**: Click the card to flip and see the answer
- Use "📋 Copy All" to copy results to clipboard

## 🏗️ Project Structure

```
HomeworkGamification/
├── server.js           # Backend server (Node.js/Express)
├── app.js              # Frontend JavaScript
├── index.html          # Main HTML file
├── style.css           # Styling
├── package.json        # Dependencies
└── README.md           # This file
```

## 🔑 API Keys

- **Backend**: GEMINI_API_KEY environment variable (secure, not exposed to client)
- **Frontend**: No API keys needed (all calls go through backend)

## 📱 Responsive Design

- **Desktop**: Full features
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly interface

## 🎨 Theme

- Dark modern theme with purple accent colors
- Smooth animations and transitions
- Glassmorphism UI elements

## 👨‍💻 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI**: Google Gemini API
- **Storage**: Browser localStorage (tasks & progress)

## 📝 Example Workflows

### Study for Math Test
1. Add task: "Study quadratic equations" (Subject: Math)
2. Complete it when done (earn 10 XP)
3. Generate questions on "quadratic equations" at 10 questions
4. Practice with generated questions
5. Generate flashcards for quick review

### Language Learning
1. Generate 5 flashcards for "Spanish vocabulary - animals"
2. Flip through cards to test yourself
3. Copy results to study files
4. Track all as homework tasks

## 🐛 Troubleshooting

### "Error: Server Error"
- Check if backend server is running (`npm start`)
- Verify API key is set correctly
- Check browser console for details

### "Connection Refused"
- Backend not running - start with `npm start`
- Wrong port - should be http://localhost:3000

### "API key not configured"
- Set GEMINI_API_KEY environment variable
- Or edit server.js with your actual API key
- Restart the server

## 📚 Future Enhancements

- Database storage (instead of localStorage)
- User authentication
- Study session timer
- Spaced repetition algorithm
- Export to PDF
- Multiplayer challenges

## 📄 License

MIT License - Feel free to use and modify!

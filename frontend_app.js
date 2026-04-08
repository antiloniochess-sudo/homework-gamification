// ===== Global Constants =====
const XP_PER_TASK = 10;
const XP_PER_LEVEL = 100;
const STORAGE_KEY = 'homeworkGamification';
const QUIZ_STATE_KEY = 'currentQuizState';
const QUIZ_HISTORY_KEY = 'quizHistory';

// Detect if running locally or on Render
const API_ENDPOINT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api/generate'
  : `https://${window.location.hostname}/api/generate`;

let aiGeneratorLastCall = 0;
const AI_RATE_LIMIT_MS = 2000;

// ===== Quiz State Tracking =====
let currentQuizState = null;
let currentQuizData = null;
let quizHistory = {}; // Stores completed/previously generated quizzes

// ===== Confetti Effect for Level Ups =====
function createConfetti() {
    const confettiPieces = 50;
    const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    
    for (let i = 0; i < confettiPieces; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '8px';
        confetti.style.height = '8px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        
        document.body.appendChild(confetti);
        
        const duration = 2 + Math.random() * 1;
        const xMove = (Math.random() - 0.5) * 400;
        const yMove = window.innerHeight + 100;
        
        confetti.animate([
            {
                transform: `translate(0, 0) rotate(0deg)`,
                opacity: 1
            },
            {
                transform: `translate(${xMove}px, ${yMove}px) rotate(360deg)`,
                opacity: 0
            }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        setTimeout(() => confetti.remove(), duration * 1000);
    }
}

// ===== DOM Elements =====
// Task input elements removed - using AI Generator only
// const taskInput = document.getElementById('taskInput');
// const subjectInput = document.getElementById('subjectInput');
// const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const levelDisplay = document.getElementById('levelDisplay');
const xpDisplay = document.getElementById('xpDisplay');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const notification = document.getElementById('notification');
const resetBtn = document.getElementById('resetBtn');
const totalTasks = document.getElementById('totalTasks');
const totalXpEarned = document.getElementById('totalXpEarned');
// Filter buttons removed - using simple task list instead
const aiGeneratorBtn = document.getElementById('aiGeneratorBtn');
const aiModal = document.getElementById('aiModal');
const closeAiModal = document.getElementById('closeAiModal');
const generatorForm = document.getElementById('generatorForm');
const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const quantitySlider = document.getElementById('quantitySlider');
const quantityValue = document.getElementById('quantityValue');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsList = document.getElementById('resultsList');
const errorMessage = document.getElementById('errorMessage');

// ===== Game State =====
let gameState = {
    level: 1,
    xp: 0,
    totalXpEarned: 0,
    tasks: []
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    loadQuizHistory();
    checkForSavedQuiz();
    renderUI();
    attachEventListeners();
});

// ===== Event Listeners =====
function attachEventListeners() {
    resetBtn.addEventListener('click', resetData);
    aiGeneratorBtn.addEventListener('click', openAiModal);
    closeAiModal.addEventListener('click', closeAiGeneratorModal);
    generateBtn.addEventListener('click', generateContent);
    quantitySlider.addEventListener('input', (e) => {
        quantityValue.textContent = e.target.value;
    });
    topicInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !loadingSpinner.style.display.includes('block')) {
            generateContent();
        }
    });
}

// ===== Quiz State Management =====
function checkForSavedQuiz() {
    const saved = localStorage.getItem(QUIZ_STATE_KEY);
    if (saved) {
        try {
            currentQuizState = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load saved quiz:', e);
            localStorage.removeItem(QUIZ_STATE_KEY);
        }
    }
}

function saveQuizState(type, topic, content, currentIndex) {
    currentQuizState = {
        type: type,
        topic: topic,
        content: content,
        currentIndex: currentIndex,
        timestamp: Date.now()
    };
    localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(currentQuizState));
}

function clearQuizState() {
    currentQuizState = null;
    currentQuizData = null;
    localStorage.removeItem(QUIZ_STATE_KEY);
}

function resumeQuiz() {
    if (!currentQuizState) return;
    
    // Show modal as if resuming
    aiModal.style.display = 'flex';
    resultsContainer.style.display = 'block';
    resultsList.innerHTML = '';
    errorMessage.style.display = 'none';
    
    const startIndex = currentQuizState.currentIndex;
    
    // Render based on type
    if (currentQuizState.type === 'questions') {
        renderQuestions(currentQuizState.content, startIndex);
    } else {
        renderFlashcards(currentQuizState.content, startIndex);
    }
    
    showNotification(`📚 Resuming: ${currentQuizState.topic}`);
}

// ===== Task Management =====
function deleteTask(taskId) {
    if (confirm('Delete this topic?')) {
        gameState.tasks = gameState.tasks.filter(t => t.id !== taskId);
        saveGameState();
        renderUI();
    }
}

function addTopicTask(topicName) {
    // Check if this topic already exists (avoid duplicates)
    const exists = gameState.tasks.some(t => t.title.toLowerCase() === topicName.toLowerCase());
    
    if (!exists) {
        const task = {
            id: Date.now(),
            title: topicName,
            createdAt: Date.now()
        };
        
        gameState.tasks.push(task);
        saveGameState();
        renderUI();
    }
}

// ===== Rendering =====
function renderUI() {
    renderStats();
    renderProgressBar();
    renderTasks();
}

function renderStats() {
    const currentLevelXp = gameState.xp;
    const totalTasksCount = gameState.tasks.length;

    levelDisplay.textContent = gameState.level;
    xpDisplay.textContent = `${currentLevelXp}/${XP_PER_LEVEL}`;
    progressText.textContent = `Level up at ${XP_PER_LEVEL} XP`;
    
    totalTasks.textContent = totalTasksCount;
    totalXpEarned.textContent = gameState.totalXpEarned;
}

function renderProgressBar() {
    const progress = (gameState.xp / XP_PER_LEVEL) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

function renderTasks() {
    // Sort tasks by most recent first
    const sortedTasks = [...gameState.tasks].sort((a, b) => b.createdAt - a.createdAt);

    if (sortedTasks.length === 0) {
        taskList.innerHTML = '<li class="empty-state">No topics studied yet. Start by generating AI content!</li>';
        return;
    }

    taskList.innerHTML = sortedTasks.map(task => `
        <li class="task-item">
            <div class="task-content">
                <div class="task-text clickable" onclick="openOldQuiz('${escapeHtml(task.title)}')" style="cursor: pointer; flex: 1;">${escapeHtml(task.title)}</div>
            </div>
            <div class="task-actions">
                <button class="btn btn-delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        </li>
    `).join('');
}

// ===== Notifications =====
function showNotification(message, isLevelUp = false) {
    notification.textContent = message;
    notification.classList.add('show');
    if (isLevelUp) {
        notification.classList.add('level-up');
    }
    
    setTimeout(() => {
        notification.classList.remove('show', 'level-up');
    }, 3000);
}

function showXpFeedback(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) {
        // Create feedback at button location
        const completeBtn = event?.target;
        if (completeBtn) {
            const rect = completeBtn.getBoundingClientRect();
            const feedback = document.createElement('div');
            feedback.className = 'xp-feedback';
            feedback.textContent = `+${XP_PER_TASK}`;
            feedback.style.left = rect.left + 'px';
            feedback.style.top = rect.top + 'px';
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 1000);
        }
    }
}

// ===== Persistence =====
function saveGameState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load game state:', e);
            resetData();
        }
    }
}

function loadQuizHistory() {
    const saved = localStorage.getItem(QUIZ_HISTORY_KEY);
    if (saved) {
        try {
            quizHistory = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load quiz history:', e);
            quizHistory = {};
        }
    }
}

function saveQuizHistory() {
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(quizHistory));
}

function resetData() {
    if (confirm('Are you sure? This will delete all topics and reset your progress.')) {
        gameState = {
            level: 1,
            xp: 0,
            totalXpEarned: 0,
            tasks: []
        };
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(QUIZ_HISTORY_KEY);
        quizHistory = {};
        renderUI();
        showNotification('Data reset!');
    }
}

// ===== Utilities =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
    // Keyboard shortcuts removed - use button click to open AI Generator
});

// ===== AI Generator Functions =====
function openAiModal() {
    aiModal.style.display = 'flex';
    
    // Check if there's a saved quiz to resume
    if (currentQuizState) {
        // Show resume prompt
        resultsList.innerHTML = '';
        resultsContainer.style.display = 'block';
        const resumeDiv = document.createElement('div');
        resumeDiv.className = 'resume-quiz-prompt';
        resumeDiv.innerHTML = `
            <div class="resume-content">
                <h3>📚 Resume Quiz?</h3>
                <p><strong>Topic:</strong> ${escapeHtml(currentQuizState.topic)}</p>
                <p><strong>Type:</strong> ${currentQuizState.type === 'questions' ? 'Multiple Choice Questions' : 'Flashcards'}</p>
                <p><strong>Where you left off:</strong> Question/Card ${currentQuizState.currentIndex + 1}</p>
                <div class="resume-buttons">
                    <button class="btn btn-primary" onclick="resumeQuiz()">📖 Resume</button>
                    <button class="btn btn-secondary" onclick="startNewQuiz()">✨ Start New</button>
                </div>
            </div>
        `;
        resultsList.appendChild(resumeDiv);
    } else {
        // No saved quiz, show normal generator
        resultsContainer.style.display = 'none';
        resultsList.innerHTML = '';
        errorMessage.style.display = 'none';
        topicInput.value = '';
        setTimeout(() => topicInput.focus(), 100);
    }
}

function startNewQuiz() {
    clearQuizState();
    resultsContainer.style.display = 'none';
    resultsList.innerHTML = '';
    topicInput.value = '';
    setTimeout(() => topicInput.focus(), 100);
}

function closeAiGeneratorModal() {
    aiModal.style.display = 'none';
    resultsContainer.style.display = 'none';
    resultsList.innerHTML = '';
    errorMessage.style.display = 'none';
    topicInput.value = '';
    // Keep quiz state on close so user can resume
}

function openOldQuiz(topicName) {
    // Check if there's a saved incomplete quiz for this topic
    if (currentQuizState && currentQuizState.topic === topicName) {
        // Resume the incomplete quiz
        aiModal.style.display = 'flex';
        resumeQuiz();
        return;
    }
    
    // Check if this topic exists in history
    if (quizHistory[topicName]) {
        // Show option to retake or view old quiz
        aiModal.style.display = 'flex';
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = '';
        errorMessage.style.display = 'none';
        
        const historyData = quizHistory[topicName];
        const retakeDiv = document.createElement('div');
        retakeDiv.className = 'resume-quiz-prompt';
        retakeDiv.innerHTML = `
            <div class="resume-content">
                <h3>📚 ${escapeHtml(topicName)}</h3>
                <p><strong>Type:</strong> ${historyData.type === 'questions' ? 'Multiple Choice Questions' : 'Flashcards'}</p>
                <p>This quiz was previously completed.</p>
                <div class="resume-buttons">
                    <button class="btn btn-primary" onclick="openOldQuizContent('${topicName}', 0)">📖 View Quiz</button>
                    <button class="btn btn-secondary" onclick="startNewQuiz()">✨ Generate New</button>
                </div>
            </div>
        `;
        resultsList.appendChild(retakeDiv);
        return;
    }
    
    showError('Topic not found in history!');
}

function openOldQuizContent(topicName, startIndex = 0) {
    if (!quizHistory[topicName]) {
        showError('Quiz data not found!');
        return;
    }
    
    const historyData = quizHistory[topicName];
    
    // Set up quiz state for this old quiz
    currentQuizState = {
        type: historyData.type,
        topic: topicName,
        content: historyData.content,
        currentIndex: startIndex,
        timestamp: historyData.completedAt
    };
    
    // Render the quiz
    resultsList.innerHTML = '';
    if (historyData.type === 'questions') {
        renderQuestions(historyData.content, startIndex);
    } else {
        renderFlashcards(historyData.content, startIndex);
    }
    
    showNotification(`📖 Viewing: ${topicName}`);
}

function finishQuiz() {
    // Save quiz to history before clearing
    if (currentQuizState) {
        quizHistory[currentQuizState.topic] = {
            type: currentQuizState.type,
            content: currentQuizState.content,
            completedAt: Date.now()
        };
        saveQuizHistory();
    }
    
    clearQuizState();
    closeAiGeneratorModal();
    showNotification('✨ Quiz completed! Great job!');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

async function generateContent() {
    const now = Date.now();
    if (now - aiGeneratorLastCall < AI_RATE_LIMIT_MS) {
        showError('⏳ Please wait a moment before generating again');
        return;
    }
    aiGeneratorLastCall = now;

    const topic = topicInput.value.trim();
    if (!topic) {
        showError('Please enter a topic');
        return;
    }

    // Add topic to tasks list
    addTopicTask(topic);

    const type = document.querySelector('input[name="generationType"]:checked').value;
    const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    const quantity = parseInt(quantitySlider.value);

    loadingSpinner.style.display = 'flex';
    resultsContainer.style.display = 'block';
    resultsList.innerHTML = '';
    errorMessage.style.display = 'none';

    try {
        const prompt = generatePrompt(topic, type, quantity, difficulty);
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server Error: ${response.status}`);
        }

        const data = await response.json();
        loadingSpinner.style.display = 'none';

        if (data.content) {
            renderResults(data.content, type, topic);
            showNotification('✨ Content generated!');
        } else {
            showError('No content generated. Please try again.');
        }
    } catch (error) {
        loadingSpinner.style.display = 'none';
        console.error('Generation error:', error);
        showError(`Error: ${error.message}`);
    }
}

function generatePrompt(topic, type, quantity, difficulty) {
    const difficultyDescriptions = {
        easy: 'basic and beginner-friendly',
        normal: 'intermediate level',
        hard: 'challenging and advanced'
    };
    
    const diffDesc = difficultyDescriptions[difficulty] || 'intermediate level';
    
    if (type === 'questions') {
        return `Generate exactly ${quantity} ${diffDesc} multiple-choice questions about "${topic}" for educational purposes. Format each question as:

Q1. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct letter]

Repeat for Q2, Q3, etc. Make sure each question has one clear correct answer.`;
    } else {
        return `Generate exactly ${quantity} ${diffDesc} flashcard study pairs about "${topic}" in this format:

Q: [Question/prompt]
A: [Answer/explanation]

Repeat for each flashcard. Make them concise and educational.`;
    }
}

function renderResults(content, type, topic = '') {
    resultsList.innerHTML = '';
    
    // Save quiz state
    if (topic) {
        saveQuizState(type, topic, content, 0);
    }
    
    if (type === 'questions') {
        renderQuestions(content, 0);
    } else {
        renderFlashcards(content, 0);
    }
}

function renderQuestions(content, startIndex = 0) {
    // Parse all questions with their answer choices
    const questionRegex = /Q\d+\.\s*([^\n]+)\s*([\s\S]*?)Answer:\s*([A-D])/gi;
    const questions = [];
    let match;

    while ((match = questionRegex.exec(content)) !== null) {
        const questionText = match[1];
        const choicesText = match[2];
        const correctAnswer = match[3];
        
        // Extract answer choices
        const choices = {};
        const choiceRegex = /([A-D])\)\s*([^\n]+)/g;
        let choiceMatch;
        while ((choiceMatch = choiceRegex.exec(choicesText)) !== null) {
            choices[choiceMatch[1]] = choiceMatch[2];
        }
        
        questions.push({ questionText, choices, correctAnswer });
    }

    if (questions.length === 0) return;
    
    let currentIndex = startIndex;
    
    function showQuestion(index) {
        resultsList.innerHTML = '';
        if (index < 0 || index >= questions.length) return;
        
        currentIndex = index;
        
        // Save progress
        if (currentQuizState) {
            currentQuizState.currentIndex = index;
            localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(currentQuizState));
        }
        
        const q = questions[index];
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        // Question text
        const qText = document.createElement('div');
        qText.className = 'question-text';
        qText.innerHTML = `<strong>Question ${index + 1} of ${questions.length}</strong><p>${escapeHtml(q.questionText)}</p>`;
        questionDiv.appendChild(qText);
        
        // Answer buttons
        const answersDiv = document.createElement('div');
        answersDiv.className = 'answers-grid';
        
        ['A', 'B', 'C', 'D'].forEach(letter => {
            if (q.choices[letter]) {
                const btn = document.createElement('button');
                btn.className = 'btn btn-answer';
                btn.textContent = `${letter}) ${q.choices[letter]}`;
                btn.addEventListener('click', () => {
                    const isCorrect = letter === q.correctAnswer;
                    btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                    
                    // Disable all buttons and show correct answer
                    Array.from(answersDiv.querySelectorAll('.btn-answer')).forEach(b => {
                        b.disabled = true;
                        if (b.textContent.charAt(0) === q.correctAnswer) {
                            b.classList.add('correct');
                        }
                    });
                    
                    // Show feedback
                    const feedback = document.createElement('div');
                    feedback.className = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
                    feedback.textContent = isCorrect ? '✅ Correct!' : `❌ Incorrect. Correct answer: ${q.correctAnswer}`;
                    questionDiv.appendChild(feedback);
                });
                answersDiv.appendChild(btn);
            }
        });
        
        questionDiv.appendChild(answersDiv);
        
        // Navigation buttons
        const navDiv = document.createElement('div');
        navDiv.className = 'nav-buttons';
        
        if (index > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-primary btn-small';
            prevBtn.textContent = '← Previous';
            prevBtn.addEventListener('click', () => showQuestion(index - 1));
            navDiv.appendChild(prevBtn);
        }
        
        if (index < questions.length - 1) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-primary btn-small';
            nextBtn.textContent = 'Next →';
            nextBtn.addEventListener('click', () => showQuestion(index + 1));
            navDiv.appendChild(nextBtn);
        } else {
            const doneBtn = document.createElement('button');
            doneBtn.className = 'btn btn-primary btn-small';
            doneBtn.textContent = '✓ Done';
            doneBtn.addEventListener('click', () => finishQuiz());
            navDiv.appendChild(doneBtn);
        }
        
        questionDiv.appendChild(navDiv);
        resultsList.appendChild(questionDiv);
    }
    
    showQuestion(startIndex);
}

function renderFlashcards(content, startIndex = 0) {
    // Parse all flashcards
    const cardRegex = /Q:\s*([^\n]+)\nA:\s*([^\n]+)/gi;
    const cards = [];
    let match;

    while ((match = cardRegex.exec(content)) !== null) {
        cards.push({ question: match[1], answer: match[2] });
    }

    if (cards.length === 0) return;
    
    let currentIndex = startIndex;
    let isFlipped = false;
    
    function showCard(index) {
        resultsList.innerHTML = '';
        if (index < 0 || index >= cards.length) return;
        
        currentIndex = index;
        
        // Save progress
        if (currentQuizState) {
            currentQuizState.currentIndex = index;
            localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(currentQuizState));
        }
        
        isFlipped = false;
        const card = cards[index];
        
        const cardDiv = document.createElement('div');
        cardDiv.className = 'flashcard-container';
        
        // Title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'card-title';
        titleDiv.textContent = `Card ${index + 1} of ${cards.length}`;
        cardDiv.appendChild(titleDiv);
        
        // Flashcard
        const flashcard = document.createElement('div');
        flashcard.className = 'flashcard';
        flashcard.innerHTML = `
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <p>${escapeHtml(card.question)}</p>
                    <div class="flip-hint">Click to reveal answer</div>
                </div>
                <div class="flashcard-back">
                    <p>${escapeHtml(card.answer)}</p>
                </div>
            </div>
        `;
        
        flashcard.addEventListener('click', () => {
            isFlipped = !isFlipped;
            flashcard.classList.toggle('flipped');
        });
        
        cardDiv.appendChild(flashcard);
        
        // Navigation buttons
        const navDiv = document.createElement('div');
        navDiv.className = 'nav-buttons';
        
        if (index > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-primary btn-small';
            prevBtn.textContent = '← Previous';
            prevBtn.addEventListener('click', () => showCard(index - 1));
            navDiv.appendChild(prevBtn);
        }
        
        if (index < cards.length - 1) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-primary btn-small';
            nextBtn.textContent = 'Next →';
            nextBtn.addEventListener('click', () => showCard(index + 1));
            navDiv.appendChild(nextBtn);
        } else {
            const doneBtn = document.createElement('button');
            doneBtn.className = 'btn btn-primary btn-small';
            doneBtn.textContent = '✓ Done';
            doneBtn.addEventListener('click', () => finishQuiz());
            navDiv.appendChild(doneBtn);
        }
        
        cardDiv.appendChild(navDiv);
        resultsList.appendChild(cardDiv);
    }
    
    showCard(startIndex);
}

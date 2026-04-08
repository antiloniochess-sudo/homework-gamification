// ===== Global Constants =====
const XP_PER_TASK = 10;
const XP_PER_LEVEL = 100;
const STORAGE_KEY = 'homeworkGamification';
const API_ENDPOINT = 'http://localhost:3000/api/generate';
let aiGeneratorLastCall = 0;
const AI_RATE_LIMIT_MS = 2000;

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
const taskInput = document.getElementById('taskInput');
const subjectInput = document.getElementById('subjectInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const levelDisplay = document.getElementById('levelDisplay');
const xpDisplay = document.getElementById('xpDisplay');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const notification = document.getElementById('notification');
const resetBtn = document.getElementById('resetBtn');
const taskCount = document.getElementById('taskCount');
const totalTasks = document.getElementById('totalTasks');
const completedCount = document.getElementById('completedCount');
const totalXpEarned = document.getElementById('totalXpEarned');
const filterBtns = document.querySelectorAll('.filter-btn');
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
    tasks: [],
    currentFilter: 'all'
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    renderUI();
    attachEventListeners();
});

// ===== Event Listeners =====
function attachEventListeners() {
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    resetBtn.addEventListener('click', resetData);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });
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

// ===== Task Management =====
function addTask() {
    const title = taskInput.value.trim();
    const subject = subjectInput.value.trim();

    if (!title) {
        alert('Please enter a task title.');
        return;
    }

    const task = {
        id: Date.now(),
        title,
        subject,
        completed: false,
        createdAt: new Date().toLocaleString()
    };

    gameState.tasks.push(task);
    taskInput.value = '';
    subjectInput.value = '';
    saveGameState();
    renderUI();
    taskInput.focus();
}

function completeTask(taskId) {
    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    task.completed = true;
    
    // Award XP
    const oldLevel = gameState.level;
    gameState.xp += XP_PER_TASK;
    gameState.totalXpEarned += XP_PER_TASK;
    
    // Check for level up
    let leveledUp = false;
    while (gameState.xp >= XP_PER_LEVEL) {
        gameState.xp -= XP_PER_LEVEL;
        gameState.level += 1;
        leveledUp = true;
    }

    saveGameState();
    
    // Show feedback
    showXpFeedback(taskId);
    showNotification(`+${XP_PER_TASK} XP`);
    
    if (leveledUp) {
        showNotification(`🎉 Level Up! You're now level ${gameState.level}!`, true);
        createConfetti();
    }
    
    renderUI();
}

function deleteTask(taskId) {
    if (confirm('Delete this task?')) {
        gameState.tasks = gameState.tasks.filter(t => t.id !== taskId);
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
    const completedTasksCount = gameState.tasks.filter(t => t.completed).length;

    levelDisplay.textContent = gameState.level;
    xpDisplay.textContent = `${currentLevelXp}/${XP_PER_LEVEL}`;
    progressText.textContent = `Level up at ${XP_PER_LEVEL} XP`;
    
    taskCount.textContent = totalTasksCount;
    totalTasks.textContent = totalTasksCount;
    completedCount.textContent = completedTasksCount;
    totalXpEarned.textContent = gameState.totalXpEarned;
}

function renderProgressBar() {
    const progress = (gameState.xp / XP_PER_LEVEL) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

function renderTasks() {
    const filteredTasks = filterTasks();

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<li class="empty-state">No tasks yet. Start by adding one!</li>';
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.title)}</div>
                ${task.subject ? `<div class="task-subject">📖 ${escapeHtml(task.subject)}</div>` : ''}
            </div>
            <div class="task-actions">
                ${!task.completed ? `<button class="btn btn-complete" onclick="completeTask(${task.id})">Complete</button>` : '<button class="btn btn-complete" disabled style="opacity: 0.5;">✓ Done</button>'}
                <button class="btn btn-delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        </li>
    `).join('');
}

function filterTasks() {
    switch (gameState.currentFilter) {
        case 'pending':
            return gameState.tasks.filter(t => !t.completed);
        case 'completed':
            return gameState.tasks.filter(t => t.completed);
        default:
            return gameState.tasks;
    }
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

function resetData() {
    if (confirm('Are you sure? This will delete all tasks and reset your progress.')) {
        gameState = {
            level: 1,
            xp: 0,
            totalXpEarned: 0,
            tasks: [],
            currentFilter: 'all'
        };
        localStorage.removeItem(STORAGE_KEY);
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
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        taskInput.focus();
    }
    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        openAiModal();
    }
});

// ===== AI Generator Functions =====
function openAiModal() {
    aiModal.style.display = 'flex';
    resultsContainer.style.display = 'none';
    resultsList.innerHTML = '';
    errorMessage.style.display = 'none';
    topicInput.value = '';
    setTimeout(() => topicInput.focus(), 100);
}

function closeAiGeneratorModal() {
    aiModal.style.display = 'none';
    resultsContainer.style.display = 'none';
    resultsList.innerHTML = '';
    errorMessage.style.display = 'none';
    topicInput.value = '';
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

    const type = document.querySelector('input[name="generationType"]:checked').value;
    const quantity = parseInt(quantitySlider.value);

    loadingSpinner.style.display = 'flex';
    resultsContainer.style.display = 'block';
    resultsList.innerHTML = '';
    errorMessage.style.display = 'none';

    try {
        const prompt = generatePrompt(topic, type, quantity);
        
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
            renderResults(data.content, type);
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

function generatePrompt(topic, type, quantity) {
    if (type === 'questions') {
        return `Generate exactly ${quantity} high-quality multiple-choice questions about "${topic}" for educational purposes. Format each question as:

Q1. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct letter]

Repeat for Q2, Q3, etc. Make sure each question has one clear correct answer.`;
    } else {
        return `Generate exactly ${quantity} flashcard study pairs about "${topic}" in this format:

Q: [Question/prompt]
A: [Answer/explanation]

Repeat for each flashcard. Make them concise and educational.`;
    }
}

function renderResults(content, type) {
    resultsList.innerHTML = '';
    
    if (type === 'questions') {
        renderQuestions(content);
    } else {
        renderFlashcards(content);
    }

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-primary btn-small';
    copyBtn.textContent = '📋 Copy All';
    copyBtn.style.marginTop = '20px';
    copyBtn.addEventListener('click', () => {
        const text = resultsList.textContent;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('✅ Copied to clipboard!');
        });
    });
    resultsList.appendChild(copyBtn);
}

function renderQuestions(content) {
    const questionRegex = /Q\\d+\\.\\s*([^\\n]+)(?:[\\s\\S]*?)(?:Answer:\\s*([A-D]))?/gi;
    let match;
    let questionCount = 0;

    while ((match = questionRegex.exec(content)) !== null && questionCount < 20) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <div class="question-text"><strong>${escapeHtml(match[1])}</strong></div>
            <div class="question-answer" style="display: none;">
                <p><strong>Answer:</strong> ${escapeHtml(match[2] || 'See explanation')}</p>
            </div>
            <button class="btn btn-small btn-toggle-answer">Show Answer</button>
        `;
        
        const toggleBtn = questionDiv.querySelector('.btn-toggle-answer');
        const answerDiv = questionDiv.querySelector('.question-answer');
        toggleBtn.addEventListener('click', () => {
            const isHidden = answerDiv.style.display === 'none';
            answerDiv.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Hide Answer' : 'Show Answer';
        });

        resultsList.appendChild(questionDiv);
        questionCount++;
    }
}

function renderFlashcards(content) {
    const cardRegex = /Q:\\s*([^\\n]+)\\nA:\\s*([^\\n]+)/gi;
    let match;
    let cardCount = 0;

    while ((match = cardRegex.exec(content)) !== null && cardCount < 20) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'flashcard';
        cardDiv.innerHTML = `
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <p>${escapeHtml(match[1])}</p>
                </div>
                <div class="flashcard-back">
                    <p>${escapeHtml(match[2])}</p>
                </div>
            </div>
        `;
        
        cardDiv.addEventListener('click', () => {
            cardDiv.classList.toggle('flipped');
        });

        resultsList.appendChild(cardDiv);
        cardCount++;
    }
}

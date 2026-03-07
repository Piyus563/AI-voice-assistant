let isListening = false;
let isPaused = false;
let currentLang = 'hi-IN';
let speechSpeed = 1.0;
let speechVolume = 1.0;
const outputText = document.getElementById('output-text');
const statusLabel = document.getElementById('status-label');
const toggleBtn = document.getElementById('toggle-btn');
const wordCount = document.getElementById('word-count');
const confidenceScore = document.getElementById('confidence-score');
let history = JSON.parse(localStorage.getItem('transcriptHistory')) || [];

// 1. Browser Compatibility Check (Professional Touch)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = currentLang; // Initial language set

// 2. Real-time Result Handling
recognition.onresult = (event) => {
    let finalTranscript = "";
    let confidence = 0;
    for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
        confidence = event.results[i][0].confidence;
    }
    outputText.innerText = finalTranscript;
    outputText.style.color = "var(--text-main)";
    outputText.style.fontStyle = "normal";
    confidenceScore.innerText = `Confidence: ${(confidence * 100).toFixed(0)}%`;
    updateWordCount();
};

// 3. Auto-Restart Logic (For continuous listening)
recognition.onend = () => {
    if (isListening) {
        recognition.start();
    }
};

// 4. Handle Language Change
function changeLang(lang, btn) {
    currentLang = lang;
    recognition.lang = lang; // API language update
    
    // UI Update for Tabs
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// 5. Mic Control with UI Feedback
function handleMic() {
    if (!isListening) {
        try {
            recognition.start();
            isListening = true;
            updateMicUI(true);
        } catch (err) {
            console.error("Recognition error: ", err);
        }
    } else {
        recognition.stop();
        isListening = false;
        updateMicUI(false);
    }
}

// Helper function for cleaner code
function updateMicUI(isRecording) {
    if (isRecording) {
        toggleBtn.innerHTML = "🛑 Stop";
        toggleBtn.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
        toggleBtn.style.color = "white";
        statusLabel.innerHTML = '<span class="recording-dot"></span> Mode: Live';
    } else {
        toggleBtn.innerHTML = "🎤 Start";
        toggleBtn.style.background = "linear-gradient(135deg, #48bb78 0%, #38a169 100%)";
        toggleBtn.style.color = "white";
        statusLabel.innerText = "Mode: Idle";
    }
}

// 6. Text-to-Speech Feature
function handleSpeak() {
    const text = outputText.innerText;
    // Condition to check if text is actual dictation
    if (!text || text.includes("converted into text")) {
        alert("Say something first so that I can read!");
        return;
    }

    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = currentLang;
    speech.rate = speechSpeed;
    speech.volume = speechVolume;
    window.speechSynthesis.speak(speech);
}

// 7. Fast Reset (No Page Reload)
function handleReset() {
    recognition.stop();
    isListening = false;
    outputText.innerText = "The voice will be converted into text here...";
    outputText.style.color = "var(--text-dim)";
    outputText.style.fontStyle = "italic";
    updateMicUI(false);
    confidenceScore.innerText = "Confidence: --";
    updateWordCount();
}

// 8. PDF Export Function
function exportPDF() {
    const text = outputText.innerText;
    if (!text || text.includes("converted into text")) {
        alert("No content to export!");
        return;
    }
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Sahayak Transcript</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.8; }
                h1 { color: #667eea; }
                .content { margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>🎙️ Piyush Transcript</h1>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Language:</strong> ${currentLang}</p>
            <div class="content">${text}</div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function updateSpeed(value) {
    speechSpeed = parseFloat(value);
    document.getElementById('speed-value').innerText = value + 'x';
}

function updateVolume(value) {
    speechVolume = value / 100;
    document.getElementById('volume-value').innerText = value + '%';
}

function updateFontSize(value) {
    outputText.style.fontSize = value + 'px';
    document.getElementById('font-value').innerText = value + 'px';
}

function updateWordCount() {
    const text = outputText.innerText;
    if (!text || text.includes("converted into text")) {
        wordCount.innerText = "Words: 0 | Characters: 0";
        return;
    }
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    wordCount.innerText = `Words: ${words} | Characters: ${chars}`;
}

function handlePause() {
    if (window.speechSynthesis.speaking) {
        if (isPaused) {
            window.speechSynthesis.resume();
            isPaused = false;
        } else {
            window.speechSynthesis.pause();
            isPaused = true;
        }
    }
}

function copyText() {
    const text = outputText.innerText;
    if (!text || text.includes("converted into text")) {
        alert("No content to copy!");
        return;
    }
    navigator.clipboard.writeText(text).then(() => alert("✅ Copied to clipboard!"));
}

function saveText() {
    const text = outputText.innerText;
    if (!text || text.includes("converted into text")) {
        alert("No content to save!");
        return;
    }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${Date.now()}.txt`;
    a.click();
    saveToHistory(text);
}

function saveToHistory(text) {
    const entry = { text, lang: currentLang, date: new Date().toLocaleString() };
    history.unshift(entry);
    if (history.length > 10) history.pop();
    localStorage.setItem('transcriptHistory', JSON.stringify(history));
    renderHistory();
}

function toggleHistory() {
    const panel = document.getElementById('history-panel');
    panel.classList.toggle('open');
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    if (history.length === 0) {
        list.innerHTML = '<p>No history yet</p>';
        return;
    }
    list.innerHTML = history.map((item, i) => `
        <div class="history-item">
            <small>${item.date} | ${item.lang}</small>
            <p>${item.text.substring(0, 100)}...</p>
            <button onclick="loadHistory(${i})">Load</button>
        </div>
    `).join('');
}

function loadHistory(index) {
    outputText.innerText = history[index].text;
    outputText.style.color = "var(--text-main)";
    outputText.style.fontStyle = "normal";
    updateWordCount();
    toggleHistory();
}

function translateText() {
    const text = outputText.innerText;
    if (!text || text.includes("converted into text")) {
        alert("No content to translate!");
        return;
    }
    const url = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function summarizeText() {
    const text = outputText.innerText;
    if (!text || text.includes("converted into text")) {
        alert("No content to summarize!");
        return;
    }
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const summary = sentences.slice(0, Math.ceil(sentences.length / 3)).join('. ') + '.';
    alert(`📝 Quick Summary:\n\n${summary}`);
}

outputText.addEventListener('input', updateWordCount);
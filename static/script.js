/**
 * Antigravity Calculator Client Script
 * Manages UI interactions, theme toggling, scientific layout, keyboard events,
 * ripple animations, and makes API calls to the Flask backend.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const body = document.body;
    const appContainer = document.querySelector('.app-container');
    const expressionDisplay = document.getElementById('expression-display');
    const resultDisplay = document.getElementById('result-display');
    
    // Controls
    const toggleThemeBtn = document.getElementById('toggle-theme');
    const iconSun = toggleThemeBtn.querySelector('.icon-sun');
    const iconMoon = toggleThemeBtn.querySelector('.icon-moon');
    const toggleScientificBtn = document.getElementById('toggle-scientific');
    const scientificKeysPanel = document.getElementById('scientific-keys');
    
    // History Panel
    const toggleHistoryBtn = document.getElementById('toggle-history');
    const closeHistoryBtn = document.getElementById('close-history');
    const historyPanel = document.getElementById('history-panel');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Calculator State
    let currentExpression = '';
    let lastResult = '';
    let isNewCalculation = false; // Tracks if next input should clear the screen

    // --- RIPPLE EFFECT ON BUTTON CLICK ---
    function createRipple(event, button) {
        // Remove existing ripples
        const existingRipples = button.querySelectorAll('.key-press-effect');
        existingRipples.forEach(r => r.remove());

        const ripple = document.createElement('span');
        ripple.classList.add('key-press-effect');
        
        // Calculate position relative to button
        const rect = button.getBoundingClientRect();
        const x = (event.clientX || event.touches[0].clientX) - rect.left;
        const y = (event.clientY || event.touches[0].clientY) - rect.top;
        
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        button.appendChild(ripple);
        
        // Remove after animation completes
        setTimeout(() => {
            ripple.remove();
        }, 400);
    }

    // --- THEME SWAP FUNCTIONALITY ---
    toggleThemeBtn.addEventListener('click', (e) => {
        createRipple(e, toggleThemeBtn);
        body.classList.toggle('light-theme');
        
        if (body.classList.contains('light-theme')) {
            iconSun.style.display = 'none';
            iconMoon.style.display = 'block';
            localStorage.setItem('theme', 'light');
        } else {
            iconSun.style.display = 'block';
            iconMoon.style.display = 'none';
            localStorage.setItem('theme', 'dark');
        }
    });

    // Load Saved Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        iconSun.style.display = 'none';
        iconMoon.style.display = 'block';
    }

    // --- SCIENTIFIC PANEL TOGGLE ---
    toggleScientificBtn.addEventListener('click', (e) => {
        createRipple(e, toggleScientificBtn);
        toggleScientificBtn.classList.toggle('active');
        scientificKeysPanel.classList.toggle('show');
    });

    // --- HISTORY SIDE-PANEL TOGGLE ---
    const openHistory = () => {
        appContainer.classList.add('history-open');
        fetchHistory();
    };

    const closeHistory = () => {
        appContainer.classList.remove('history-open');
    };

    toggleHistoryBtn.addEventListener('click', (e) => {
        createRipple(e, toggleHistoryBtn);
        if (appContainer.classList.contains('history-open')) {
            closeHistory();
        } else {
            openHistory();
        }
    });

    closeHistoryBtn.addEventListener('click', closeHistory);

    // Close panel by clicking outside on desktop
    document.addEventListener('click', (e) => {
        if (appContainer.classList.contains('history-open')) {
            const isClickInside = historyPanel.contains(e.target) || 
                                  toggleHistoryBtn.contains(e.target) || 
                                  e.target.closest('.history-item');
            if (!isClickInside && window.innerWidth >= 768) {
                closeHistory();
            }
        }
    });

    // --- CORE CALCULATOR LOGIC ---
    const updateDisplay = () => {
        expressionDisplay.textContent = currentExpression || '';
        
        // Adjust font size dynamically for long numbers/expressions
        if (currentExpression.length > 15) {
            expressionDisplay.style.fontSize = '1.05rem';
        } else {
            expressionDisplay.style.fontSize = '1.3rem';
        }
        
        if (resultDisplay.textContent.length > 12) {
            resultDisplay.style.fontSize = '2.1rem';
        } else if (resultDisplay.textContent.length > 8) {
            resultDisplay.style.fontSize = '2.5rem';
        } else {
            resultDisplay.style.fontSize = '2.8rem';
        }
        
        // Auto scroll result to the right
        resultDisplay.scrollLeft = resultDisplay.scrollWidth;
    };

    const clearAll = () => {
        currentExpression = '';
        lastResult = '';
        resultDisplay.textContent = '0';
        resultDisplay.style.color = 'var(--text-primary)';
        isNewCalculation = false;
        updateDisplay();
    };

    const handleBackspace = () => {
        if (isNewCalculation) {
            clearAll();
            return;
        }
        
        if (currentExpression.length > 0) {
            // Check if removing a function call (e.g. "sin(", "cos(", "log(", "sqrt(", "ln(")
            const funcPatterns = [/sin\($/, /cos\($/, /tan\($/, /log\($/, /sqrt\($/, /ln\($/];
            let matched = false;
            
            for (const pattern of funcPatterns) {
                if (pattern.test(currentExpression)) {
                    currentExpression = currentExpression.replace(pattern, '');
                    matched = true;
                    break;
                }
            }
            
            if (!matched) {
                currentExpression = currentExpression.slice(0, -1);
            }
            
            updateDisplay();
        }
    };

    const appendValue = (val) => {
        // If a new calculation just finished, start a new expression unless they press an operator
        if (isNewCalculation) {
            const isOperator = ['+', '-', '×', '÷', '^', '%'].includes(val);
            if (isOperator && lastResult && !lastResult.includes('Hata')) {
                currentExpression = lastResult + val;
            } else {
                currentExpression = val;
            }
            isNewCalculation = false;
            resultDisplay.style.color = 'var(--text-primary)';
        } else {
            currentExpression += val;
        }
        updateDisplay();
    };

    // --- API SERVER CALLS ---
    const sendCalculateRequest = async () => {
        if (!currentExpression) return;

        resultDisplay.textContent = 'Hesaplanıyor...';
        resultDisplay.style.fontSize = '2rem';
        
        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ expression: currentExpression })
            });
            
            const data = await response.json();
            
            if (data.success) {
                resultDisplay.textContent = data.result;
                resultDisplay.style.color = 'var(--text-primary)';
                lastResult = String(data.result);
                isNewCalculation = true;
                
                // Update history in background
                renderHistory(data.history);
            } else {
                resultDisplay.textContent = data.error || 'Hata';
                resultDisplay.style.color = '#ec4899'; // Accent Pink error tone
                lastResult = 'Hata';
                isNewCalculation = true;
            }
        } catch (error) {
            resultDisplay.textContent = 'Sunucu Bağlantı Hatası';
            resultDisplay.style.color = '#ec4899';
            lastResult = 'Hata';
            isNewCalculation = true;
        }
        updateDisplay();
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch('/history');
            const data = await response.json();
            if (data.success) {
                renderHistory(data.history);
            }
        } catch (error) {
            console.error('Geçmiş yüklenemedi:', error);
        }
    };

    const renderHistory = (historyItems) => {
        if (!historyItems || historyItems.length === 0) {
            historyList.innerHTML = '<div class="empty-history">Geçmiş işlem bulunmuyor.</div>';
            return;
        }

        historyList.innerHTML = '';
        // Display in reverse order (most recent first)
        const reversedHistory = [...historyItems].reverse();
        
        reversedHistory.forEach((item) => {
            const element = document.createElement('div');
            element.classList.add('history-item');
            element.innerHTML = `
                <span class="history-expr">${item.expression}</span>
                <span class="history-res">${item.result}</span>
            `;
            
            element.addEventListener('click', () => {
                currentExpression = item.expression;
                resultDisplay.textContent = item.result;
                resultDisplay.style.color = 'var(--text-primary)';
                lastResult = item.result;
                isNewCalculation = false;
                updateDisplay();
                
                // On mobile, close history on click to view screen
                if (window.innerWidth < 768) {
                    closeHistory();
                }
            });
            
            historyList.appendChild(element);
        });
    };

    clearHistoryBtn.addEventListener('click', async (e) => {
        createRipple(e, clearHistoryBtn);
        if (confirm('İşlem geçmişini silmek istediğinize emin misiniz?')) {
            try {
                const response = await fetch('/history/clear', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    historyList.innerHTML = '<div class="empty-history">Geçmiş işlem bulunmuyor.</div>';
                }
            } catch (error) {
                console.error('Geçmiş silinemedi:', error);
            }
        }
    });

    // --- BUTTON EVENT LISTENERS ---
    document.querySelectorAll('.key').forEach(button => {
        button.addEventListener('click', (e) => {
            createRipple(e, button);
            
            const val = button.getAttribute('data-val');
            const action = button.getAttribute('data-action');
            
            if (val) {
                appendValue(val);
            } else if (action === 'clear') {
                clearAll();
            } else if (action === 'backspace') {
                handleBackspace();
            }
        });
    });

    const equalsBtn = document.getElementById('key-equals');
    equalsBtn.addEventListener('click', (e) => {
        createRipple(e, equalsBtn);
        sendCalculateRequest();
    });

    // --- HARDWARE KEYBOARD SUPPORT ---
    window.addEventListener('keydown', (e) => {
        const key = e.key;
        
        // Prevent default actions for standard calculator inputs
        if (['/', '*', '-', '+', '%', 'Enter', 'Backspace', 'Escape'].includes(key)) {
            e.preventDefault();
        }

        // Active key styling animation helper
        const simulateKeyPress = (selector) => {
            const btn = document.querySelector(selector);
            if (btn) {
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 150);
                btn.click();
            }
        };

        if (key >= '0' && key <= '9') {
            simulateKeyPress(`.key.number[data-val="${key}"]`);
        } else if (key === '.') {
            simulateKeyPress(`.key.number[data-val="."]`);
        } else if (key === '+') {
            simulateKeyPress('.key.operator[data-val="+"]');
        } else if (key === '-') {
            simulateKeyPress('.key.operator[data-val="-"]');
        } else if (key === '*') {
            simulateKeyPress('.key.operator[data-val="×"]');
        } else if (key === '/') {
            simulateKeyPress('.key.operator[data-val="÷"]');
        } else if (key === '%') {
            simulateKeyPress('.key[data-val="%"]');
        } else if (key === '^') {
            simulateKeyPress('.key.scientific[data-val="^"]');
        } else if (key === '(') {
            simulateKeyPress('.key.scientific[data-val="("]');
        } else if (key === ')') {
            simulateKeyPress('.key.scientific[data-val=")"]');
        } else if (key === 'Enter' || key === '=') {
            const btn = document.getElementById('key-equals');
            if (btn) {
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 150);
                btn.click();
            }
        } else if (key === 'Backspace') {
            const btn = document.getElementById('key-backspace');
            if (btn) btn.click();
        } else if (key === 'Escape') {
            const btn = document.getElementById('key-clear');
            if (btn) btn.click();
        }
    });

    // Initialize display
    clearAll();
});

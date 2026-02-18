// ═══════════════════════════════════════════════════════════
// TRADUCTEUR PRO - JavaScript
// ═══════════════════════════════════════════════════════════

let currentDirection = { src: 'de', tgt: 'fr' };
let currentMode = 'word';

// Elements DOM
const directionBtns = document.querySelectorAll('.direction-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const inputText = document.getElementById('inputText');
const translateBtn = document.getElementById('translateBtn');
const resultSection = document.getElementById('resultSection');
const errorMessage = document.getElementById('errorMessage');
const detailsContainer = document.getElementById('detailsContainer');
const sourceFlag = document.getElementById('sourceFlag');
const targetFlag = document.getElementById('targetFlag');
const sourceWord = document.getElementById('sourceWord');
const mainTranslation = document.getElementById('mainTranslation');
const btnText = translateBtn.querySelector('.btn-text');
const spinner = translateBtn.querySelector('.spinner');

// ─────────────────────────────────────────────────────────
// Event Listeners
// ─────────────────────────────────────────────────────────

// Direction de traduction
directionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        directionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDirection.src = btn.dataset.src;
        currentDirection.tgt = btn.dataset.tgt;
        
        // Mettre à jour les flags
        updateFlags();
    });
});

// Mode (mot ou phrase)
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        
        // Mettre à jour le placeholder
        if (currentMode === 'word') {
            inputText.placeholder = 'Entrez un mot...';
        } else {
            inputText.placeholder = 'Entrez une phrase...';
        }
    });
});

// Bouton traduire
translateBtn.addEventListener('click', translate);

// Entrée avec touche Enter (Ctrl+Enter pour nouvelle ligne)
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        translate();
    }
});

// ─────────────────────────────────────────────────────────
// Fonctions principales
// ─────────────────────────────────────────────────────────

function updateFlags() {
    const srcFlag = currentDirection.src === 'de' ? '🇩🇪' : '🇫🇷';
    const tgtFlag = currentDirection.tgt === 'de' ? '🇩🇪' : '🇫🇷';
    sourceFlag.textContent = srcFlag;
    targetFlag.textContent = tgtFlag;
}

async function translate() {
    const text = inputText.value.trim();
    
    if (!text) {
        showError('Veuillez entrer du texte à traduire');
        return;
    }
    
    // Désactiver le bouton et afficher le spinner
    translateBtn.disabled = true;
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    // Cacher les résultats précédents et les erreurs
    resultSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                src: currentDirection.src,
                tgt: currentDirection.tgt,
                mode: currentMode
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la traduction');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Afficher les résultats
        displayResults(data);
        
    } catch (error) {
        showError('Erreur : ' + error.message);
    } finally {
        // Réactiver le bouton
        translateBtn.disabled = false;
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

function displayResults(data) {
    // Afficher la section résultat
    resultSection.classList.remove('hidden');
    
    // Afficher la traduction principale
    if (data.word) {
        // Mode mot
        sourceWord.textContent = data.word;
        mainTranslation.textContent = data.main_translation;
        
        // Détails
        detailsContainer.innerHTML = '';
        
        // Traductions multiples
        if (data.translations && data.translations.length > 1) {
            const card = createDetailCard('📖 Traductions', 
                data.translations.map(t => `<span class="translation-chip">${t}</span>`).join('')
            );
            detailsContainer.appendChild(card);
        }
        
        // Synonymes
        if (data.synonyms && data.synonyms.length > 0) {
            const card = createDetailCard('🔄 Mots proches', 
                data.synonyms.map(s => `<span class="translation-chip">${s}</span>`).join('')
            );
            detailsContainer.appendChild(card);
        }
        
        // Significations par sens (PONS)
        if (data.senses && data.senses.length > 0) {
            const sensesHtml = data.senses.map(s => `
                <div class="detail-item">
                    <strong>${s.meaning}</strong>
                    <p>→ ${s.translation}</p>
                </div>
            `).join('');
            const card = createDetailCard('🎯 Significations par sens', sensesHtml);
            detailsContainer.appendChild(card);
        }
        
        // Expressions (PONS)
        if (data.phrases && data.phrases.length > 0) {
            const phrasesHtml = data.phrases.map(p => `
                <div class="detail-item">
                    <strong>${p.phrase}</strong>
                    <p>→ ${p.translation}</p>
                </div>
            `).join('');
            const card = createDetailCard('💡 Expressions', phrasesHtml);
            detailsContainer.appendChild(card);
        }
        
        // Exemples (Glosbe)
        if (data.examples && data.examples.length > 0) {
            const examplesHtml = data.examples.map((ex, i) => `
                <div class="detail-item">
                    <strong>(${i + 1}) ${ex.original}</strong>
                    <p>→ ${ex.translation}</p>
                </div>
            `).join('');
            const card = createDetailCard('💬 Exemples en contexte', examplesHtml);
            detailsContainer.appendChild(card);
        }
        
    } else if (data.original) {
        // Mode phrase
        sourceWord.textContent = data.original;
        mainTranslation.textContent = data.translation;
        
        // Détails
        detailsContainer.innerHTML = '';
        
        // Vocabulaire mot à mot
        if (data.word_by_word && Object.keys(data.word_by_word).length > 0) {
            const wordsHtml = Object.entries(data.word_by_word).map(([word, trans]) => `
                <div class="word-by-word">
                    <span class="word-src">${word}</span>
                    <span class="word-arrow">→</span>
                    <span class="word-tgt">${trans}</span>
                </div>
            `).join('');
            const card = createDetailCard('📝 Vocabulaire (mot à mot)', wordsHtml);
            detailsContainer.appendChild(card);
        }
    }
    
    // Scroll vers les résultats
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function createDetailCard(title, contentHtml) {
    const card = document.createElement('div');
    card.className = 'detail-card';
    card.innerHTML = `
        <h3>${title}</h3>
        <div>${contentHtml}</div>
    `;
    return card;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    
    // Cacher après 5 secondes
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

// ─────────────────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────────────────

updateFlags();

// Auto-focus sur le champ de saisie (desktop uniquement)
if (window.innerWidth >= 768) {
    inputText.focus();
}

console.log('🌍 Traducteur Pro - Prêt !');

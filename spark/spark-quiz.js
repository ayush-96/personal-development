const DATA_URL = 'https://cdn.jsdelivr.net/gh/ayush-96/personal-development/spark/introduction-to-spark.json';
let questions = [], answeredCount = 0;
const answeredQuestions = new Set();

fetch(DATA_URL)
  .then(r => r.ok ? r.json() : Promise.reject())
  .then(data => {
    questions = data.map(q => {
      const shuffled = [...q.choices].sort(() => Math.random() - 0.5);
      const newCorrect = shuffled.indexOf(q.choices[q.correct]);
      return { ...q, choices: shuffled, correct: newCorrect };
    });
    renderQuiz();
    updateProgress();
    document.getElementById('loading').remove();
    document.getElementById('questions').style.display = 'block';
    document.getElementById('submitBtn').style.display = 'block';
  })
  .catch(() => document.getElementById('loading').innerHTML = '<p style="color:#ff6a00">Failed to load quiz.</p>');

function renderQuiz() {
  let html = '';
  questions.forEach((q, i) => {
    html += `
      <div class="q-card" id="q${i}">
        <div class="q-num">Question ${i+1} <span>of ${questions.length}</span></div>
        <p class="q-text">${q.question}</p>
        <div class="options">
          ${q.choices.map((opt, j) => `
            <label class="opt">
              <input type="radio" name="q${i}" value="${j}" onchange="onAnswer(${i})">
              <span class="radio"></span>
              <span class="opt-text">${opt}</span>
            </label>
          `).join('')}
        </div>
      </div>`;
  });
  document.getElementById('questions').innerHTML = html;
}

function onAnswer(i) {
  if (!answeredQuestions.has(i)) { answeredQuestions.add(i); answeredCount++; updateProgress(); }
  const next = i + 1;
  if (next < questions.length) document.getElementById(`q${next}`).scrollIntoView({behavior:'smooth',block:'center'});
  else document.getElementById('submitBtn').scrollIntoView({behavior:'smooth',block:'center'});
}

function updateProgress() {
  const total = questions.length;
  const pct = total ? (answeredCount / total) * 100 : 0;
  document.getElementById('progressText').textContent = `${answeredCount} / ${total}`;
  document.getElementById('progressFill').style.width = pct + '%';
}

function checkAnswers() {
  let score = 0;
  let feedback = `<h2 class="result-title">Your Results</h2>`;

  questions.forEach((q, i) => {
    const sel = document.querySelector(`input[name="q${i}"]:checked`);
    const user = sel ? +sel.value : -1;
    const correct = q.correct;
    const cl = String.fromCharCode(65 + correct);
    const ul = user !== -1 ? String.fromCharCode(65 + user) : '—';
    if (user === correct) score++;

    feedback += `
      <div class="fb ${user === correct ? 'right' : 'wrong'}">
        <strong class="clickable-q" onclick="document.getElementById('q${i}').scrollIntoView({behavior:'smooth',block:'center'})" style="cursor:pointer; color:#ff8c42;">
          Q${i+1}
        </strong> — ${user === correct ? 'Correct' : 'Incorrect'}
        ${user !== correct ? `<p><strong>Your answer:</strong> ${user === -1 ? 'Not answered' : ul + '. ' + q.choices[user]}</p>` : ''}
        <p><strong>Correct:</strong> ${cl}. ${q.choices[correct]}</p>
        <details class="expl"><summary>View Explanation</summary><div>${q.description.replace(/\n/g,'<br>')}</div></details>
      </div>`;
  });

  const pct = ((score / questions.length) * 100).toFixed(0);

  // ← THIS IS THE NEW CLEAN SCORE LINE WITH SPACE
  feedback += `
    <div class="final-score">
      <div class="big-num">${score}<small>/${questions.length}</small></div>
      <div class="big-pct">(${pct}%)</div>
    </div>`;

  if (score === questions.length) {
    triggerConfetti();
    feedback += `<div class="perfect">Perfect Score! You're a Spark Legend!</div>`;
  }

  feedback += `
    <div class="btns">
      <button onclick="retryQuiz()" class="btn-retry">Retry Quiz</button>
      <button onclick="window.location.href='/apache-spark-quiz-main'" class="btn-hub">Back to Spark Hub</button>
    </div>`;

  const r = document.getElementById('result');
  r.innerHTML = feedback;
  r.style.display = 'block';
  r.scrollIntoView({behavior:'smooth'});
}

function triggerConfetti() {
  confetti({particleCount:180, spread:70, origin:{y:0.6}});
}

function retryQuiz() {
  answeredCount = 0; answeredQuestions.clear(); updateProgress();
  document.getElementById('result').style.display = 'none';
  questions = questions.map(q => {
    const s = [...q.choices].sort(() => Math.random() - 0.5);
    return { ...q, choices: s, correct: s.indexOf(q.choices[q.correct]) };
  });
  renderQuiz();
  document.querySelector('.quiz-hero').scrollIntoView({behavior:'smooth'});
}
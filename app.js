/* Рус: Основная логика страницы assessment.html:
   - считаем правильность этапов 1-2
   - проверяем расчет σ и вывод "выдержал/не выдержал"
   - учитываем мем-блок (креатив)
   - формируем инженерный рейтинг + achievements
   - собираем 3-2-1 рефлексию
   - делаем кнопку "копировать результат"
*/

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function getCheckedValue(name){
  return qs(`input[name="${name}"]:checked`)?.value || "";
}

function safeTrim(v){ return (v || "").toString().trim(); }

function calcSigmaMPa(F, S){
  // Рус: σ = F/S (Па) => МПа
  const pa = F / S;
  return pa / 1_000_000;
}

function classifyLevel(score){
  // Рус: уровни для геймификации (можно настроить)
  if (score <= 2) return "🟠 Пластилин деңгейі";
  if (score <= 4) return "🟤 Ағаш деңгейі";
  if (score <= 6) return "🩶 Болат деңгейі";
  return "🟣 Титан деңгейі";
}

function buildAchievements(state){
  const ach = [];
  if (state.stage12 >= 2) ach.push("🧩 Graph Detective (визуалды+логика)");
  if (state.sigmaOk && state.strengthOk) ach.push("🧮 Stress Solver (кернеу есебі)");
  if (state.conclusionGood) ach.push("🛠️ Chief Constructor (ұсыныс/қорытынды)");
  if (state.memeGood) ach.push("🎭 Meme-Physics Creator (креатив)");
  if (ach.length === 0) ach.push("✨ Starter (бастау)");
  return ach;
}

function engineerRating(state){
  // Рус: Авторский рейтинг вместо обычных баллов
  // Логика:
  // - "Қатардағы техник": хотя бы этап 1 верный
  // - "Аға инженер": этапы 1-2 + расчет/сравнение
  // - "Бас конструктор": плюс аргументированный вывод и/или предложение
  const hasBasics = state.stage12 >= 1;
  const hasCalc = state.sigmaOk && state.strengthOk;
  const hasExpert = state.conclusionGood || state.suggestionGood;

  if (hasBasics && hasCalc && hasExpert) return "🏆 Бас конструктор";
  if (hasBasics && hasCalc) return "🔧 Аға инженер";
  if (hasBasics) return "🧰 Қатардағы техник";
  return "🧪 Жаттығушы (қайта қарап шық)";
}

function qualityCheckText(text, minLen){
  const t = safeTrim(text);
  return t.length >= minLen;
}

function compileResultText(payload){
  return [
    "=== Инженер-сарапшының тергеуі (НӘТИЖЕ) ===",
    `Оқушы деңгейі: ${payload.level}`,
    `Инженерлік рейтинг: ${payload.rating}`,
    "",
    "Achievements:",
    payload.achievements.map(a => `- ${a}`).join("\n"),
    "",
    "Тергеу нәтижелері:",
    `- 1-кезең (пластикалық): ${payload.stage1 ? "✅" : "❌"}`,
    `- 2-кезең (созылу): ${payload.stage2 ? "✅" : "❌"}`,
    `- 3-кезең (σ, МПа): ${payload.sigmaMPa.toFixed(2)} → ${payload.strengthText}`,
    "",
    "Сарапшылық қорытынды:",
    payload.conclusion ? payload.conclusion : "(жазылмады)",
    "",
    "Ұсыныс:",
    payload.suggestion ? payload.suggestion : "(жазылмады)",
    "",
    "Мем-физика:",
    payload.memePick ? `Таңдау: ${payload.memePick}` : "Таңдау: (жоқ)",
    payload.memeWhy ? `Дәлел: ${payload.memeWhy}` : "Дәлел: (жоқ)",
    "",
    "3–2–1 рефлексия:",
    "3 факт:",
    payload.facts3 ? payload.facts3 : "(жоқ)",
    "",
    "2 мысал:",
    payload.examples2 ? payload.examples2 : "(жоқ)",
    "",
    "1 сұрақ:",
    payload.question1 ? payload.question1 : "(жоқ)"
  ].join("\n");
}

window.addEventListener("DOMContentLoaded", () => {
  const calcBtn = qs("#calcBtn");
  const copyBtn = qs("#copyBtn");
  const resultBox = qs("#resultBox");

  if (!calcBtn || !resultBox) return;

  let lastResultText = "";

  calcBtn.addEventListener("click", () => {
    // --- Этапы 1-2
    const a1 = getCheckedValue("a1"); // правильный: B
    const a2 = getCheckedValue("a2"); // правильный: stretch
    const stage1 = (a1 === "B");
    const stage2 = (a2 === "stretch");

    // --- Этап 3: σ
    const sigmaInput = parseFloat(qs("#sigmaInput")?.value || "NaN");
    const strengthSel = qs("#strengthSelect")?.value || "";

    // "эталон" по данным из задачи
    const sigmaExpected = calcSigmaMPa(1_000_000, 0.05); // 20 МПа
    const sigmaOk = Number.isFinite(sigmaInput) && Math.abs(sigmaInput - sigmaExpected) <= 0.5; // допуск 0.5 МПа

    // правильный вывод: withstood (20 < 150)
    const strengthOk = (strengthSel === "withstood");
    const strengthText = strengthSel === "withstood"
      ? "Шыдады (σ < 150 МПа)"
      : (strengthSel === "failed" ? "Шыдамады (σ ≥ 150 МПа)" : "Қорытынды таңдалмады");

    // --- Экспертный вывод
    const conclusion = safeTrim(qs("#expertConclusion")?.value);
    const suggestion = safeTrim(qs("#expertSuggestion")?.value);

    // Рус: минимальные требования к качеству текста
    const conclusionGood = qualityCheckText(conclusion, 60); // ~3-5 предложений
    const suggestionGood = qualityCheckText(suggestion, 25);

    // --- Мем-блок
    const memePick = qs("#memeSelect")?.value || "";
    const memeWhy = safeTrim(qs("#memeJustification")?.value);
    const memeGood = (memePick !== "" && memeWhy.length >= 20);

    // --- 3-2-1 рефлексия
    const facts3 = safeTrim(qs("#facts3")?.value);
    const examples2 = safeTrim(qs("#examples2")?.value);
    const question1 = safeTrim(qs("#question1")?.value);

    // --- Скоринг (авторский, не "обычная отметка")
    // Рус: считаем баллы как внутреннюю механику уровней
    let score = 0;
    if (stage1) score += 1;
    if (stage2) score += 1;
    if (sigmaOk) score += 2;
    if (strengthOk) score += 1;
    if (conclusionGood) score += 1;
    if (suggestionGood) score += 1;
    if (memeGood) score += 1;

    const level = classifyLevel(score);
    const stage12 = (stage1 ? 1 : 0) + (stage2 ? 1 : 0);

    const state = { stage12, sigmaOk, strengthOk, conclusionGood, suggestionGood, memeGood };
    const achievements = buildAchievements(state);
    const rating = engineerRating(state);

    const payload = {
      level,
      rating,
      achievements,
      stage1,
      stage2,
      sigmaMPa: Number.isFinite(sigmaInput) ? sigmaInput : 0,
      strengthText,
      conclusion,
      suggestion,
      memePick,
      memeWhy,
      facts3,
      examples2,
      question1
    };

    lastResultText = compileResultText(payload);

    // --- UI output
    const tips = [];
    if (!stage1) tips.push("• 1-кезеңді қайта қара: пішін қайта келмесе — пластикалық.");
    if (!stage2) tips.push("• 2-кезең: «жіңішкеру» көбіне созылуға тән.");
    if (!sigmaOk) tips.push(`• Есеп: σ ≈ ${sigmaExpected.toFixed(2)} МПа болуы керек.`);
    if (!strengthOk) tips.push("• Салыстыру: 20 МПа < 150 МПа → «Шыдады».");
    if (!conclusionGood) tips.push("• Қорытындыны 3–5 сөйлеммен нақтыла (дәлел + ұсыныс).");
    if (memePick && !memeGood) tips.push("• Мем-физикада 1 сөйлем дәлелді ұзартып жаз (кемі 20 таңба).");
    if (!facts3 || !examples2 || !question1) tips.push("• 3–2–1 рефлексияны толықтыр (3 факт, 2 мысал, 1 сұрақ).");

    resultBox.innerHTML = `
      <div class="result-head">
        <div><b>Деңгей:</b> ${level}</div>
        <div><b>Рейтинг:</b> ${rating}</div>
      </div>
      <div style="margin-top:10px"><b>Achievements:</b><br>${achievements.map(a => `• ${a}`).join("<br>")}</div>
      <div style="margin-top:10px"><b>Қысқа қорытынды:</b><br>
        1-кезең: ${stage1 ? "✅" : "❌"} •
        2-кезең: ${stage2 ? "✅" : "❌"} •
        σ: ${Number.isFinite(sigmaInput) ? sigmaInput.toFixed(2) : "—"} МПа •
        ${strengthText}
      </div>
      ${tips.length ? `<div class="feedback warn" style="margin-top:12px"><b>Келесі қадамдар:</b><br>${tips.join("<br>")}</div>` : `<div class="feedback ok" style="margin-top:12px">Тамаша! Барлық негізгі бөлімдер толық ✅</div>`}
      <div class="card-lite" style="margin-top:12px">
        <div class="muted">Нәтиже мәтіні көшіруге дайын. «Нәтижені көшіру» батырмасын бас.</div>
      </div>
    `;

    if (copyBtn){
      copyBtn.disabled = false;
    }
  });

  copyBtn?.addEventListener("click", async () => {
    try{
      if (!lastResultText){
        alert("Алдымен «Нәтижені есептеу» батырмасын бас.");
        return;
      }
      await navigator.clipboard.writeText(lastResultText);
      copyBtn.textContent = "Көшірілді ✅";
      setTimeout(() => copyBtn.textContent = "Нәтижені көшіру", 1200);
    }catch(e){
      // Рус: запасной вариант — выделить текст в resultBox
      alert("Көшіру мүмкін болмады. Браузер рұқсат бермеді. Нәтижені қолмен көшір: төмендегі мәтінді белгіле.");
      resultBox.textContent = lastResultText;
    }
  });
});

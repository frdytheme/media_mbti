let currentQuestion = 0;
let answers = [];
let questions = [];
let results = {};

// ✅ JSON 데이터 로드
async function loadQuestions() {
  const qRes = await fetch("questions.json");
  questions = await qRes.json();

  const rRes = await fetch("results.json");
  results = await rRes.json();

  renderQuestion();
  updateProgress();
}

// ✅ 시작 버튼 → 테스트 화면 전환
document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "block";
});

// ✅ 질문 렌더링
function renderQuestion() {
  const q = questions[currentQuestion];
  document.getElementById("question-text").textContent = q.text;

  const circles = document.querySelectorAll(".likert-item .circle");
  circles.forEach((c, i) => {
    c.classList.remove("active");
    c.onclick = () => {
      circles.forEach((el) => el.classList.remove("active"));
      c.classList.add("active");
      answers[currentQuestion] = i + 1; // 1~5 저장
    };

    // ✅ 이전 선택 복원
    if (answers[currentQuestion] === i + 1) c.classList.add("active");
  });

  document.getElementById("back-btn").disabled = currentQuestion === 0;
  updateProgress();
}

// ✅ 진행도 업데이트
function updateProgress() {
  const bar = document.getElementById("progress-bar");
  const percent = ((currentQuestion + 1) / questions.length) * 100;
  bar.style.width = `${percent}%`;
}

// ✅ 다음 문항 이동
function goNextQuestion() {
  if (answers[currentQuestion] == null) {
    alert("선택지를 골라주세요!");
    return;
  }

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else {
    showResult();
  }
}

// ✅ 버튼 이벤트
document.getElementById("next-btn").addEventListener("click", goNextQuestion);
document.getElementById("back-btn").addEventListener("click", () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
  }
});

// ✅ 엔터키로 다음 문항 이동
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const activeElement = document.activeElement;
    if (activeElement.tagName === "BUTTON" || activeElement.tagName === "INPUT") return;
    goNextQuestion();
  }
});

// ✅ 결과 계산 및 표시
function showResult() {
  document.body.classList.add("show-result");

  const scores = { E: 0, I: 0, R: 0, F: 0, S: 0, P: 0, p: 0, A: 0 };
  const reverseTypes = ["p"]; // 통제력 역문항

  // ✅ 각 문항 점수 계산
  questions.forEach((q, i) => {
    const val = answers[i];
    if (val == null) return;

    let delta = val - 3; // 중앙값 3 기준
    if (reverseTypes.includes(q.type)) delta = -(val - 3); // 역문항 반전
    scores[q.type] += delta;
  });

  // ✅ 모든 문항을 '보통(3)'으로 선택했다면 BALN으로 고정
  const allMid = answers.length === questions.length && answers.every((v) => v === 3);

  let key;
  if (allMid) {
    key = "BALN";
  } else {
    const EI = scores.E >= scores.I ? "E" : "I";
    const RF = scores.R >= scores.F ? "R" : "F";
    const SP = scores.S >= scores.P ? "S" : "P";
    const PA = scores.p >= scores.A ? "P" : "A";
    key = `${EI}${RF}${SP}${PA}`;
  }

  const r = results[key] || results["BALN"];
  const tipsList = r.tips?.map((t) => `<li>${t}</li>`).join("") || "";

  // ✅ 각 리터러시 대항목 점수 계산 (0~10 스케일)
  const normalize = (v) => Math.max(0, Math.min(10, (v + 10) * 0.5));
  const radarScores = {
    "비판적 사고": normalize(scores.F),
    "탐색 주도성": normalize(scores.R),
    "자기 통제력": normalize(scores.p), // 역문항 이미 반영됨
    "균형 감각": normalize(scores.S),
    "정보 판단력": normalize(scores.A),
  };

  // ✅ 결과 페이지 렌더링
  document.body.innerHTML = `
    <div class="result-page" id="result-page">
      <h1 class="result-type">${key}</h1>
      <h2 class="result-title">${r.title}</h2>
      <p class="result-sub">${r.sub}</p>

      <div class="flip-card">
        <div class="flip-inner" id="flip-card">
          <div class="flip-front">
            <img src="${r.image}" alt="${r.title}" class="result-image">
          </div>
          <div class="flip-back">
            <canvas id="radarChart"></canvas>
          </div>
        </div>
      </div>

      <p class="result-desc">${r.desc}</p>

      <div class="result-detail">
        <h3>나의 미디어 성향</h3>
        <p>${r.detail.part1 || ""}</p>

        <h3>익숙한 행동 패턴</h3>
        <p>${r.detail.part2 || ""}</p>

        <h3>현명한 소비 루틴</h3>
        <p>${r.detail.part3 || ""}</p>

        <h3>나를 위한 미디어 설정법</h3>
        <p>${r.tips ? `<ul>${tipsList}</ul>` : ""}</p>
      </div>

      <div class="btn-group">
        <button id="retry-btn" class="retry-btn">다시 하기</button>
        <button id="save-btn" class="retry-btn">결과 저장하기</button>
      </div>
    </div>
  `;

  // ✅ 다시하기 버튼
  document.getElementById("retry-btn").addEventListener("click", () => location.reload());

  // ✅ 이미지 ↔ 그래프 토글 기능
  const flipCard = document.querySelector(".flip-card");
  flipCard.addEventListener("click", () => flipCard.classList.toggle("flipped"));

  // ✅ Chart.js 방사형 그래프 생성
  const ctx = document.getElementById("radarChart").getContext("2d");
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: Object.keys(radarScores),
      datasets: [
        {
          label: "나의 미디어 역량",
          data: Object.values(radarScores),
          backgroundColor: "rgba(52, 211, 153, 0.2)",
          borderColor: "#34d399",
          borderWidth: 2,
          pointBackgroundColor: "#10b981",
        },
      ],
    },
    options: {
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 10,
          angleLines: { color: "rgba(255,255,255,0.2)" },
          grid: { color: "rgba(255,255,255,0.2)" },
          pointLabels: { color: "#a5f3fc", font: { size: 14 } },
          ticks: { display: false },
          backgroundColor: "transparent",
        },
      },
      plugins: { legend: { display: false } },
    },
  });

  // ✅ 저장 기능 유지
  enableSaveFeature();
}

// ✅ 결과 저장 기능
function enableSaveFeature() {
  const saveBtn = document.getElementById("save-btn");
  const resultPage = document.getElementById("result-page");

  saveBtn.addEventListener("click", async () => {
    saveBtn.textContent = "저장 중...";
    saveBtn.disabled = true;

    try {
      const canvas = await html2canvas(resultPage, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
        scrollY: -window.scrollY,
      });

      const link = document.createElement("a");
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
      link.download = `MediaMBTI_Result_${formattedDate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("이미지 저장 중 오류:", err);
      alert("이미지 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      saveBtn.textContent = "결과 저장하기";
      saveBtn.disabled = false;
    }
  });
}

// ✅ 초기 실행
loadQuestions();

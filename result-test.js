window.onload = async () => {
  const res = await fetch("results.json");
  const results = await res.json();
  const key = "BALN"; // ✅ 보고 싶은 타입 변경 가능 (ERSP, ERPP 등)
  const r = results[key];
  const tipsList = r.tips?.map((t) => `<li>${t}</li>`).join("") || "";

  document.getElementById("result-container").innerHTML = `
    <div class="result-page">
      <img src="${r.image}" alt="${r.title}" class="result-image">
      <h1 class="result-type">${key}</h1>
      <h2 class="result-title">${r.title}</h2>
      <p class="result-sub">${r.sub}</p>
      <p class="result-desc"><strong>${r.desc}</strong></p>
      

      <div class="result-detail">
        <h3>나의 미디어 성향</h3>
        <p>${r.detail.part1}</p>

        <h3>익숙한 행동 패턴</h3>
        <p>${r.detail.part2}</p>

        <h3>현명한 소비 루틴</h3>
        <p>${r.detail.part3}</p>

        <h3>나를 위한 미디어 설정법</h3>
        <p>${r.tips ? `<ul>${tipsList}</ul>` : ""}</p>
      </div>

      <button class="retry-btn" onclick="location.reload()">다시 보기</button>
    </div>
  `;
};

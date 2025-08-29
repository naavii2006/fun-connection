// Helper to get element by ID
const $ = id => document.getElementById(id);

/* ------------------ Percentage Calculation ------------------ */
function onlyLetters(str){
  return (str || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function frequencySequenceUniqueOrdered(phrase){
  const clean = onlyLetters(phrase);
  const counts = {};
  for (const ch of clean) counts[ch] = (counts[ch] || 0) + 1;
  const seen = new Set();
  const seq = [];
  for (const ch of clean) {
    if (!seen.has(ch)) {
      seq.push(counts[ch]);
      seen.add(ch);
    }
  }
  return seq;
}

function outsideInsideReduce(arr){
  const next = [];
  let i = 0, j = arr.length - 1;
  while (i < j) { next.push(arr[i] + arr[j]); i++; j--; }
  if (i === j) next.push(arr[i]);
  return next;
}

function reduceUntilTwoDigitsOr100(initial){
  let seq = initial.slice();
  while (seq.length > 2) seq = outsideInsideReduce(seq);
  let percentStr = String(seq[0]) + String(seq[1] || '0');
  while (percentStr.length !== 2 && percentStr !== "100") {
    let digits = percentStr.split("").map(d => parseInt(d,10));
    while (digits.length > 2) digits = outsideInsideReduce(digits);
    percentStr = String(digits[0]) + String(digits[1]);
  }
  return parseInt(percentStr,10);
}

const insertWordMap = {
  friends: "FRIENDS",
  love: "LOVE",
  enemies: "ENEMIES",
  siblings: "SIBLINGS",
  marriage: "MARRIAGE",
  crush: "CRUSH",
  business: "BUSINESS"
};

function labelFor(relation, percent){
  if (relation === "love"){
    if (percent >= 90) return "Soulmates ❤️";
    if (percent >= 70) return "Strong Love 💖";
    if (percent >= 50) return "Lovely Pair 💕";
    if (percent >= 30) return "Potential Crush 😳";
    return "Just Friends 🙂";
  }
  if (relation === "friends"){
    if (percent >= 90) return "Unbreakable Bond ✨";
    if (percent >= 75) return "Besties Forever 🤝";
    if (percent >= 60) return "Great Friends 😊";
    if (percent >= 45) return "Good Pals 🙂";
    if (percent >= 25) return "Casual Friends 👋";
    return "Strange Pairing 🤨";
  }
  if (relation === "enemies"){
    if (percent >= 80) return "Arch Rivals 💥";
    if (percent >= 50) return "Sparring Partners ⚔️";
    return "Mostly Neutral 😐";
  }
  if (relation === "marriage"){
    if (percent >= 85) return "Highly Compatible 💍";
    if (percent >= 60) return "Good Match 💒";
    if (percent >= 40) return "Possibly Okay 🤔";
    return "Not Likely 🚫";
  }
  if (relation === "siblings"){
    if (percent >= 80) return "Like Siblings 👨‍👩‍👧";
    if (percent >= 50) return "Family Vibes 🏡";
    return "Not Very Sibling-y 😅";
  }
  if (relation === "crush"){
    if (percent >= 80) return "Crush Alert 💘";
    if (percent >= 50) return "Cute Interest 😊";
    return "Low Crush Level 😶";
  }
  if (relation === "business"){
    if (percent >= 85) return "Power Partners 📈";
    if (percent >= 60) return "Good Collaborators 🤝";
    if (percent >= 40) return "Maybe Work Together 🧠";
    return "Not Great for Business ⚠️";
  }
  return "—";
}

function computeFromNames(n1, n2, relation){
  const ins = insertWordMap[relation] || "FRIENDS";
  const combined = onlyLetters(n1) + ins + onlyLetters(n2);
  if (!combined) return null;
  const freqSeq = frequencySequenceUniqueOrdered(combined);
  const percent = reduceUntilTwoDigitsOr100(freqSeq);
  return { percent, combined };
}

/* ------------------ Google Form Submission ------------------ */
function sendToGoogleForm(name1, name2, relation, percent) {
  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdlM_3q71vq62iRuZEs-oCilgQ-dquthc2ag86f6pU3R3uYbg/formResponse";
  const data = new FormData();
  data.append("entry.782098115", name1);
  data.append("entry.2098703439", name2);
  data.append("entry.721856673", relation);
  data.append("entry.1083877023", percent);

  fetch(formUrl, { method: "POST", mode: "no-cors", body: data });
}

/* ------------------ NeonDB Submission ------------------ */
async function saveToDB(name1, name2, relation, percent){
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name1, name2, relationship: relation, percent})
    });
    const data = await res.json();
    if (!data.success) console.error('Save failed', data.error);
  } catch(err) { console.error('Network error', err); }
}

/* ------------------ Display Result ------------------ */
function showResult(n1, n2, relation){
  const out = computeFromNames(n1, n2, relation);
  const resultArea = $("resultArea");
  if (!out) { 
    resultArea.style.display = "none"; 
    alert("Please enter valid letters!"); 
    return; 
  }

  const p = out.percent;
  const label = labelFor(relation, p);

  $("percentEl").textContent = p + "%";
  $("labelEl").textContent = label;
  $("pairEl").textContent = `${n1.trim()} + ${n2.trim()} (inserted: ${insertWordMap[relation]})`;
  resultArea.style.display = "";

  if(p >= 80) fireConfetti();

  // Send data
  saveToDB(n1.trim(), n2.trim(), relation, p);
  sendToGoogleForm(n1.trim(), n2.trim(), relation, p);
}

/* ------------------ Confetti ------------------ */
function fireConfetti(){
  const root = $("confetti");
  root.innerHTML = "";
  const colors = ["#ff3b82","#ffcc00","#00c2ff","#8a2be2","#00d177"];
  const pieces = 36;
  for (let i=0;i<pieces;i++){
    const el = document.createElement("div");
    el.className = "piece";
    el.style.background = colors[i % colors.length];
    const startX = window.innerWidth/2 + (Math.random()*200-100);
    const startY = window.innerHeight/2 + (Math.random()*50-25);
    el.style.left = startX + "px";
    el.style.top = startY + "px";
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    root.appendChild(el);
    const dx = (Math.random()*2-1)*800;
    const dy = - (200 + Math.random()*800);
    const rot = (Math.random()*720-360);
    el.animate([
      { transform: `translate(0px,0px) rotate(${Math.random()*360}deg)`, opacity:1 },
      { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity:0 }
    ], { duration: 1200 + Math.random()*800, easing: 'cubic-bezier(.1,.7,0,1)' });
    setTimeout(()=> el.remove(), 2200);
  }
}

/* ------------------ Event Listeners ------------------ */
$("calcBtn").addEventListener("click", () =>
  showResult($("name1").value, $("name2").value, $("relation").value)
);

$("clearBtn").addEventListener("click", () => {
  $("name1").value = $("name2").value = "";
  $("resultArea").style.display = "none";
});

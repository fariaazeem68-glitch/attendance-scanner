// ========== STUDENT DATA ==========
const students = [
  { id: "8", name: "Anum" },
  { id: "17", name: "mairah" },
  { id: "30", name: "zeba" },
  { id: "13", name: "faria" },

];

// ========== ATTENDANCE RECORDS ==========
let records = JSON.parse(localStorage.getItem("attendance")) || [];

// ========== MARK BY ID ==========
function markAttendance() {
  const input = document.getElementById("studentId");
  const id = input.value.trim();
  if (!id) return alert("Please enter a Student ID");

  const student = students.find(s => s.id === id);
  if (!student) return alert("Student not found. Try 101–105");

  const today = new Date().toDateString();
  const already = records.find(r => r.id === id && new Date(r.time).toDateString() === today);
  if (already) return alert(`${student.name} is already marked present today`);

  const now = new Date();
  records.push({
    id: student.id,
    name: student.name,
    status: "Present",
    time: now.toISOString()
  });

  localStorage.setItem("attendance", JSON.stringify(records));
  input.value = "";
  renderTable();
  alert(`✅ ${student.name} marked Present at ${now.toLocaleTimeString()}`);
}

// ========== DASHBOARD ==========
function renderTable(filter = "all") {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  const today = new Date().toDateString();
  const todayRecords = records.filter(r => new Date(r.time).toDateString() === today);

  students.forEach(student => {
    const record = todayRecords.find(r => r.id === student.id);
    const status = record ? "Present" : "Absent";
    const time = record ? new Date(record.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—";

    if (filter !== "all" && status !== filter) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${student.id}</td>
      <td class="status-${status.toLowerCase()}">${status}</td>
      <td>${time}</td>
    `;
    tbody.appendChild(tr);
  });
}

function filterStatus(status) {
  renderTable(status);
}

function clearRecords() {
  if (confirm("Clear all attendance records for today?")) {
    const today = new Date().toDateString();
    records = records.filter(r => new Date(r.time).toDateString() !== today);
    localStorage.setItem("attendance", JSON.stringify(records));
    renderTable();
  }
}

// ========== TEACHABLE MACHINE ==========
// ⚠️ REPLACE THIS URL with your own Teachable Machine model URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/1dCDn7Hhp/";

let model, webcam, maxPredictions;
let currentPrediction = null;

async function startFaceRecognition() {
  try {
    document.getElementById("startCamera").textContent = "Loading model...";
    
    model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
    maxPredictions = model.getTotalClasses();

    const flip = true;
    webcam = new tmImage.Webcam(320, 240, flip);
    await webcam.setup();
    await webcam.play();
    
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    document.getElementById("startCamera").style.display = "none";
    document.getElementById("stopCamera").style.display = "inline-block";
    document.getElementById("markFromFace").style.display = "inline-block";

    window.requestAnimationFrame(loop);
  } catch (err) {
    alert("Error loading model. Please check the MODEL_URL in script.js");
    console.error(err);
    document.getElementById("startCamera").textContent = "Start Camera";
  }
}

async function loop() {
  if (webcam) {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
  }
}

async function predict() {
  const prediction = await model.predict(webcam.canvas);
  
  let best = prediction[0];
  for (let i = 1; i < maxPredictions; i++) {
    if (prediction[i].probability > best.probability) {
      best = prediction[i];
    }
  }

  currentPrediction = best;
  const labelContainer = document.getElementById("label-container");

  if (best.probability > 0.75) {
    labelContainer.innerHTML = `
      <strong style="color:#22c55e">Detected: ${best.className}</strong><br>
      Confidence: ${(best.probability * 100).toFixed(1)}%
    `;
  } else {
    labelContainer.innerHTML = `<span style="color:#aaa">Looking for face...</span>`;
    currentPrediction = null;
  }
}

function markFromFace() {
  if (!currentPrediction || currentPrediction.probability < 0.75) {
    alert("No clear face detected. Please look at the camera.");
    return;
  }

  const studentName = currentPrediction.className;
  const student = students.find(s => s.name.toLowerCase() === studentName.toLowerCase());
  
  if (!student) {
    alert(`Student "${studentName}" not found in the system.`);
    return;
  }

  const today = new Date().toDateString();
  const already = records.find(r => r.id === student.id && new Date(r.time).toDateString() === today);
  
  if (already) {
    alert(`${student.name} is already marked present today`);
    return;
  }

  const now = new Date();
  records.push({
    id: student.id,
    name: student.name,
    status: "Present",
    time: now.toISOString()
  });

  localStorage.setItem("attendance", JSON.stringify(records));
  renderTable();
  alert(`✅ ${student.name} marked Present via Face Recognition!`);
}

function stopCamera() {
  if (webcam) {
    webcam.stop();
    document.getElementById("webcam-container").innerHTML = "";
  }
  document.getElementById("startCamera").style.display = "inline-block";
  document.getElementById("startCamera").textContent = "Start Camera";
  document.getElementById("stopCamera").style.display = "none";
  document.getElementById("markFromFace").style.display = "none";
  document.getElementById("label-container").innerHTML = "";
}

// Start
renderTable();

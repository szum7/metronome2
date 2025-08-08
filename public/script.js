const socket = io();

let tempo = 120;
let startTime = null;
let intervalId = null;
let offsetMs = 0;

const tempoInput = document.getElementById("tempoInput");
const setTempoBtn = document.getElementById("setTempoBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const offsetSlider = document.getElementById("offsetSlider");
const offsetValue = document.getElementById("offsetValue");

// Set tempo
setTempoBtn.onclick = () => {
  const newTempo = parseInt(tempoInput.value);
  if (newTempo > 0) {
    socket.emit("setTempo", newTempo);
  }
};

// Start metronome
startBtn.onclick = () => {
  socket.emit("start");
};

// Stop metronome (local)
stopBtn.onclick = () => {
  stopMetronome();
};

// Offset slider
offsetSlider.oninput = () => {
  offsetMs = parseFloat(offsetSlider.value);
  offsetValue.textContent = offsetMs.toFixed(1);
};

// Socket events
socket.on("tempo", (newTempo) => {
  tempo = newTempo;
  tempoInput.value = tempo;
  updateOffsetMax();
});

socket.on("start", ({ tempo: t, startTime: s }) => {
  tempo = t;
  startTime = s;
  updateOffsetMax();
  stopMetronome();
  scheduleMetronome();
});

function updateOffsetMax() {
  const interval = 60000 / tempo;
  offsetSlider.max = interval;
}

// Metronome logic
function scheduleMetronome() {
  const interval = 60000 / tempo;

  function tick() {
    const now = Date.now();
    const adjustedNow = now + offsetMs;
    const elapsed = adjustedNow - startTime;
    const tickNumber = Math.floor(elapsed / interval);
    const nextTickTime = startTime + (tickNumber + 1) * interval - offsetMs;
    const delay = nextTickTime - now;

    if (delay < 0) {
      // Already missed tick, skip to next
      tick();
      return;
    }

    intervalId = setTimeout(() => {
      playClick();
      tick();
    }, delay);
  }

  tick();
}

function stopMetronome() {
  if (intervalId) {
    clearTimeout(intervalId);
    intervalId = null;
  }
}

function playClick() {
  console.log("Tick");
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
  osc.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

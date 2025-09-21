let audioCtx = null;
let isPlaying = false;
let currentTimer = null;
let bpm = 60;
const arm = document.getElementById("arm");
const toggleBtn = document.getElementById("toggleBtn");
const bpmInput = document.getElementById("bpm");
const tapBtn = document.getElementById("tapBtn");

function playTick() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 1000;
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

function startMetronome() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const interval = (60 / bpm) * 1000;
  arm.style.animation = `swing ${interval * 2}ms infinite linear`;

  playTick();
  currentTimer = setInterval(playTick, interval);
}

function stopMetronome() {
  clearInterval(currentTimer);
  arm.style.animation = "none";
  currentTimer = null;
}

toggleBtn.addEventListener("click", () => {
  bpm = parseInt(bpmInput.value);
  if (isNaN(bpm) || bpm < 30 || bpm > 300) {
    alert("Please enter a valid BPM between 30 and 300.");
    return;
  }

  if (!isPlaying) {
    startMetronome();
    toggleBtn.textContent = "Stop";
  } else {
    stopMetronome();
    toggleBtn.textContent = "Start";
  }

  isPlaying = !isPlaying;
});

// TAP TEMPO feature
let tapTimes = [];

tapBtn.addEventListener("click", () => {
  const now = performance.now();
  tapTimes.push(now);

  // Only keep the last 4 taps
  if (tapTimes.length > 4) tapTimes.shift();

  if (tapTimes.length >= 2) {
    const intervals = [];
    for (let i = 1; i < tapTimes.length; i++) {
      intervals.push(tapTimes[i] - tapTimes[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const newBpm = Math.round(60000 / avgInterval);

    if (newBpm >= 30 && newBpm <= 300) {
      bpm = newBpm;
      bpmInput.value = bpm;

      if (isPlaying) {
        stopMetronome();
        startMetronome();
      }
    }
  }
});

const tempoScale = document.getElementById("tempoScale");

// Generate tick marks for tempos from 40 to 208
function renderTempoScale(currentBpm) {
  tempoScale.innerHTML = "";

  const minBpm = 40;
  const maxBpm = 208;
  const step = 8;

  const closest = Math.round((currentBpm - minBpm) / step) * step + minBpm;

  for (let bpmValue = minBpm; bpmValue <= maxBpm; bpmValue += step) {
    const tick = document.createElement("div");
    tick.className = "tick";

    // Highlight only one closest match
    if (bpmValue === closest) {
      tick.classList.add("highlight");
    }

    tempoScale.appendChild(tick);
  }
}


// Call it on load and when BPM changes
renderTempoScale(bpm);

bpmInput.addEventListener("input", () => {
  bpm = parseInt(bpmInput.value);
  if (!isNaN(bpm)) renderTempoScale(bpm);
});

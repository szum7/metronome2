const socket = io();
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let timeOffset = 0;

const bpmInput = document.getElementById("bpm");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const status = document.getElementById("status");
const visual = document.getElementById("visual");

let metronomeActive = false;
let nextNoteTime = 0;
let schedulerId = null;

startBtn.addEventListener("click", async () => {
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const bpm = parseInt(bpmInput.value);
    socket.emit("metronome:start", { bpm, delay: 5000 }); // start 5s later
});

stopBtn.addEventListener("click", () => {
    stopMetronome();
});

function stopMetronome() {
    metronomeActive = false;
    nextNoteTime = 0;
    schedulerId = null;
    status.textContent = "🛑 Metronome stopped.";
    visual.style.background = "gray";
}

socket.on("connect", () => {
    function syncTime() {
        const clientSentTime = Date.now();
        socket.emit("time:ping", clientSentTime);
    }

    socket.on("time:pong", ({ clientSentTime, serverTime }) => {
        const clientReceivedTime = Date.now();
        const latency = (clientReceivedTime - clientSentTime) / 2;
        timeOffset = (serverTime + latency) - clientReceivedTime;
        console.log(`⏱ Time synced. Latency: ${latency}ms, Offset: ${timeOffset}ms`);
    });

    for (let i = 0; i < 5; i++) setTimeout(syncTime, i * 500);
});

socket.on("metronome:begin", ({ bpm, startAt }) => {
    const interval = 60 / bpm;
    const startTime = audioCtx.currentTime + ((startAt - Date.now() + timeOffset) / 1000);
    nextNoteTime = startTime;
    let beatCount = 0;

    metronomeActive = true;
    status.textContent = `✅ Metronome starts at ${new Date(startAt).toLocaleTimeString()}`;
    console.log(`🎵 Starting metronome at audioCtx time: ${startTime}`);

    function scheduleClick(time, count) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.value = count % 4 === 0 ? 1000 : 800;
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.start(time);
        osc.stop(time + 0.1);

        setTimeout(() => {
            visual.style.background = "#0f0";
            setTimeout(() => (visual.style.background = "gray"), 100);
        }, (time - audioCtx.currentTime) * 1000);
    }

    function scheduler() {
        if (!metronomeActive) return;

        const lookahead = 0.1;

        while (nextNoteTime < audioCtx.currentTime + lookahead) {
            scheduleClick(nextNoteTime, beatCount);
            nextNoteTime += interval;
            beatCount++;
        }

        schedulerId = requestAnimationFrame(scheduler);
    }

    scheduler();
});

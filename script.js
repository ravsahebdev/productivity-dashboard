// chhote localStorage helpers, get/set safely (JSON parse fail na ho isliye try catch)
const LS = {
    get(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v === null ? fallback : JSON.parse(v);
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
    },
};

// -- toast notification --
const toastEl = document.querySelector("#toast");
let toastTimer;
function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

// welcome popup -> pehli baar aane wale user se naam pucho, phir localStorage me save
const welcomeOverlay = document.querySelector("#welcomeOverlay");
const welcomeForm = document.querySelector("#welcomeForm");
const welcomeNameInput = document.querySelector("#welcomeNameInput");
const welcomeError = document.querySelector("#welcomeError");
const usernameEl = document.querySelector("#username");
const avatarEl = document.querySelector(".avatar");

function applyUsername(name) {
    usernameEl.textContent = name;
    if (avatarEl) {
        avatarEl.setAttribute("title", name);
        const initialSpan = avatarEl.querySelector("span");
        if (initialSpan) initialSpan.textContent = name.trim().charAt(0).toUpperCase() || "U";
    }
}

function initWelcome() {
    const savedName = LS.get("username", null);
    if (savedName && String(savedName).trim()) {
        // already naam save hai to popup skip, seedha greet kardo
        applyUsername(savedName);
        welcomeOverlay.classList.add("hidden");
        return;
    }
    // naam nahi mila localStorage me toh popup dikhao
    welcomeOverlay.classList.remove("hidden");
    // welcomeOverlay.style.display = "flex"; -- class approach use kar rahe hain, isko hata diya
    setTimeout(() => welcomeNameInput.focus(), 300);
}

welcomeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = welcomeNameInput.value.trim();
    if (!name) {
        welcomeError.textContent = "Please enter your name to continue.";
        welcomeNameInput.focus();
        return;
    }
    welcomeError.textContent = "";
    LS.set("username", name);
    applyUsername(name);
    welcomeOverlay.classList.add("hidden");
});

initWelcome();

// ---- simple SPA router, sidebar click pe view switch hota hai ----
const views = document.querySelectorAll(".view");
const navBtns = document.querySelectorAll("[data-view]");
function showView(name) {
    views.forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
    document.querySelectorAll(".nav-item").forEach((n) => {
        n.classList.toggle("active", n.dataset.view === name);
    });
    // view change hote hi scroll top pe le aao warna weird lagta hai
    document.querySelector(".main").scrollTo({ top: 0, behavior: "smooth" });
    if (name === "motivation") loadMotivationQuote();
    if (name === "weather") renderWeatherView();
}
navBtns.forEach((el) => {
    el.addEventListener("click", () => showView(el.dataset.view));
    el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showView(el.dataset.view); }
    });
});
document.querySelectorAll("[data-back]").forEach((b) =>
    b.addEventListener("click", () => showView("home"))
);

// clock update + greeting msg + time ke hisab se bg change -- sab yaha
const headerDate = document.querySelector("#headerDate");
const headerTime = document.querySelector("#headerTime");
const wTime = document.querySelector("#wTime");
const wDate = document.querySelector("#wDate");
const greetText = document.querySelector("#greetText");

function pad(n) { return n < 10 ? "0" + n : "" + n; }

function updateClock() {
    const now = new Date();
    const dOpts = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    const dStr = now.toLocaleDateString(undefined, dOpts);
    const timeStr12 = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
    const timeStrFull = `${pad(now.getHours() % 12 || 12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${now.getHours() >= 12 ? "PM" : "AM"}`;

    headerDate.textContent = dStr;
    headerTime.textContent = timeStr12;
    wTime.textContent = timeStrFull;
    wDate.textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const h = now.getHours();
    let g = "Good Evening";
    if (h < 5) g = "Good Night";
    else if (h < 12) g = "Good Morning";
    else if (h < 17) g = "Good Afternoon";
    else if (h < 21) g = "Good Evening";
    else g = "Good Night";
    greetText.textContent = g;
}
updateClock();
setInterval(updateClock, 1000);

// bg 4 category me change hota hai based on current hour
function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "morning";
    if (h >= 12 && h < 17) return "afternoon";
    if (h >= 17 && h < 21) return "evening";
    return "night";
}
function applyBg(name) {
    document.body.classList.remove("bg-morning", "bg-afternoon", "bg-evening", "bg-night", "bg-rain", "bg-nature");
    document.body.classList.add(`bg-${name}`);
    document.querySelectorAll("#bgGallery .bg-thumb").forEach((s) =>
        s.classList.toggle("active", s.dataset.bg === name)
    );
    LS.set("bg-override", name);
}
// agar user ne manually bg select kiya hai to wahi chalega, warna auto detect
applyBg(LS.get("bg-override", null) || getTimeOfDay());
document.querySelectorAll("#bgGallery .bg-thumb").forEach((s) =>
    s.addEventListener("click", () => applyBg(s.dataset.bg))
);
// 10-10 min me check karte raho, agar override nahi hai to bg update hota rahe
setInterval(() => {
    const override = LS.get("bg-override", null);
    if (!override) applyBg(getTimeOfDay());
}, 10 * 60 * 1000);

// -- dark/light theme toggle, dono jagah (sidebar + widget) se kaam karega --
const themeToggle = document.querySelector("#themeToggle");
const wThemeToggle = document.querySelector("#wThemeToggle");
function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    LS.set("theme", t);
}
applyTheme(LS.get("theme", "dark"));
function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
}
themeToggle.addEventListener("click", toggleTheme);
themeToggle.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTheme(); } });
wThemeToggle.addEventListener("click", toggleTheme);
wThemeToggle.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTheme(); } });

// TODO LIST -- add, delete, complete, important sab isi block me hai
const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoListEl = document.querySelector("#todoList");
const todoEmpty = document.querySelector("#todoEmpty");
const tasksDoneEl = document.querySelector("#tasksDone");
const tasksTotalEl = document.querySelector("#tasksTotal");
const focusBar = document.querySelector("#focusBar");
const focusValue = document.querySelector("#focusValue");
let todos = LS.get("todos", []);

function saveTodos() {
    LS.set("todos", todos);
    console.log("todos saved:", todos.length);
    renderTodos();
    updateStats();
}
function renderTodos() {
    todoListEl.innerHTML = "";
    // important wale sabse upar, phir pending, done wale sabse neeche
    const sortedTodos = [...todos].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.important !== b.important) return a.important ? -1 : 1;
        return 0;
    });
    // pehle .sort() ka result seedha yaha map karta tha but list update pe issue aa raha tha, ab loop se kar rahe
    // const sorted2 = sortedTodos.map(t => t); -- isko use nahi kar rahe abhi
    for (const t of sortedTodos) {
        const li = document.createElement("li");
        li.className = `todo-item${t.done ? " done" : ""}${t.important ? " important" : ""}`;
        li.innerHTML = `
            <button class="todo-check" data-action="toggle" aria-label="Toggle complete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <span class="todo-text">${escapeHtml(t.text)}</span>
            <div class="todo-actions">
                <button class="todo-btn star${t.important ? " active" : ""}" data-action="star" aria-label="Mark important">
                    <svg viewBox="0 0 24 24" fill="${t.important ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9 16 14 18 21 12 17 6 21 8 14 2 9 9 9"></polygon></svg>
                </button>
                <button class="todo-btn del" data-action="delete" aria-label="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>
            </div>`;
        li.querySelector('[data-action="toggle"]').addEventListener("click", () => {
            t.done = !t.done; saveTodos();
        });
        li.querySelector('[data-action="star"]').addEventListener("click", () => {
            t.important = !t.important; saveTodos();
        });
        li.querySelector('[data-action="delete"]').addEventListener("click", () => {
            todos = todos.filter((x) => x.id !== t.id); saveTodos();
        });
        todoListEl.appendChild(li);
    }
    todoEmpty.classList.toggle("show", todos.length === 0);
}
todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    todos.push({ id: Date.now().toString(36), text, done: false, important: false });
    todoInput.value = "";
    saveTodos();
    toast("Task added");
});
function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// daily goals ka section, todo jaisa hi hai bas thoda simple
const goalForm = document.querySelector("#goalForm");
const goalInput = document.querySelector("#goalInput");
const goalListEl = document.querySelector("#goalList");
const goalEmpty = document.querySelector("#goalEmpty");
const goalsBar = document.querySelector("#goalsBar");
const goalsProgress = document.querySelector("#goalsProgress");
let goals = LS.get("goals", []);

function saveGoals() { LS.set("goals", goals); renderGoals(); updateStats(); }
function renderGoals() {
    goalListEl.innerHTML = "";
    goals.forEach((g) => {
        const li = document.createElement("li");
        li.className = `todo-item${g.done ? " done" : ""}`;
        li.innerHTML = `
            <button class="todo-check" data-action="toggle" aria-label="Toggle complete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <span class="todo-text">${escapeHtml(g.text)}</span>
            <div class="todo-actions">
                <button class="todo-btn del" data-action="delete" aria-label="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
            </div>`;
        li.querySelector('[data-action="toggle"]').addEventListener("click", () => {
            g.done = !g.done; saveGoals();
        });
        li.querySelector('[data-action="delete"]').addEventListener("click", () => {
            goals = goals.filter((x) => x.id !== g.id); saveGoals();
        });
        goalListEl.appendChild(li);
    });
    const done = goals.filter((g) => g.done).length;
    const total = goals.length;
    goalsProgress.textContent = `${done} / ${total}`;
    goalsBar.style.width = total > 0 ? `${(done / total) * 100}%` : "0%";
    goalEmpty.classList.toggle("show", goals.length === 0);
}
goalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = goalInput.value.trim();
    if (!text) return;
    goals.push({ id: Date.now().toString(36), text, done: false });
    goalInput.value = "";
    saveGoals();
    toast("Goal added");
});

// yaha pe stats calculate hote hai -- streak, points, focus % waghera
function updateStats() {
    const done = todos.filter((t) => t.done).length;
    const total = todos.length;
    tasksDoneEl.textContent = done;
    tasksTotalEl.textContent = total;

    // focus % = todo + goals dono ka completion ratio nikal ke
    const goalsDone = goals.filter((g) => g.done).length;
    const goalsTotal = goals.length;
    const combined = total + goalsTotal;
    const combinedDone = done + goalsDone;
    const pct = combined > 0 ? Math.round((combinedDone / combined) * 100) : 0;
    focusBar.style.width = pct + "%";
    focusValue.textContent = pct + "%";

    // point system -> task complete = 10, goal complete = 5
    const pts = done * 10 + goalsDone * 5;
    document.querySelector("#totalPoints").textContent = pts;

    // streak wala part, localStorage me store hota hai taki refresh pe na ude
    const streak = maybeUpdateStreak(done + goalsDone);
    document.querySelector("#streakDays").textContent = streak;
}
function maybeUpdateStreak(activityCount) {
    const today = new Date().toDateString();
    const data = LS.get("streak", { day: null, count: 0, hadActivityToday: false });
    if (data.day !== today) {
        // naya din aagaya, reset karna padega
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (data.day === yesterday.toDateString() && data.hadActivityToday) {
            data.count = data.count; // yesterday completed a task -> keep chain
        } else if (data.day !== yesterday.toDateString()) {
            data.count = 0;
        }
        data.day = today;
        data.hadActivityToday = false;
    }
    if (activityCount > 0 && !data.hadActivityToday) {
        data.count = (data.count || 0) + 1;
        data.hadActivityToday = true;
    }
    LS.set("streak", data);
    return data.count || 0;
}

// daily planner -- type karte hi auto save ho jata hai, submit button nahi hai
const plannerGrid = document.querySelector("#plannerGrid");
const plannerHint = document.querySelector("#plannerHint");
const plannerData = LS.get("planner", {});
const slots = [
    "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM",
    "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
    "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"
];
// hourly slots chahiye the pehle 24 ghante ke, but itna scroll karna padta tha to 6AM-9PM tak hi rakh diya
// const slots = Array.from({length: 24}, (_, i) => `${i}:00`); -- ye purana approach tha
for (const s of slots) {
    const el = document.createElement("div");
    el.className = "planner-slot";
    el.innerHTML = `<div class="planner-time">${s}</div><textarea placeholder="Plan something…" data-slot="${s}"></textarea>`;
    const ta = el.querySelector("textarea");
    ta.value = plannerData[s] || "";
    ta.addEventListener("input", () => {
        plannerData[s] = ta.value;
        LS.set("planner", plannerData);
        plannerHint.textContent = "Saved ✓";
        clearTimeout(ta._t);
        ta._t = setTimeout(() => (plannerHint.textContent = "Auto-saved"), 900);
    });
    plannerGrid.appendChild(el);
}

// pomodoro timer, default 25 min rakha hai, dono jagah (widget + full page) sync rahega
const savedDuration = LS.get("pomodoro-duration", 25 * 60);

const pomoState = {
    total: savedDuration,
    remaining: savedDuration,
    running: false,
    interval: null,
};
const pomoTimeEl = document.querySelector("#pomoTime");
const pomoRing = document.querySelector("#pomoRing");
const wPomoTime = document.querySelector("#wPomoTime");
const RING_CIRC = 2 * Math.PI * 98;
pomoRing.style.strokeDasharray = RING_CIRC;
pomoRing.style.strokeDashoffset = 0;

const alarmSound = new Audio("alarm.mp3");
alarmSound.preload = "auto";
function playAlarm() {
    try {
        alarmSound.currentTime = 0;
        alarmSound.play().catch(() => { });
    } catch { }
}

function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    if (h > 0) {
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    return `${pad(m)}:${pad(s)}`;
}
function renderPomo() {
    const txt = formatTime(pomoState.remaining);
    pomoTimeEl.textContent = txt;
    wPomoTime.textContent = txt;
    const progress = 1 - pomoState.remaining / pomoState.total;
    pomoRing.style.strokeDashoffset = RING_CIRC * progress;
}
function startPomo() {
    if (pomoState.running) return;
    pomoState.running = true;
    pomoState.interval = setInterval(() => {
        pomoState.remaining--;
        if (pomoState.remaining <= 0) {
            pausePomo();
            pomoState.remaining = 0;
            renderPomo();
            toast("Pomodoro complete! Take a break ☕");
            playAlarm();
            return;
        }
        renderPomo();
    }, 1000);
}
function pausePomo() {
    pomoState.running = false;
    clearInterval(pomoState.interval);
}
function resetPomo() {
    pausePomo();
    pomoState.remaining = pomoState.total;
    renderPomo();
}

const hourInput = document.querySelector("#hours");
const minuteInput = document.querySelector("#minutes");
const secondInput = document.querySelector("#seconds");

const saved = LS.get("pomodoro-duration", 25 * 60);

hourInput.value = Math.floor(saved / 3600);
minuteInput.value = Math.floor((saved % 3600) / 60);
secondInput.value = saved % 60;

// new Audio("alarm.mp3").play();  

document
    .querySelector("#applyTimer")
    .addEventListener("click", () => {

        const h = Number(hourInput.value);
        const m = Number(minuteInput.value);
        const s = Number(secondInput.value);
        const total = (h * 3600) + (m * 60) + s;
        if (total <= 0) {
            alert("Please enter a valid duration.");
            return;
        }

        pausePomo();
        pomoState.total = total;
        pomoState.remaining = total;
        LS.set("pomodoro-duration", total);
        renderPomo();

    });

renderPomo();
document.querySelector("#pomoStart").addEventListener("click", startPomo);
document.querySelector("#pomoPause").addEventListener("click", pausePomo);
document.querySelector("#pomoReset").addEventListener("click", resetPomo);
document.querySelector("#wPomoPlay").addEventListener("click", startPomo);
document.querySelector("#wPomoPause").addEventListener("click", pausePomo);
document.querySelector("#wPomoReset").addEventListener("click", resetPomo);

// motivation quotes -- api se fetch, agar net issue ho to niche wala fallback array use hoga
const FALLBACK_QUOTES = [
    { q: "Small daily improvements lead to stunning results.", a: "James Clear" },
    { q: "Discipline is the bridge between goals and accomplishment.", a: "Jim Rohn" },
    { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
    { q: "Focus on being productive instead of busy.", a: "Tim Ferriss" },
    { q: "You don't have to be great to start, but you have to start to be great.", a: "Zig Ziglar" },
    { q: "Success is the sum of small efforts, repeated day in and day out.", a: "Robert Collier" },
    { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
    { q: "Well done is better than well said.", a: "Benjamin Franklin" },
    { q: "The best way to predict the future is to create it.", a: "Peter Drucker" },
    { q: "Action is the foundational key to all success.", a: "Pablo Picasso" },
];
function randomFallback() {
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
}
async function fetchQuote() {
    try {
        const res = await fetch("https://dummyjson.com/quotes/random", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        return { q: data.quote, a: data.author };

    } catch (err) {
        console.warn("quote api down, using fallback list", err);
        return randomFallback();
    }
}
const motivQuote = document.querySelector("#motivQuote");
const motivAuthor = document.querySelector("#motivAuthor");
const quoteText = document.querySelector("#quoteText");
const quoteAuthor = document.querySelector("#quoteAuthor");
async function loadMotivationQuote() {
    motivQuote.textContent = "Loading a fresh quote…";
    motivAuthor.textContent = "—";
    const q = await fetchQuote();
    motivQuote.textContent = `“${q.q}”`;
    motivAuthor.textContent = `— ${q.a}`;
    quoteText.textContent = `“${q.q}”`;
    quoteAuthor.textContent = `— ${q.a}`;
}
document.querySelector("#motivRefresh").addEventListener("click", loadMotivationQuote);
// page load hote hi ek quote dikha do home pe
loadMotivationQuote();

// weather section -- open-meteo api, location permission na mile to Pune default rahega
const wxCache = LS.get("weather", null);
const PUNE = { lat: 18.5204, lon: 73.8567, name: "Pune, Maharashtra" };
const wTemp = document.querySelector("#wTemp");
const wCond = document.querySelector("#wCond");
const wLoc = document.querySelector("#wLoc");
const weatherPanel = document.querySelector("#weatherPanel");

const CODE_MAP = {
    0: { desc: "Clear sky", emoji: "☀️" },
    1: { desc: "Mainly clear", emoji: "🌤️" },
    2: { desc: "Partly cloudy", emoji: "⛅" },
    3: { desc: "Overcast", emoji: "☁️" },
    45: { desc: "Fog", emoji: "🌫️" },
    48: { desc: "Depositing rime fog", emoji: "🌫️" },
    51: { desc: "Light drizzle", emoji: "🌦️" },
    53: { desc: "Drizzle", emoji: "🌦️" },
    55: { desc: "Dense drizzle", emoji: "🌦️" },
    61: { desc: "Light rain", emoji: "🌧️" },
    63: { desc: "Rain", emoji: "🌧️" },
    65: { desc: "Heavy rain", emoji: "🌧️" },
    71: { desc: "Light snow", emoji: "🌨️" },
    73: { desc: "Snow", emoji: "🌨️" },
    75: { desc: "Heavy snow", emoji: "❄️" },
    80: { desc: "Rain showers", emoji: "🌦️" },
    81: { desc: "Rain showers", emoji: "🌧️" },
    82: { desc: "Violent showers", emoji: "⛈️" },
    95: { desc: "Thunderstorm", emoji: "⛈️" },
    96: { desc: "Thunder w/ hail", emoji: "⛈️" },
    99: { desc: "Severe thunder", emoji: "⛈️" },
};

async function reverseGeocode(lat, lon) {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
        const r = await fetch(url);
        const j = await r.json();
        if (j.results && j.results[0]) {
            const g = j.results[0];
            return [g.name, g.admin1].filter(Boolean).join(", ");
        }
    } catch { }
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
}
async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("weather fetch failed");
    return r.json();
}

let weatherState = { loading: true, error: null, data: null, location: null };

function updateWidgetWeather() {
    if (weatherState.loading) {
        wTemp.textContent = "—";
        wCond.textContent = "Loading…";
        wLoc.textContent = "—";
        return;
    }
    if (weatherState.error) {
        wTemp.textContent = "—";
        wCond.textContent = "Unavailable";
        wLoc.textContent = weatherState.location || "";
        return;
    }
    const c = weatherState.data.current;
    const info = CODE_MAP[c.weather_code] || { desc: "—", emoji: "🌡️" };
    wTemp.textContent = Math.round(c.temperature_2m);
    wCond.textContent = `${info.emoji} ${info.desc}`;
    wLoc.textContent = weatherState.location || "";
}

function renderWeatherView() {
    if (weatherState.loading) {
        weatherPanel.innerHTML = `<div class="weather-loading">Detecting your location and fetching weather…</div>`;
        return;
    }
    if (weatherState.error && !weatherState.data) {
        weatherPanel.innerHTML = `<div class="weather-error">${weatherState.error}</div>`;
        return;
    }
    const c = weatherState.data.current;
    const info = CODE_MAP[c.weather_code] || { desc: "—", emoji: "🌡️" };
    weatherPanel.innerHTML = `
        <div class="weather-content">
            <div class="weather-hero">
                <div class="weather-hero-left">
                    <div class="weather-emoji">${info.emoji}</div>
                    <div>
                        <div class="weather-big">${Math.round(c.temperature_2m)}°C</div>
                        <div class="weather-cond">${info.desc}</div>
                    </div>
                </div>
                <div>
                    <div class="weather-loc-big">${weatherState.location || ""}</div>
                    <div class="weather-time">Updated ${new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
            </div>
            <div class="weather-stats">
                <div class="wx-stat"><div class="label">Feels Like</div><div class="value">${Math.round(c.apparent_temperature)}°C</div></div>
                <div class="wx-stat"><div class="label">Humidity</div><div class="value">${c.relative_humidity_2m}%</div></div>
                <div class="wx-stat"><div class="label">Wind</div><div class="value">${Math.round(c.wind_speed_10m)} km/h</div></div>
                <div class="wx-stat"><div class="label">Day / Night</div><div class="value">${c.is_day ? "Day ☀️" : "Night 🌙"}</div></div>
            </div>
        </div>`;
}

async function loadWeather(forceGeo = false) {
    weatherState = { loading: true, error: null, data: null, location: null };
    updateWidgetWeather();
    renderWeatherView();

    // pehle localStorage me last location cache dekhlo, fresh fetch se pehle
    const cached = LS.get("wx-loc", null);
    let lat, lon, name;

    async function useLoc(la, lo, nm) {
        lat = la; lon = lo;
        try {
            name = nm || (await reverseGeocode(la, lo));
        } catch { name = nm || ""; }
        try {
            const data = await fetchWeather(la, lo);
            weatherState = { loading: false, error: null, data, location: name };
            LS.set("wx-loc", { lat: la, lon: lo, name });
            // LS.set("wx-loc", {lat, lon, name}); -- pehle destructure karke bhi try kiya tha, upar wala hi rakha
            console.log("weather updated for", name);
        } catch (e) {
            console.warn("weather fetch failed:", e);
            weatherState = { loading: false, error: "Could not load weather.", data: null, location: name };
        }
        updateWidgetWeather();
        renderWeatherView();
    }

    if (!forceGeo && cached && typeof cached.lat === "number") {
        await useLoc(cached.lat, cached.lon, cached.name);
        return;
    }

    if (!("geolocation" in navigator)) {
        await useLoc(PUNE.lat, PUNE.lon, PUNE.name);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        async (pos) => { await useLoc(pos.coords.latitude, pos.coords.longitude); },
        async (_err) => { await useLoc(PUNE.lat, PUNE.lon, PUNE.name); toast("Using default: Pune"); },
        { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
}
loadWeather();
document.querySelector("#weatherRefresh").addEventListener("click", () => loadWeather(true));

// page load hote hi sab render kardo ek baar
renderTodos();
renderGoals();
updateStats();
const STORAGE_KEY = "cosmic-countdown-target";

const form = document.querySelector("#countdown-form");
const targetInput = document.querySelector("#target-datetime");
const resetShortcut = document.querySelector("#reset-shortcut");
const savedHint = document.querySelector("#saved-hint");
const statusText = document.querySelector("#status-text");
const totalDays = document.querySelector("#total-days");
const headlineCaption = document.querySelector("#headline-caption");
const targetDisplay = document.querySelector("#target-display");
const phaseDisplay = document.querySelector("#phase-display");
const countdownPanel = document.querySelector(".countdown-panel");

const unitElements = {
  days: document.querySelector("#days-value"),
  hours: document.querySelector("#hours-value"),
  minutes: document.querySelector("#minutes-value"),
  seconds: document.querySelector("#seconds-value"),
};

let activeTarget = null;
let timerId = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function saveStoredTarget(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    return;
  }
}

function readStoredTarget() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function toLocalInputValue(date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function formatTarget(date) {
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function applyTarget(date, shouldPersist = true) {
  activeTarget = date;
  targetInput.value = toLocalInputValue(date);
  targetDisplay.textContent = formatTarget(date);
  savedHint.textContent = `已設定目標：${formatTarget(date)}`;

  if (shouldPersist) {
    saveStoredTarget(date.toISOString());
  }

  if (timerId) {
    clearInterval(timerId);
  }

  updateCountdown();
  timerId = window.setInterval(updateCountdown, 1000);
}

function resetStateCopy() {
  totalDays.textContent = "0";
  unitElements.days.textContent = "00";
  unitElements.hours.textContent = "00";
  unitElements.minutes.textContent = "00";
  unitElements.seconds.textContent = "00";
}

function updateCountdown() {
  if (!activeTarget) {
    resetStateCopy();
    statusText.textContent = "等待設定";
    headlineCaption.textContent = "設定目標日期與時間後，倒數會即時開始。";
    phaseDisplay.textContent = "待命中";
    countdownPanel.classList.remove("is-live", "is-complete");
    return;
  }

  const now = new Date();
  const diffMs = activeTarget.getTime() - now.getTime();

  if (diffMs <= 0) {
    totalDays.textContent = "0";
    unitElements.days.textContent = "00";
    unitElements.hours.textContent = "00";
    unitElements.minutes.textContent = "00";
    unitElements.seconds.textContent = "00";
    statusText.textContent = "已抵達";
    headlineCaption.textContent = "目標時間已到，宇宙意志已為你記住這一刻。";
    phaseDisplay.textContent = "已完成";
    countdownPanel.classList.remove("is-live");
    countdownPanel.classList.add("is-complete");
    return;
  }

  const totalDaysRemaining = diffMs / 86_400_000;
  const fullDays = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  const seconds = Math.floor((diffMs % 60_000) / 1_000);

  totalDays.textContent = totalDaysRemaining.toFixed(2);
  unitElements.days.textContent = pad(fullDays);
  unitElements.hours.textContent = pad(hours);
  unitElements.minutes.textContent = pad(minutes);
  unitElements.seconds.textContent = pad(seconds);
  statusText.textContent = "倒數進行中";
  headlineCaption.textContent = `距離目標尚餘 ${fullDays} 天 ${hours} 小時 ${minutes} 分 ${seconds} 秒。`;
  phaseDisplay.textContent = "穩定倒數";
  countdownPanel.classList.add("is-live");
  countdownPanel.classList.remove("is-complete");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!targetInput.value) {
    targetInput.reportValidity();
    return;
  }

  const selectedDate = new Date(targetInput.value);

  if (Number.isNaN(selectedDate.getTime())) {
    savedHint.textContent = "日期格式無效，請重新選擇。";
    return;
  }

  applyTarget(selectedDate);
});

resetShortcut.addEventListener("click", () => {
  const base = new Date();
  base.setDate(base.getDate() + 30);
  base.setSeconds(0, 0);
  applyTarget(base);
});

window.addEventListener("beforeunload", () => {
  if (timerId) {
    clearInterval(timerId);
  }
});

const savedTarget = readStoredTarget();

if (savedTarget) {
  const parsedDate = new Date(savedTarget);

  if (!Number.isNaN(parsedDate.getTime())) {
    applyTarget(parsedDate, false);
  }
}

if (!activeTarget) {
  const initialTarget = new Date();
  initialTarget.setDate(initialTarget.getDate() + 30);
  initialTarget.setSeconds(0, 0);
  targetInput.value = toLocalInputValue(initialTarget);
  savedHint.textContent = "預設為 30 天後，你也可以改成任何想要的日期時間。";
  updateCountdown();
}

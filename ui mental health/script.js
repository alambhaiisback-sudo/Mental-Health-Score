const API_URL = "http://127.0.0.1:8000/predict";

const form = document.getElementById("predict-form");
const submitBtn = document.getElementById("submit-btn");
const btnLabel = submitBtn.querySelector(".btn-label");
const errorBanner = document.getElementById("error-banner");
const resultCard = document.getElementById("result-card");
const scoreValue = document.getElementById("score-value");
const ringFg = document.getElementById("ring-fg");
const CIRCUMFERENCE = 2 * Math.PI * 52;

// id -> { key: JSON property name, label, type, min, max }
const FIELDS = {
  age:      { key: "Age", label: "Age", type: "number", min: 10, max: 100 },
  gender:   { key: "Gender", label: "Gender", type: "select" },
  country:  { key: "Country", label: "Country", type: "text" },
  academic: { key: "Academic_Level", label: "Academic level", type: "select" },
  platform: { key: "Most_Used_Platform", label: "Most used platform", type: "select" },
  purpose:  { key: "Purpose_Of_Use", label: "Purpose of use", type: "select" },
  usage:    { key: "Avg_Daily_Usage_Hours", label: "Average daily usage hours", type: "number", min: 0, max: 24 },
  unlocks:  { key: "Daily_Unlocks", label: "Daily unlocks", type: "number", min: 0 },
  study:    { key: "Study_Hours", label: "Study hours", type: "number", min: 0, max: 24 },
  activity: { key: "Physical_Activity_Hours", label: "Physical activity hours", type: "number", min: 0, max: 2 },
  sleep:    { key: "Sleep_Hours_Per_Night", label: "Sleep hours per night", type: "number", min: 0, max: 24 },
  stress:   { key: "Stress_Level", label: "Stress level", type: "select" }
};

function setFieldError(id, message) {
  const el = document.getElementById(id);
  el.closest(".field").classList.toggle("invalid", Boolean(message));
  document.querySelector(`.err[data-for="${id}"]`).textContent = message || "";
}

function validateForm() {
  let valid = true;
  for (const [id, f] of Object.entries(FIELDS)) {
    const raw = document.getElementById(id).value.trim();
    let msg = "";
    if (raw === "") {
      msg = f.type === "select" ? `Please select ${f.label.toLowerCase()}.` : `${f.label} is required.`;
    } else if (f.type === "number") {
      const n = Number(raw);
      if (Number.isNaN(n)) msg = `${f.label} must be a number.`;
      else if (f.min !== undefined && n < f.min) msg = `${f.label} must be at least ${f.min}.`;
      else if (f.max !== undefined && n > f.max) msg = `${f.label} must be at most ${f.max}.`;
      else if (id === "age" && !Number.isInteger(n)) msg = "Age must be a whole number.";
      else if (id === "unlocks" && !Number.isInteger(n)) msg = "Daily unlocks must be a whole number.";
    }
    setFieldError(id, msg);
    if (msg) valid = false;
  }
  return valid;
}

function collectFormData() {
  const data = {};
  for (const [id, f] of Object.entries(FIELDS)) {
    const raw = document.getElementById(id).value.trim();
    data[f.key] = f.type === "number" ? Number(raw) : raw;
  }
  return data;
}

async function predictMentalHealth(formData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });
  if (!response.ok) {
    throw new Error("Prediction failed. Please check your input.");
  }
  return await response.json();
}

function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.hidden = false;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("loading", isLoading);
  btnLabel.textContent = isLoading ? "Predicting…" : "Predict Mental Health Score";
}

function renderResult(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) throw new Error("The server returned an unexpected response.");
  const display = Number.isInteger(value) ? value : value.toFixed(2);

  scoreValue.textContent = display;
  resultCard.hidden = false;

  // Ring assumes a 0–10 scale for the visual fill only; the number shown is the raw model output.
  const fraction = Math.min(Math.max(value / 10, 0), 1);
  ringFg.style.strokeDashoffset = CIRCUMFERENCE;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ringFg.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);
  }));
  resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBanner.hidden = true;

  if (!validateForm()) {
    showError("Please fix the highlighted fields and try again.");
    return;
  }

  resultCard.hidden = true;
  setLoading(true);
  try {
    const result = await predictMentalHealth(collectFormData());
    renderResult(result.predicted_mental_health_score);
  } catch (err) {
    const isNetwork = err instanceof TypeError;
    showError(isNetwork
      ? "Could not reach the server at http://127.0.0.1:8000. Make sure the FastAPI server is running and CORS is enabled."
      : err.message);
  } finally {
    setLoading(false);
  }
});

// Clear a field's error as the user fixes it
Object.keys(FIELDS).forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener("input", () => setFieldError(id, ""));
  el.addEventListener("change", () => setFieldError(id, ""));
});

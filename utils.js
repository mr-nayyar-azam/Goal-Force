// STORAGE HELPERS
const mem = {};

export async function sGet(key) {
  try { 
    const r = await window.storage.get(key); 
    return r ? JSON.parse(r.value) : null; 
  } catch { 
    return mem[key] ?? null; 
  }
}

export async function sSet(key, val) {
  try { 
    await window.storage.set(key, JSON.stringify(val)); 
    mem[key] = val; 
  } catch { 
    mem[key] = val; 
  }
}
// CONSTANTS & HELPERS
export const GOAL_TYPES = [
  { value: "10d",      label: "10 Days",    days: 10  },
  { value: "15d",      label: "15 Days",    days: 15  },
  { value: "1m",       label: "1 Month",    days: 30  },
  { value: "3m",       label: "3 Months",   days: 90  },
  { value: "6m",       label: "6 Months",   days: 180 },
  { value: "1y",       label: "1 Year",     days: 365 },
  { value: "lifetime", label: "Lifetime ♾", days: null },
];

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayStr = () => new Date().toISOString().split("T")[0];
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export function getDeadline(goal) {
  if (goal.deadline) return goal.deadline;
  const type = GOAL_TYPES.find(t => t.value === goal.type);
  if (!type?.days) return null;
  const d = new Date(goal.createdAt);
  d.setDate(d.getDate() + type.days);
  return d.toISOString().split("T")[0];
}

export function getDaysRemaining(goal) {
  const dl = getDeadline(goal);
  if (!dl) return null;
  return daysBetween(todayStr(), dl);
}

export function getOverallProgress(goal) {
  const cis = goal.checkIns || [];
  if (!cis.length) return 0;
  return Math.round(cis.reduce((s, c) => s + (c.percentage || 0), 0) / cis.length);
}

export function getStreak(goal) {
  const cis = goal.checkIns || [];
  let streak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 1000; i++) {
    const expected = d.toISOString().split("T")[0];
    const ci = cis.find(c => c.date === expected);
    if (ci && !ci.missed) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export function isOnTrack(goal) {
  const dl = getDeadline(goal);
  if (!dl) return true;
  const totalDays = daysBetween(goal.createdAt, dl);
  if (totalDays <= 0) return false;
  const elapsed = daysBetween(goal.createdAt, todayStr());
  const expected = (elapsed / totalDays) * 100;
  return getOverallProgress(goal) >= expected - 10;
}

// API & THEME
export async function askClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.find(b => b.type === "text")?.text || "No response.";
}

export function getTheme(dark) {
  return {
    bg:      dark ? "#07090f" : "#eef1f8",
    surface: dark ? "#0d1220" : "#ffffff",
    card:    dark ? "#111827" : "#f5f7ff",
    border:  dark ? "#1a2e4a" : "#d8e0f0",
    text:    dark ? "#d8e8ff" : "#0d1220",
    sub:     dark ? "#4d6890" : "#6880a8",
    accent:  "#00b4ff",
    green:   "#00d68f",
    warn:    "#ffaa00",
    danger:  "#ff4444",
    purple:  "#b06aff",
    orange:  "#ff6b35",
  };
}

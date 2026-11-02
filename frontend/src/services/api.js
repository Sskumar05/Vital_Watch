// =============================================================
//  API Service Layer
//  Communicates with Express backend
// =============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchLatest() {
  const res = await fetch(`${BASE_URL}/api/vitals/latest`);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Latest vitals fetch failed: ${res.status}`);
  return await res.json();
}

export async function fetchHistory(range = '1h') {
  const res = await fetch(`${BASE_URL}/api/vitals/history?range=${range}`);
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
  return await res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${BASE_URL}/api/alerts`);
  if (!res.ok) throw new Error(`Alerts fetch failed: ${res.status}`);
  return await res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health fetch failed: ${res.status}`);
  return await res.json();
}


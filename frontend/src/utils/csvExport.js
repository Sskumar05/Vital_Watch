// =============================================================
//  CSV Export Utility
//  Exports alert history identical to original format
// =============================================================

export function exportCSV(alertData) {
  if (!alertData || alertData.length === 0) {
    alert('No alert data to export.');
    return;
  }

  const header = 'Timestamp,Heart Rate (bpm),SpO2 (%),Status\n';
  const rows = alertData
    .map(a => `"${a.timestamp}",${a.heart_rate},${a.spo2},"${a.status}"`)
    .join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alerts_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


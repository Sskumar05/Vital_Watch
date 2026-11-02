// =============================================================
//  Component: AlertsTable
//  Historical critical alerts list with CSV export action
// =============================================================

import React from 'react';
import { exportCSV } from '../utils/csvExport';

export default function AlertsTable({ alerts }) {
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <div className="content-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-circle">
            <span>⚠</span>
          </div>
          <div>
            <div className="panel-title">Alert History</div>
            <div className="panel-subtitle">Audited critical clinical events</div>
          </div>
        </div>
        <button className="btn-export-csv" onClick={() => exportCSV(alerts)}>
          <span>⬇ Export CSV</span>
        </button>
      </div>

      {/* Table Scroll Wrap */}
      <div className="table-scroll-wrap">
        <table className="alerts-table-modern">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Heart Rate</th>
              <th>SpO2</th>
              <th>Classification</th>
            </tr>
          </thead>
          <tbody id="alerts-body">
            {!hasAlerts ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--clr-text-muted)' }}>
                  No critical events recorded yet
                </td>
              </tr>
            ) : (
              alerts.map((a, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'var(--clr-text-muted)' }}>
                    {a.timestamp}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--clr-text-title)' }}>{a.heart_rate}</strong>{' '}
                    <span style={{ color: 'var(--clr-text-muted)', fontSize: '.75rem' }}>bpm</span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--clr-text-title)' }}>{a.spo2}</strong>{' '}
                    <span style={{ color: 'var(--clr-text-muted)', fontSize: '.75rem' }}>%</span>
                  </td>
                  <td>
                    <span className="tag-critical">CRITICAL</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

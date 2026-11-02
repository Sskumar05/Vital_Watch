// =============================================================
//  Component: StatusFeed
//  Recent activity feed matching the bottom section of reference
// =============================================================

import React from 'react';

export default function StatusFeed({ feedEvents, readingsCount }) {
  const isEmpty = !feedEvents || feedEvents.length === 0;

  return (
    <div className="content-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-circle">
            <span>📋</span>
          </div>
          <div>
            <div className="panel-title">Live Status Feed</div>
            <div className="panel-subtitle">Real-time incoming telemetry stream</div>
          </div>
        </div>
        <span id="feed-count" className="status-pill pill-wait">
          {readingsCount} readings
        </span>
      </div>

      {/* Feed Items Container */}
      <div id="status-feed" className="feed-items-container">
        {isEmpty ? (
          <div className="feed-placeholder">Waiting for first telemetry packet…</div>
        ) : (
          feedEvents.map((e, idx) => (
            <div key={idx} className={`feed-item fi-${e.status.toLowerCase()}`}>
              <div className="feed-icon-box">
                {e.status === 'CRITICAL' ? '🚨' : '♥'}
              </div>
              <div className="feed-content">
                <div className="feed-vitals-text">
                  HR <strong>{e.hr} bpm</strong> &nbsp;·&nbsp; SpO2 <strong>{e.spo2}%</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="feed-timestamp">{e.timestamp}</span>
                  <span className={`status-pill ${e.status === 'CRITICAL' ? 'pill-crit' : 'pill-norm'}`}>
                    {e.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

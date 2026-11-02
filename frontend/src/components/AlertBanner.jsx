// =============================================================
//  Component: AlertBanner
//  Critical Alert notification banner matching redesigned UI
// =============================================================

import React from 'react';

export default function AlertBanner({ active, latest, onDismiss }) {
  if (!active || !latest) return null;

  return (
    <div id="alert-banner" className="alert-banner" role="alert" aria-live="assertive">
      <div className="alert-pulse-ring r1"></div>
      <div className="alert-pulse-ring r2"></div>
      <div className="alert-inner">
        <span className="alert-siren">🚨</span>
        <div className="alert-text">
          <strong>Critical Physiological Vitals Alert</strong>
          <span id="alert-detail">
            Heart Rate: {latest.heart_rate} bpm &nbsp;|&nbsp; Blood Oxygen: {latest.spo2}%
          </span>
        </div>
        <span id="alert-time" className="alert-time">
          {latest.timestamp}
        </span>
        <button className="alert-dismiss" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}

// =============================================================
//  Component: HeartRateCard
//  Redesigned as the prominent left-column panel from reference
// =============================================================

import React, { useState, useEffect, useRef } from 'react';

const CIRCUMFERENCE = 402.1; // 2 * π * 64

export default function HeartRateCard({ latest, stats, onExportCSV, alerts }) {
  const [displayHR, setDisplayHR] = useState(0);
  const targetHR = latest && typeof latest.heart_rate === 'number' ? latest.heart_rate : 0;
  const animRef = useRef(null);

  // Smooth lerp counter (exact 0.08 rate)
  useEffect(() => {
    if (targetHR === 0) return;

    const animate = () => {
      setDisplayHR(prev => {
        const diff = targetHR - prev;
        if (Math.abs(diff) < 0.2) return targetHR;
        return prev + diff * 0.08;
      });
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [targetHR]);

  // Gauge calculations
  const rawHR = displayHR;
  const fraction = Math.max(0, Math.min(1, (rawHR - 40) / (160 - 40)));
  const offset = rawHR > 0 ? CIRCUMFERENCE * (1 - fraction) : CIRCUMFERENCE;

  // Status badge logic
  let badgeText = 'WAITING';
  let badgeClass = 'status-pill pill-wait';
  let statusHint = 'Waiting for incoming sensor telemetry packets.';
  if (targetHR > 0) {
    if (targetHR < 50) {
      badgeText = 'LOW';
      badgeClass = 'status-pill pill-crit';
      statusHint = 'Alert: Heart rate is below clinical minimum (<50 bpm).';
    } else if (targetHR > 100) {
      badgeText = 'HIGH';
      badgeClass = 'status-pill pill-crit';
      statusHint = 'Alert: Tachycardia detected exceeding physiological limit (>100 bpm).';
    } else {
      badgeText = 'NORMAL';
      badgeClass = 'status-pill pill-norm';
      statusHint = 'Heart rate is stable within healthy normal range (50–100 bpm).';
    }
  }

  // Dynamic heartbeat animation duration
  const beatDuration = targetHR > 0 ? `${(60 / targetHR).toFixed(2)}s` : '1s';

  return (
    <div id="card-hr" className="card-focus" aria-label="Heart Rate">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-circle">
            <span
              id="logo-heart-card"
              className="beat-heart"
              style={{ animationDuration: beatDuration }}
            >
              ♥
            </span>
          </div>
          <div>
            <div className="panel-title">Heart Rate</div>
            <div className="panel-subtitle">Real-time pulse telemetry</div>
          </div>
        </div>
        <div id="hr-badge" className={badgeClass}>
          {badgeText}
        </div>
      </div>

      {/* SVG Modern Circular Gauge */}
      <div className="hero-metric-box">
        <div className="gauge-wrap-modern">
          <svg className="gauge-svg-modern" viewBox="0 0 160 160" aria-hidden="true">
            <defs>
              <linearGradient id="hr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <circle className="g-track" cx="80" cy="80" r="64" />
            <circle
              className="g-marker"
              cx="80"
              cy="80"
              r="64"
              strokeDasharray="4 16.8"
              transform="rotate(-90 80 80)"
            />
            <circle
              id="hr-arc"
              className="g-arc"
              cx="80"
              cy="80"
              r="64"
              stroke="url(#hr-grad)"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 80 80)"
              strokeLinecap="round"
            />
          </svg>
          <div className="gauge-center-modern">
            <div id="hr-num" className="gauge-num-modern">
              {targetHR > 0 ? Math.round(displayHR) : '--'}
            </div>
            <div className="gauge-unit-modern">bpm</div>
          </div>
        </div>
      </div>

      {/* Breakdown List (Matching Reference Image) */}
      <div className="metric-breakdown-list">
        <div className="breakdown-row">
          <span className="breakdown-label">Resting Rate</span>
          <span className="breakdown-val">{stats ? stats.hrMin : '--'} bpm</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Average Rate</span>
          <span className="breakdown-val">{stats ? stats.hrAvg : '--'} bpm</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Peak Maximum</span>
          <span className="breakdown-val">{stats ? stats.hrMax : '--'} bpm</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Current Status</span>
          <span className="breakdown-val" style={{ color: badgeText === 'CRITICAL' || badgeText === 'HIGH' || badgeText === 'LOW' ? '#ef4444' : '#10b981' }}>
            {badgeText}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Last Transmission</span>
          <span className="breakdown-val" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
            {latest ? latest.timestamp : 'Waiting…'}
          </span>
        </div>
      </div>

      {/* Info Callout Box (Matching Reference Image) */}
      <div className="card-callout-box">
        <span className="card-callout-icon">ⓘ</span>
        <span>{statusHint}</span>
      </div>

      {/* Action Button */}
      {onExportCSV && (
        <button
          className="btn-primary-action"
          onClick={() => onExportCSV(alerts)}
          title="Export CSV audit file"
        >
          <span>⬇ Export Alert History (CSV)</span>
        </button>
      )}
    </div>
  );
}

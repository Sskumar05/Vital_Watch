// =============================================================
//  Component: SpO2Card
//  Blood Oxygen Zone Card matching the arched card in reference
// =============================================================

import React, { useState, useEffect, useRef } from 'react';

const CIRCUMFERENCE = 402.1; // 2 * π * 64

export default function SpO2Card({ latest }) {
  const [displaySpO2, setDisplaySpO2] = useState(0);
  const targetSpO2 = latest && typeof latest.spo2 === 'number' ? latest.spo2 : 0;
  const animRef = useRef(null);

  // Smooth lerp counter
  useEffect(() => {
    if (targetSpO2 === 0) return;

    const animate = () => {
      setDisplaySpO2(prev => {
        const diff = targetSpO2 - prev;
        if (Math.abs(diff) < 0.05) return targetSpO2;
        return prev + diff * 0.08;
      });
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [targetSpO2]);

  // Gauge calculations
  const rawSpO2 = displaySpO2;
  const fraction = Math.max(0, Math.min(1, (rawSpO2 - 80) / (100 - 80)));
  const offset = rawSpO2 > 0 ? CIRCUMFERENCE * (1 - fraction) : CIRCUMFERENCE;

  // Status badge logic
  let badgeText = 'WAITING';
  let badgeClass = 'status-pill pill-wait';
  if (targetSpO2 > 0) {
    if (targetSpO2 < 92.0) {
      badgeText = 'LOW O2';
      badgeClass = 'status-pill pill-crit';
    } else {
      badgeText = 'NORMAL';
      badgeClass = 'status-pill pill-norm';
    }
  }

  return (
    <div id="card-spo2" className="content-panel spo2-zone-card" aria-label="Blood Oxygen">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-circle">
            <span style={{ fontSize: '1rem' }}>🫁</span>
          </div>
          <div>
            <div className="panel-title">Blood Oxygen (SpO2)</div>
            <div className="panel-subtitle">Optical pulse oximetry index</div>
          </div>
        </div>
        <div id="spo2-badge" className={badgeClass}>
          {badgeText}
        </div>
      </div>

      {/* Modern Arched Gauge */}
      <div className="hero-metric-box">
        <div className="gauge-wrap-modern" style={{ position: 'relative' }}>
          <div id="breathing-ring" className="breathing-ring-modern"></div>
          <svg className="gauge-svg-modern" viewBox="0 0 160 160" aria-hidden="true">
            <defs>
              <linearGradient id="spo2-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="60%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
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
              id="spo2-arc"
              className="g-arc"
              cx="80"
              cy="80"
              r="64"
              stroke="url(#spo2-grad)"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 80 80)"
              strokeLinecap="round"
            />
          </svg>
          <div className="gauge-center-modern">
            <div id="spo2-num" className="gauge-num-modern">
              {targetSpO2 > 0 ? displaySpO2.toFixed(1) : '--'}
            </div>
            <div className="gauge-unit-modern">% SpO2</div>
          </div>
        </div>
      </div>

      {/* Legend Dots (Matching Reference Semicircular Card) */}
      <div className="zone-legend-row">
        <span>
          <span className="legend-dot" style={{ background: '#ef4444' }}></span>
          &lt;92% Alert
        </span>
        <span>
          <span className="legend-dot" style={{ background: '#06b6d4' }}></span>
          92–95% Moderate
        </span>
        <span>
          <span className="legend-dot" style={{ background: '#10b981' }}></span>
          ≥95% Optimal
        </span>
      </div>
    </div>
  );
}

// =============================================================
//  Component: SessionStats
//  Redesigned as 4 top metric cards matching the reference image
// =============================================================

import React from 'react';

export default function SessionStats({ stats }) {
  return (
    <div className="stats-section-wrap" role="region" aria-label="Session Statistics">
      {/* 4 Primary Metric Cards (Matching Reference Layout) */}
      <div className="stats-grid-top">
        {/* Card 1: Min / Resting Heart Rate */}
        <div className="metric-stat-card">
          <div className="metric-card-header">
            <div className="metric-icon-badge" style={{ color: '#ef4444' }}>
              <span>↓</span>
            </div>
            <div className="metric-title-wrap">
              <span className="metric-title">Resting Heart Rate</span>
              <span className="metric-subtitle">Session minimum rate</span>
            </div>
          </div>
          <div className="metric-value-row">
            <span id="stat-hr-min" className="metric-num">{stats.hrMin}</span>
            <span className="metric-unit">bpm</span>
          </div>
          <div className="metric-info-hint">
            <span className="metric-info-icon">ⓘ</span>
            <span>Lowest resting telemetry recorded during monitoring.</span>
          </div>
        </div>

        {/* Card 2: Peak / Maximum Heart Rate */}
        <div className="metric-stat-card">
          <div className="metric-card-header">
            <div className="metric-icon-badge" style={{ color: '#ef4444' }}>
              <span>↑</span>
            </div>
            <div className="metric-title-wrap">
              <span className="metric-title">Maximum Heart Rate</span>
              <span className="metric-subtitle">Session peak rate</span>
            </div>
          </div>
          <div className="metric-value-row">
            <span id="stat-hr-max" className="metric-num">{stats.hrMax}</span>
            <span className="metric-unit">bpm</span>
          </div>
          <div className="metric-info-hint">
            <span className="metric-info-icon">ⓘ</span>
            <span>Peak physiological threshold reached during telemetry.</span>
          </div>
        </div>

        {/* Card 3: Average Heart Rate */}
        <div className="metric-stat-card">
          <div className="metric-card-header">
            <div className="metric-icon-badge" style={{ color: '#f97316' }}>
              <span>♥</span>
            </div>
            <div className="metric-title-wrap">
              <span className="metric-title">Average Heart Rate</span>
              <span className="metric-subtitle">Session running mean</span>
            </div>
          </div>
          <div className="metric-value-row">
            <span id="stat-hr-avg" className="metric-num">{stats.hrAvg}</span>
            <span className="metric-unit">bpm</span>
          </div>
          <div className="metric-info-hint">
            <span className="metric-info-icon">ⓘ</span>
            <span>Running average vital status within normal clinical limits.</span>
          </div>
        </div>

        {/* Card 4: Min SpO2 / Clinical Saturation */}
        <div className="metric-stat-card">
          <div className="metric-card-header">
            <div className="metric-icon-badge" style={{ color: '#2563eb' }}>
              <span>🫁</span>
            </div>
            <div className="metric-title-wrap">
              <span className="metric-title">Minimum Blood Oxygen</span>
              <span className="metric-subtitle">Optical SpO2 index</span>
            </div>
          </div>
          <div className="metric-value-row">
            <span id="stat-spo2-min" className="metric-num">{stats.spo2Min}</span>
            <span className="metric-unit">%</span>
          </div>
          <div className="metric-info-hint">
            <span className="metric-info-icon">ⓘ</span>
            <span>Lowest oxygen saturation reading (Normal: ≥92.0%).</span>
          </div>
        </div>
      </div>

      {/* Sub-metrics bar: Avg SpO2, Critical Alerts & Total Readings */}
      <div className="substats-bar" style={{ marginTop: '12px' }}>
        <div className="substat-item">
          <span className="substat-lbl">Average SpO2:</span>
          <span id="stat-spo2-avg" className="substat-val">{stats.spo2Avg}%</span>
        </div>
        <div className="substat-divider"></div>
        <div className="substat-item">
          <span className="substat-lbl">Critical Alerts:</span>
          <span id="stat-alerts" className="substat-val" style={{ color: stats.alerts > 0 ? '#ef4444' : 'inherit' }}>
            {stats.alerts}
          </span>
        </div>
        <div className="substat-divider"></div>
        <div className="substat-item">
          <span className="substat-lbl">Total Readings Ingested:</span>
          <span id="stat-readings" className="substat-val">{stats.readings}</span>
        </div>
      </div>
    </div>
  );
}

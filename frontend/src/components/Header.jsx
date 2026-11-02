// =============================================================
//  Component: Header
//  Clean header with official VitalWatch logo & patient telemetry
// =============================================================

import React, { useState, useEffect } from 'react';
import vitalWatchLogo from '../assets/vitalwatch-logo.png';

export default function Header({ isOnline, isDark, onToggleDark }) {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        {/* Official VitalWatch Brand Logo */}
        <div className="brand-box" title="VitalWatch — Remote Patient Monitor">
          <img
            src={vitalWatchLogo}
            alt="VitalWatch — Remote Patient Monitor"
            className="brand-logo-img"
          />
          <span id="logo-heart" className="visually-hidden">♥</span>
        </div>
      </div>

      <div className="header-right">
        {/* Date Pill */}
        {/* <div className="info-pill" title="Current Date">
          <span className="info-pill-icon">📅</span>
          <span>{dateStr}</span>
        </div> */}

        {/* Time Pill */}
        <div id="datetime" className="info-pill" title="Live Clock">
          <span className="info-pill-icon">🕒</span>
          <span>{timeStr}</span>
        </div>

        {/* System Connection Status Pill */}
        <div id="conn-status" className={`conn-pill ${isOnline ? 'online' : 'offline'}`}>
          <span className="conn-dot"></span>
          <span id="conn-label">{isOnline ? 'Live' : 'Connecting…'}</span>
        </div>

        {/* Dark Mode Toggle */}
        {/* <button
          id="dark-toggle"
          className="icon-btn"
          onClick={onToggleDark}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {isDark ? '☀️' : '🌙'}
        </button> */}

        {/* Patient Profile Chip */}
        {/* <div className="patient-chip" title="Active Monitored Patient">
          <div className="patient-avatar">M</div>
          <div className="patient-meta-wrap">
            <span className="patient-name">MADHUSRI</span>
            <span className="patient-id">ID: PM-2024-001 · Ward 3B</span>
          </div>
          <span className="patient-dropdown-arrow">▾</span>
        </div> */}
      </div>
    </header>
  );
}

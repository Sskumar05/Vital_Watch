// =============================================================
//  Component: App
//  Main orchestrator for the redesigned patient monitoring dashboard
// =============================================================

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AlertBanner from './components/AlertBanner';
import HeartRateCard from './components/HeartRateCard';
import SpO2Card from './components/SpO2Card';
import ECGCanvas from './components/ECGCanvas';
import SessionStats from './components/SessionStats';
import VitalsTrendChart from './components/VitalsTrendChart';
import StatusFeed from './components/StatusFeed';
import AlertsTable from './components/AlertsTable';
import Footer from './components/Footer';
import { useVitalsPoll } from './hooks/useVitalsPoll';
import { exportCSV } from './utils/csvExport';

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('vw-dark') === 'true';
  });

  const {
    latest,
    history,
    alerts,
    feedEvents,
    isOnline,
    lastUpdated,
    stats,
    currentRange,
    setCurrentRange,
    alertBannerActive,
    dismissAlertBanner,
  } = useVitalsPoll();

  // Sync theme to root html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('vw-dark', isDark);
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  return (
    <div className="app-wrapper">
      {/* Critical Alert Banner Notification */}
      <AlertBanner
        active={alertBannerActive}
        latest={latest}
        onDismiss={dismissAlertBanner}
      />

      {/* Main Elevated Dashboard Workspace */}
      <div className="dashboard-workspace">
        {/* Navigation & Patient Header */}
        <Header
          isOnline={isOnline}
          isDark={isDark}
          onToggleDark={toggleDarkMode}
        />

        {/* ROW 1: Top 4 Metric Cards */}
        <SessionStats stats={stats} />

        {/* ROW 2 & 3: Multi-Column Main Workspace */}
        <main className="dashboard-main-grid">
          {/* Left Column: Heart Rate Hero Focus Card */}
          <div className="left-focus-column">
            <HeartRateCard
              latest={latest}
              stats={stats}
              alerts={alerts}
              onExportCSV={exportCSV}
            />
          </div>

          {/* Right Column: SpO2 + ECG + Analytics + Feeds */}
          <div className="right-content-area">
            {/* Top Sub-Row: SpO2 Zone Gauge & Live ECG Waveform */}
            <div className="middle-two-card-row">
              <SpO2Card latest={latest} />
              <ECGCanvas latest={latest} isDark={isDark} />
            </div>

            {/* Middle Sub-Row: Vitals Historical Analytics */}
            <VitalsTrendChart
              history={history}
              currentRange={currentRange}
              onSelectRange={setCurrentRange}
            />

            {/* Bottom Sub-Row: Live Telemetry Feed & Alert History */}
            <div className="bottom-two-card-row">
              <StatusFeed
                feedEvents={feedEvents}
                readingsCount={stats.readings}
              />
              <AlertsTable alerts={alerts} />
            </div>
          </div>
        </main>

        {/* Workspace Footer */}
        <Footer lastUpdated={lastUpdated} />
      </div>
    </div>
  );
}

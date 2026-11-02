// =============================================================
//  Component: VitalsTrendChart
//  Chart.js dual-axis trend chart with sleek range pill buttons
// =============================================================

import React, { useRef, useEffect } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  Filler
);

const CHART_MAX_PTS = 80;

export default function VitalsTrendChart({ history, currentRange, onSelectRange }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Initialize Chart instance
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Heart Rate (bpm)',
            data: [],
            yAxisID: 'y',
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            borderWidth: 2.2,
            pointRadius: 2.5,
            pointHoverRadius: 5,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'SpO2 (%)',
            data: [],
            yAxisID: 'y1',
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            borderWidth: 2.2,
            pointRadius: 2.5,
            pointHoverRadius: 5,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 350 },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: 'Inter', size: 12, weight: '500' },
              color: '#64748b',
              padding: 18,
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Inter', size: 12, weight: '600' },
            bodyFont: { family: 'Inter', size: 13, weight: '500' },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1),
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: {
              font: { family: 'Inter', size: 10 },
              color: '#94a3b8',
              maxTicksLimit: 8,
              maxRotation: 0,
            },
          },
          y: {
            type: 'linear',
            position: 'left',
            min: 30,
            max: 160,
            title: {
              display: true,
              text: 'HR (bpm)',
              color: '#ef4444',
              font: { family: 'Inter', size: 11, weight: '600' },
            },
            grid: { color: 'rgba(239, 68, 68, 0.06)' },
            ticks: { font: { family: 'Inter', size: 10 }, color: '#94a3b8' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 80,
            max: 100,
            title: {
              display: true,
              text: 'SpO2 (%)',
              color: '#2563eb',
              font: { family: 'Inter', size: 11, weight: '600' },
            },
            grid: { drawOnChartArea: false },
            ticks: { font: { family: 'Inter', size: 10 }, color: '#94a3b8' },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  // Update chart data whenever history changes
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    if (!history || history.length === 0) {
      chart.data.labels = [];
      chart.data.datasets[0].data = [];
      chart.data.datasets[1].data = [];
      chart.update('none');
      return;
    }

    const slice = history.slice(-CHART_MAX_PTS);
    chart.data.labels = slice.map(r => r.timestamp);
    chart.data.datasets[0].data = slice.map(r => r.heart_rate);
    chart.data.datasets[1].data = slice.map(r => r.spo2);
    chart.update('none');
  }, [history]);

  const isEmpty = !history || history.length === 0;

  return (
    <div className="content-panel chart-card-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-circle">
            <span>📈</span>
          </div>
          <div>
            <div className="panel-title">Vitals Historical Analytics</div>
            <div className="panel-subtitle">Dual-axis continuous telemetry for Heart Rate and SpO2</div>
          </div>
        </div>

        {/* Range Pill Toggle */}
        <div className="range-toggle-pills">
          <button
            id="btn-1h"
            className={`range-pill-btn ${currentRange === '1h' ? 'active' : ''}`}
            onClick={() => onSelectRange('1h')}
          >
            1 Hour
          </button>
          <button
            id="btn-24h"
            className={`range-pill-btn ${currentRange === '24h' ? 'active' : ''}`}
            onClick={() => onSelectRange('24h')}
          >
            24 Hours
          </button>
        </div>
      </div>

      {/* Chart Canvas Wrap */}
      <div className="chart-canvas-wrap">
        <canvas ref={canvasRef} id="vitalsChart" aria-label="Trend chart of heart rate and SpO2"></canvas>
        {isEmpty && <div id="chart-empty" className="chart-empty">📡 Waiting for sensor data…</div>}
      </div>
    </div>
  );
}

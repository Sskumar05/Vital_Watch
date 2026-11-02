// =============================================================
//  Component: ECGCanvas
//  Hospital-grade real-time scrolling ECG waveform panel
// =============================================================

import React, { useRef, useEffect } from 'react';
import { generateECGCycle } from '../utils/ecgEngine';

const ECG_CYCLE = generateECGCycle(320);

export default function ECGCanvas({ latest, isDark }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const phaseRef = useRef(0);

  const status = latest ? latest.status : 'NORMAL';
  const heartRate = latest && latest.heart_rate ? latest.heart_rate : 72;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!ctx || width === 0) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const isCritical = status === 'CRITICAL';

      // Background
      ctx.fillStyle = '#050e1a';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      const gridColor = 'rgba(0,255,100,0.05)';
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 26) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center baseline
      ctx.strokeStyle = 'rgba(0,255,100,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.5);
      ctx.lineTo(width, height * 0.5);
      ctx.stroke();

      // Waveform styling
      const lineColor = isCritical ? '#ff4040' : '#00ff88';
      const glowColor = isCritical ? 'rgba(255,64,64,0.6)' : 'rgba(0,255,136,0.5)';
      const amplitude = height * 0.35;
      const midY = height * 0.5;
      const N = ECG_CYCLE.length;

      // Glow pass
      ctx.beginPath();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 4.5;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;
      for (let x = 0; x < width; x++) {
        const phase = Math.floor((phaseRef.current + x * 1.4) % N);
        const y = midY - ECG_CYCLE[phase] * amplitude;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Crisp pass
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 0;
      for (let x = 0; x < width; x++) {
        const phase = Math.floor((phaseRef.current + x * 1.4) % N);
        const y = midY - ECG_CYCLE[phase] * amplitude;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Scanning dot
      const scanPhase = Math.floor((phaseRef.current + (width - 1) * 1.4) % N);
      const scanY = midY - ECG_CYCLE[scanPhase] * amplitude;
      ctx.beginPath();
      ctx.arc(width - 1, scanY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.fill();

      // Phase advancement based on BPM
      const speed = (heartRate / 60) * 1.8;
      phaseRef.current = (phaseRef.current + speed) % N;

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [status, heartRate, isDark]);

  return (
    <div className="content-panel ecg-card-panel" aria-label="Live ECG Waveform">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-circle">
            <span>⚡</span>
          </div>
          <div>
            <div className="panel-title">Live ECG Waveform</div>
            <div className="panel-subtitle">Real-time PQRST continuous lead</div>
          </div>
        </div>
        <span id="ecg-bpm" className="ecg-bpm-chip">
          {latest && latest.heart_rate ? `${latest.heart_rate} bpm` : '-- bpm'}
        </span>
      </div>

      {/* Recessed High-Contrast Canvas Frame */}
      <div className="ecg-canvas-frame">
        <canvas ref={canvasRef} id="ecg-canvas" className="ecg-canvas" aria-label="Scrolling ECG waveform"></canvas>
      </div>

      {/* Wave Legends */}
      <div className="ecg-legend-row">
        <span className="ecg-wave-tag">P</span>
        <span className="ecg-wave-tag">Q</span>
        <span className="ecg-wave-tag ecg-r">R</span>
        <span className="ecg-wave-tag">S</span>
        <span className="ecg-wave-tag">T</span>
        <span className="ecg-speed-tag">Lead II · 25 mm/s</span>
      </div>
    </div>
  );
}

// =============================================================
//  Custom Hook: useVitalsPoll
//  Handles 3-second polling, data aggregation, session stats
// =============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchLatest, fetchHistory, fetchAlerts } from '../services/api';

const POLL_INTERVAL = 3000;
const FEED_MAX = 12;

export function useVitalsPoll() {
  const [currentRange, setCurrentRange] = useState('1h');
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [feedEvents, setFeedEvents] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('—');
  const [alertBannerActive, setAlertBannerActive] = useState(false);

  const statsRef = useRef({
    hrMin: Infinity,
    hrMax: -Infinity,
    hrSum: 0,
    spo2Min: Infinity,
    spo2Sum: 0,
    count: 0,
    alerts: 0,
  });

  const [stats, setStats] = useState({
    hrMin: '--',
    hrMax: '--',
    hrAvg: '--',
    spo2Min: '--',
    spo2Avg: '--',
    alerts: 0,
    readings: 0,
  });

  const updateStats = useCallback((hr, spo2, status) => {
    const s = statsRef.current;
    s.count++;
    s.hrSum += hr;
    s.spo2Sum += spo2;
    if (hr < s.hrMin) s.hrMin = hr;
    if (hr > s.hrMax) s.hrMax = hr;
    if (spo2 < s.spo2Min) s.spo2Min = spo2;
    if (status === 'CRITICAL') s.alerts++;

    setStats({
      hrMin: s.hrMin !== Infinity ? s.hrMin : '--',
      hrMax: s.hrMax !== -Infinity ? s.hrMax : '--',
      hrAvg: s.count > 0 ? Math.round(s.hrSum / s.count) : '--',
      spo2Min: s.spo2Min !== Infinity ? s.spo2Min.toFixed(1) : '--',
      spo2Avg: s.count > 0 ? (s.spo2Sum / s.count).toFixed(1) : '--',
      alerts: s.alerts,
      readings: s.count,
    });
  }, []);

  const addFeedEvent = useCallback((hr, spo2, status, timestamp) => {
    setFeedEvents(prev => {
      const next = [{ hr, spo2, status, timestamp }, ...prev];
      if (next.length > FEED_MAX) next.pop();
      return next;
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      const [latestData, historyData, alertsData] = await Promise.all([
        fetchLatest(),
        fetchHistory(currentRange),
        fetchAlerts(),
      ]);

      setIsOnline(true);
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));

      if (latestData) {
        setLatest(latestData);
        updateStats(latestData.heart_rate, latestData.spo2, latestData.status);
        addFeedEvent(latestData.heart_rate, latestData.spo2, latestData.status, latestData.timestamp);

        if (latestData.status === 'CRITICAL') {
          setAlertBannerActive(true);
        } else {
          setAlertBannerActive(false);
        }
      }

      setHistory(historyData || []);
      setAlerts(alertsData || []);
    } catch (err) {
      console.warn('[Poll] Backend unreachable:', err.message);
      setIsOnline(false);
    }
  }, [currentRange, updateStats, addFeedEvent]);

  // Initial and recurring poll
  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [poll]);

  const dismissAlertBanner = () => {
    setAlertBannerActive(false);
  };

  return {
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
  };
}


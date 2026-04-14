'use client';

import { track } from '@vercel/analytics';
import type { AnalyticsEventName, AnalyticsPayload } from './analytics-events';

function normalizePayload(payload?: AnalyticsPayload): Record<string, string | number | boolean> | undefined {
  if (!payload) return undefined;

  const normalized = Object.entries(payload).reduce<Record<string, string | number | boolean>>((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = value;
    }
    return acc;
  }, {});

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function trackClientEvent(eventName: AnalyticsEventName, payload?: AnalyticsPayload) {
  if (typeof window === 'undefined') return;

  try {
    track(eventName, normalizePayload(payload));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to track analytics event', eventName, error);
    }
  }
}

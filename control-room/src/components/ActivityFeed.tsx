'use client';

/**
 * PulZ Activity Feed
 * Phase D0 Hard Execution Mode
 *
 * Real-time activity feed showing all PulZ operations.
 * Updates via polling (every 2 seconds).
 */

import { useState, useEffect } from 'react';
import { useRevenue } from '@/lib/revenue/useRevenue';
import type { ActivityEvent } from '@/lib/revenue/localStorage';

const EVENT_ICONS = {
  opportunity_created: '📥',
  draft_created: '📝',
  draft_approved: '✅',
  job_created: '🔧',
  status_changed: '↗️',
  revenue_logged: '💰',
} as const;

const EVENT_COLORS = {
  opportunity_created: 'text-blue-400',
  draft_created: 'text-purple-400',
  draft_approved: 'text-green-400',
  job_created: 'text-cyan-400',
  status_changed: 'text-yellow-400',
  revenue_logged: 'text-green-500',
} as const;

interface ActivityFeedProps {
  limit?: number;
  pollInterval?: number;
}

export default function ActivityFeed({ limit = 10, pollInterval = 2000 }: ActivityFeedProps) {
  const { listActivityEvents } = useRevenue();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = () => {
      try {
        const allEvents = listActivityEvents();
        setEvents(allEvents.slice(0, limit));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load activity events:', error);
        setLoading(false);
      }
    };

    // Initial load
    loadEvents();

    // Poll for updates
    const interval = setInterval(loadEvents, pollInterval);

    return () => clearInterval(interval);
  }, [listActivityEvents, limit, pollInterval]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="mb-2">No activity yet</p>
        <p className="text-sm">Create an opportunity to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="p-3 bg-[#1a1f2e] border border-gray-700 rounded-lg hover:bg-[#1f2533] transition"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">{EVENT_ICONS[event.type]}</div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${EVENT_COLORS[event.type]}`}>
                {event.description}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{event.user_name}</span>
                <span>•</span>
                <span>{formatTimestamp(event.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

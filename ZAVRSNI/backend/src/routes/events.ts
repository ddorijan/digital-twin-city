import express from 'express';
import {
  createEvent,
  getActiveEvents,
  getEventsByType,
  resolveEvent,
  createAlert,
  getUnacknowledgedAlerts,
  acknowledgeAlert,
  getRecentAlerts
} from '../database/index.js';
import type { CityEvent, Alert } from '../database/services/eventService.js';
import { getIO } from '../websocket/index.js';

const router = express.Router();

const EVENT_TYPES = ['accident', 'road-work', 'flood', 'event', 'maintenance'] as const;
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const EVENT_STATUSES = ['active', 'resolved', 'monitoring'] as const;
const ALERT_SEVERITIES = ['info', 'warning', 'critical'] as const;

const isEventType = (value: unknown): value is CityEvent['event_type'] =>
  typeof value === 'string' && (EVENT_TYPES as readonly string[]).includes(value);
const isSeverity = (value: unknown): value is NonNullable<CityEvent['severity']> =>
  (SEVERITIES as readonly string[]).includes(value as string);
const isEventStatus = (value: unknown): value is NonNullable<CityEvent['status']> =>
  (EVENT_STATUSES as readonly string[]).includes(value as string);
const isAlertSeverity = (value: unknown): value is NonNullable<Alert['severity']> =>
  (ALERT_SEVERITIES as readonly string[]).includes(value as string);

// ============================================================================
// EVENTS ENDPOINTS
// ============================================================================

/**
 * GET /api/events
 * Get all active events
 */
router.get('/', (req, res) => {
  try {
    const events = getActiveEvents();
    res.json({
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/type/:eventType
 * Get events by type (accident, road-work, flood, etc.)
 */
router.get('/type/:eventType', (req, res) => {
  try {
    const { eventType } = req.params;
    const events = getEventsByType(eventType);
    res.json({
      event_type: eventType,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error fetching events by type:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', (req, res) => {
  try {
    const { event_type, title, description, lat, lng, severity, status, affected_area, metadata } = req.body;
    
    if (!isEventType(event_type)) {
      return res.status(400).json({ error: `event_type must be one of: ${EVENT_TYPES.join(', ')}` });
    }
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (typeof lat !== 'number' || !Number.isFinite(lat)) {
      return res.status(400).json({ error: 'lat must be a finite number' });
    }
    if (typeof lng !== 'number' || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'lng must be a finite number' });
    }
    if (severity !== undefined && !isSeverity(severity)) {
      return res.status(400).json({ error: `severity must be one of: ${SEVERITIES.join(', ')}` });
    }
    if (status !== undefined && !isEventStatus(status)) {
      return res.status(400).json({ error: `status must be one of: ${EVENT_STATUSES.join(', ')}` });
    }
    
    const eventId = createEvent({
      event_type,
      title,
      description,
      lat,
      lng,
      severity,
      status,
      affected_area,
      metadata
    });

    // Broadcast so every connected client shares the same incident state,
    // instead of it only existing in the browser tab that created it.
    getIO()?.emit('city-event', {
      action: 'created',
      event: {
        id: eventId,
        event_type,
        title,
        description,
        lat,
        lng,
        severity: severity ?? 'low',
        status: status ?? 'active',
      },
    });
    
    res.status(201).json({
      message: 'Event created successfully',
      event_id: eventId
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * PUT /api/events/:id/resolve
 * Mark an event as resolved
 */
router.put('/:id/resolve', (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: 'id must be a number' });
    }
    const success = resolveEvent(eventId);
    
    if (!success) {
      return res.status(404).json({ error: 'Event not found' });
    }

    getIO()?.emit('city-event', { action: 'resolved', id: eventId });
    
    res.json({
      message: 'Event resolved successfully',
      event_id: eventId
    });
  } catch (error) {
    console.error('Error resolving event:', error);
    res.status(500).json({ error: 'Failed to resolve event' });
  }
});

// ============================================================================
// ALERTS ENDPOINTS
// ============================================================================

/**
 * GET /api/events/alerts
 * Get recent alerts
 */
router.get('/alerts', (req, res) => {
  try {
    const { limit, unacknowledged } = req.query;
    
    let alerts;
    if (unacknowledged === 'true') {
      alerts = getUnacknowledgedAlerts();
    } else {
      const parsedLimit = limit ? parseInt(limit as string, 10) : 50;
      const maxLimit = Number.isNaN(parsedLimit) ? 50 : parsedLimit;
      alerts = getRecentAlerts(maxLimit);
    }
    
    res.json({
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * POST /api/events/alerts
 * Create a new alert
 */
router.post('/alerts', (req, res) => {
  try {
    const { sensor_id, alert_type, severity, message, threshold_value, actual_value, metadata } = req.body;
    
    if (typeof alert_type !== 'string' || !alert_type.trim()) {
      return res.status(400).json({ error: 'alert_type is required' });
    }
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (severity !== undefined && !isAlertSeverity(severity)) {
      return res.status(400).json({ error: `severity must be one of: ${ALERT_SEVERITIES.join(', ')}` });
    }
    
    const alertId = createAlert({
      sensor_id,
      alert_type,
      severity,
      message,
      threshold_value,
      actual_value,
      metadata
    });
    
    res.status(201).json({
      message: 'Alert created successfully',
      alert_id: alertId
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

/**
 * PUT /api/events/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.put('/alerts/:id/acknowledge', (req, res) => {
  try {
    const alertId = parseInt(req.params.id, 10);
    if (Number.isNaN(alertId)) {
      return res.status(400).json({ error: 'id must be a number' });
    }
    const { acknowledged_by } = req.body;
    
    const success = acknowledgeAlert(alertId, acknowledged_by);
    
    if (!success) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({
      message: 'Alert acknowledged successfully',
      alert_id: alertId
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

export default router;

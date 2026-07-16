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

const router = express.Router();

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
    
    if (!event_type || !title) {
      return res.status(400).json({ error: 'event_type and title are required' });
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
    const eventId = parseInt(req.params.id);
    const success = resolveEvent(eventId);
    
    if (!success) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
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
      const maxLimit = limit ? parseInt(limit as string) : 50;
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
    
    if (!alert_type || !message) {
      return res.status(400).json({ error: 'alert_type and message are required' });
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
    const alertId = parseInt(req.params.id);
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

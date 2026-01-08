import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Switch, FormControlLabel, TextField, Button, Box } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const NotificationPreferences = () => {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState({
    notificationPreferences: {
      shipment_status_change: { email: true, sms: false, webhook: false },
      pickup_scheduled: { email: true, sms: false, webhook: false },
      ndr_triggered: { email: true, sms: false, webhook: false },
      wallet_low_balance: { email: true, sms: false, webhook: false }
    },
    webhookUrl: ''
  });
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notifications/preferences/me', { headers });
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  const handleChange = (eventType, channel, value) => {
    setPreferences(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [eventType]: {
          ...prev.notificationPreferences[eventType],
          [channel]: value
        }
      }
    }));
  };

  const handleWebhookUrlChange = (value) => {
    setPreferences(prev => ({ ...prev, webhookUrl: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('http://localhost:5000/api/notifications/preferences/me', preferences, { headers });
      alert('Preferences updated successfully');
    } catch (error) {
      alert('Failed to update preferences: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const eventLabels = {
    shipment_status_change: 'Shipment Status Changes',
    pickup_scheduled: 'Pickup Scheduled',
    ndr_triggered: 'NDR Triggered',
    wallet_low_balance: 'Wallet Low Balance'
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Notification Preferences</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Choose how you want to be notified for different events.
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {Object.keys(preferences.notificationPreferences).map(eventType => (
              <Grid item xs={12} key={eventType}>
                <Typography variant="subtitle1" gutterBottom>{eventLabels[eventType]}</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notificationPreferences[eventType].email}
                        onChange={(e) => handleChange(eventType, 'email', e.target.checked)}
                      />
                    }
                    label="Email"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notificationPreferences[eventType].sms}
                        onChange={(e) => handleChange(eventType, 'sms', e.target.checked)}
                      />
                    }
                    label="SMS"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notificationPreferences[eventType].webhook}
                        onChange={(e) => handleChange(eventType, 'webhook', e.target.checked)}
                      />
                    }
                    label="Webhook"
                  />
                </Box>
              </Grid>
            ))}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook URL"
                value={preferences.webhookUrl}
                onChange={(e) => handleWebhookUrlChange(e.target.value)}
                placeholder="https://your-webhook-url.com"
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Preferences'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
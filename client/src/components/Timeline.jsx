import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Stepper, Step, StepLabel, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const ShipmentTimeline = ({ shipmentId }) => {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (shipmentId) {
      fetchEvents();
    }
  }, [shipmentId]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/shipments/${shipmentId}/events`, { headers });
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch tracking events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!events || events.length === 0) {
    return <Typography>No timeline available</Typography>;
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Stepper orientation="vertical">
        {events.map((event, index) => (
          <Step key={index} active={true} completed={true}>
            <StepLabel>
              <Paper elevation={2} sx={{ p: 2, mt: 1, width: '100%' }}>
                <Typography variant="h6">
                  {event.eventCode.replace('_', ' ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(event.timestamp).toLocaleString()}
                </Typography>
                {event.location && (
                  <Typography variant="body2" color="text.secondary">
                    Location: {event.location}
                  </Typography>
                )}
                {event.description && (
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {event.description}
                  </Typography>
                )}
              </Paper>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'grey';
    case 'in-transit': return 'blue';
    case 'delivered': return 'green';
    case 'cancelled': return 'red';
    default: return 'grey';
  }
};

export default ShipmentTimeline;
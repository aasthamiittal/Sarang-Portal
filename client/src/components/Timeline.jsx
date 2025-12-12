import React from 'react';
import { Typography, Paper, Box, Stepper, Step, StepLabel } from '@mui/material';

const ShipmentTimeline = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) {
    return <Typography>No timeline available</Typography>;
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Stepper orientation="vertical">
        {statusHistory.map((item, index) => (
          <Step key={index} active={true} completed={true}>
            <StepLabel>
              <Paper elevation={2} sx={{ p: 2, mt: 1, width: '100%' }}>
                <Typography variant="h6">
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(item.timestamp).toLocaleString()}
                </Typography>
                {item.note && (
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {item.note}
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
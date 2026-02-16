import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  CircularProgress, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Chip,
  Alert,
  AlertTitle,
  Tabs, // Import Tabs
  Tab // Import Tab
} from '@mui/material';
import { Search, LocalShipping, CheckCircleOutline, CancelOutlined, LocationOn, Schedule, CheckCircle, DeliveryDining, Cancel } from '@mui/icons-material'; // Added more icons
import SarangLogo from '../assets/Logo.png'; // Import the logo
import axios from 'axios';
import { BASE_API_URL } from '../constants';

const getStatusColor = (status) => {
  switch (status) {
    case 'DELIVERED': return 'success';
    case 'OUT_FOR_DELIVERY': return 'info';
    case 'IN_TRANSIT': return 'primary';
    case 'CANCELLED':
    case 'LOST':
    case 'DAMAGED': return 'error';
    case 'NDR':
    case 'RTO_INITIATED': return 'warning';
    default: return 'default';
  }
};

const PublicTracking = () => {
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [secureTokenInput, setSecureTokenInput] = useState('');
  const [searchType, setSearchType] = useState(0); // 0 for Tracking Number, 1 for Secure Token
  const [shipment, setShipment] = useState(null);
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    let identifier = searchType === 0 ? trackingIdInput : secureTokenInput;
    if (!identifier.trim()) {
      setError(searchType === 0 ? 'Please enter a tracking number.' : 'Please enter a secure token.');
      setShipment(null);
      setTrackingEvents([]);
      return;
    }

    setLoading(true);
    setError(null);
    setShipment(null);
    setTrackingEvents([]);

    try {
      const params = {};
      if (searchType === 0) {
        params.trackingNumber = identifier;
      } else {
        params.secureToken = identifier;
      }

      const response = await axios.get(`${BASE_API_URL}/public/track`, { params });
      setShipment(response.data.shipment);
      setTrackingEvents(response.data.trackingEvents);
    } catch (err) {
      console.error('Tracking failed:', err);
      setError(err.response?.data?.message || 'Failed to fetch tracking information. Please check your tracking number or token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f0f2f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      py: 4,
      px: 2
    }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center', bgcolor: 'white' }}>
          <Box sx={{ mb: 2 }}>
            <img src={SarangLogo} alt="Sarang Logistics" style={{ height: 60 }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700} color="primary.main">
            Track Your Shipment
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter your tracking number or secure token to get the latest updates on your shipment.
          </Typography>

          <Tabs value={searchType} onChange={handleTabChange} centered sx={{ mb: 3 }}>
            <Tab label="Tracking Number" />
            <Tab label="Secure Token" />
          </Tabs>

          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            {searchType === 0 ? (
              <TextField
                fullWidth
                label="Tracking Number"
                variant="outlined"
                size="medium"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />
            ) : (
              <TextField
                fullWidth
                label="Secure Token"
                variant="outlined"
                size="medium"
                value={secureTokenInput}
                onChange={(e) => setSecureTokenInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />
            )}
            <Button 
              variant="contained" 
              onClick={handleSearch} 
              disabled={loading}
              sx={{
                px: 4,
                bgcolor: '#4e5dde',
                '&:hover': { bgcolor: '#3d4bc7' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Track'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Tracking Error</AlertTitle>
              {error}
            </Alert>
          )}

          {shipment && (
            <Box sx={{ mt: 4, textAlign: 'left' }}>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Shipment Details
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, borderColor: '#e0e0e0' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Tracking Number</Typography>
                    <Typography variant="body1" fontWeight={500}>{shipment.trackingNumber}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">AWB Number</Typography>
                    <Typography variant="body1" fontWeight={500}>{shipment.awbNumber || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Current Status</Typography>
                    <Chip 
                      label={shipment.status.replace('_', ' ')}
                      color={getStatusColor(shipment.status)}
                      size="small"
                      sx={{
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        height: '24px'
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Origin</Typography>
                    <Typography variant="body1" fontWeight={500}>{shipment.origin}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Destination</Typography>
                    <Typography variant="body1" fontWeight={500}>{shipment.destination}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Carrier</Typography>
                    <Typography variant="body1" fontWeight={500}>{shipment.carrier || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Expected Delivery</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {shipment.expectedDelivery ? new Date(shipment.expectedDelivery).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Actual Delivery</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {shipment.actualDelivery ? new Date(shipment.actualDelivery).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>

              </Paper>

              <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
                Tracking Timeline
              </Typography>
              {trackingEvents.length > 0 ? (
                <Stepper orientation="vertical" activeStep={trackingEvents.length - 1} sx={{ mt: 2 }}>
                  {trackingEvents.map((event, index) => (
                    <Step key={index} completed={true}>
                      <StepLabel
                        StepIconComponent={() => getStepIcon(event.eventCode)}
                      >
                        <Paper elevation={1} sx={{ p: 2, mb: 1, borderRadius: 1, borderLeft: '4px solid', borderColor: getStatusColor(event.eventCode) }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {event.eventCode.replace(/_/g, ' ')}
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
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {event.description}
                            </Typography>
                          )}
                        </Paper>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              ) : (
                <Alert severity="info">
                  <AlertTitle>No Tracking Events</AlertTitle>
                  No tracking events available for this shipment yet.
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicTracking;
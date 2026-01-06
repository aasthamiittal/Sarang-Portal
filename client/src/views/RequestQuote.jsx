import React, { useState } from 'react';
import { Button, TextField, Card, CardContent, Typography, Grid, MenuItem, Box } from '@mui/material';
import { Send } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const RequestQuote = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    serviceType: '',
    specialRequirements: ''
  });

  const headers = { Authorization: `Bearer ${token}` };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_API_URL}/quotes`, formData, { headers });
      alert('Quote request submitted successfully. Our team will contact you soon.');
      setFormData({
        origin: '',
        destination: '',
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        serviceType: '',
        specialRequirements: ''
      });
    } catch (error) {
      console.error('Failed to submit quote request:', error);
      alert('Failed to submit quote request. Please try again.');
    }
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  return (
    <Box sx={{ padding: { xs: 2, md: 3 } }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 'bold',
          mb: 4,
          color: '#1f2937',
          fontSize: { xs: '1.875rem', md: '2.25rem' }
        }}
      >
        Request a Quote
      </Typography>

      <Card
        elevation={2}
        sx={{
          maxWidth: '900px',
          mx: 'auto',
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: '#374151'
            }}
          >
            Get a customized shipping quote for your needs
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Fill out the form below and our team will provide you with a competitive quote within 24 hours.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Origin and Destination */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Origin"
                  value={formData.origin}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="Enter origin city/address"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Destination"
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="Enter destination city/address"
                />
              </Grid>

              {/* Weight and Service Type */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Weight (kg)"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="Enter weight in kg"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              
                <TextField
                  select
                  label="Service Type"
                  value={formData.serviceType}
                  onChange={(e) => handleChange('serviceType', e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                >
                  <MenuItem value="">
                    <em>Select Service Type</em>
                  </MenuItem>
                  <MenuItem value="standard">Standard Delivery</MenuItem>
                  <MenuItem value="express">Express Delivery</MenuItem>
                  <MenuItem value="overnight">Overnight</MenuItem>
                  <MenuItem value="international">International</MenuItem>
                </TextField>

              {/* Dimensions Section */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    mt: 1,
                    mb: 1
                  }}
                >
                  Package Dimensions (cm) :
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Length"
                  type="number"
                  value={formData.dimensions.length}
                  onChange={(e) => handleChange('dimensions.length', e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="Length"
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Width"
                  type="number"
                  value={formData.dimensions.width}
                  onChange={(e) => handleChange('dimensions.width', e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="Width"
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Height"
                  type="number"
                  value={formData.dimensions.height}
                  onChange={(e) => handleChange('dimensions.height', e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="Height"
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>

              {/* Special Requirements */}
              <Grid item xs={12}>
                <TextField
                  label="Special Requirements"
                  value={formData.specialRequirements}
                  onChange={(e) => handleChange('specialRequirements', e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Any special handling instructions, fragile items, temperature control, etc."
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Send />}
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 1.5,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                >
                  Request Quote
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RequestQuote;
import React, { useState } from 'react';
import { Button, TextField, Card, CardContent, Typography, Grid, MenuItem } from '@mui/material';
import { Send } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

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
      await axios.post('http://localhost:5000/api/quotes', formData, { headers });
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
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Request a Quote</h1>

      <Card className="max-w-2xl mx-auto">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Get a customized shipping quote for your needs
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mb-6">
            Fill out the form below and our team will provide you with a competitive quote within 24 hours.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Origin"
                  value={formData.origin}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Destination"
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Weight (kg)"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Service Type"
                  value={formData.serviceType}
                  onChange={(e) => handleChange('serviceType', e.target.value)}
                  fullWidth
                  required
                >
                  <MenuItem value="standard">Standard Delivery</MenuItem>
                  <MenuItem value="express">Express Delivery</MenuItem>
                  <MenuItem value="overnight">Overnight</MenuItem>
                  <MenuItem value="international">International</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Dimensions (cm)
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Length"
                  type="number"
                  value={formData.dimensions.length}
                  onChange={(e) => handleChange('dimensions.length', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Width"
                  type="number"
                  value={formData.dimensions.width}
                  onChange={(e) => handleChange('dimensions.width', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Height"
                  type="number"
                  value={formData.dimensions.height}
                  onChange={(e) => handleChange('dimensions.height', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Special Requirements"
                  value={formData.specialRequirements}
                  onChange={(e) => handleChange('specialRequirements', e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Any special handling instructions, fragile items, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Send />}
                  fullWidth
                >
                  Request Quote
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestQuote;
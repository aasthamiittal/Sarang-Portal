import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

const ShipmentForm = ({ open, onClose, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    carrier: '',
    weight: '',
  });

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData.id ? 'Edit Shipment' : 'Add Shipment'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Origin"
            name="origin"
            value={formData.origin || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Destination"
            name="destination"
            value={formData.destination || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Carrier"
            name="carrier"
            value={formData.carrier || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Weight"
            name="weight"
            value={formData.weight || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {initialData.id ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ShipmentForm;
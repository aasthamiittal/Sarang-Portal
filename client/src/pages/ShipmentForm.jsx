import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Typography, FormControlLabel, Checkbox } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const ShipmentForm = ({ open, onClose, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    carrier: '',
    weight: '',
    pickupAddress: {
      name: '',
      address: '',
      phone: ''
    },
    customerInfo: {
      firstName: '',
      lastName: '',
      mobile: '',
      alternateMobile: '',
      email: '',
      country: '',
      address1: '',
      address2: '',
      landmark: '',
      pincode: '',
      city: '',
      state: ''
    },
    billingSameAsShipping: true,
    productInfo: {
      description: '',
      quantity: '',
      value: ''
    },
    orderNotes: '',
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...initialData,
      pickupAddress: { ...prev.pickupAddress, ...initialData.pickupAddress },
      customerInfo: { ...prev.customerInfo, ...initialData.customerInfo },
      productInfo: { ...prev.productInfo, ...initialData.productInfo }
    }));
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData._id ? 'Edit Order' : 'Create New Order'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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

          <Typography variant="h6" style={{ marginTop: 20 }}>Pickup Address</Typography>
          <TextField
            label="Pickup Name"
            name="pickupAddress.name"
            value={formData.pickupAddress?.name || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Pickup Address"
            name="pickupAddress.address"
            value={formData.pickupAddress?.address || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Pickup Phone"
            name="pickupAddress.phone"
            value={formData.pickupAddress?.phone || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <Typography variant="h6" style={{ marginTop: 20 }}>Customer Information</Typography>
          <TextField
            label="First Name"
            name="customerInfo.firstName"
            value={formData.customerInfo?.firstName || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Last Name"
            name="customerInfo.lastName"
            value={formData.customerInfo?.lastName || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Mobile Number"
            name="customerInfo.mobile"
            value={formData.customerInfo?.mobile || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Alternate Mobile"
            name="customerInfo.alternateMobile"
            value={formData.customerInfo?.alternateMobile || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email Address"
            name="customerInfo.email"
            value={formData.customerInfo?.email || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            type="email"
          />
          <TextField
            label="Country"
            name="customerInfo.country"
            value={formData.customerInfo?.country || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Address 1"
            name="customerInfo.address1"
            value={formData.customerInfo?.address1 || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Address 2"
            name="customerInfo.address2"
            value={formData.customerInfo?.address2 || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Landmark"
            name="customerInfo.landmark"
            value={formData.customerInfo?.landmark || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Pincode"
            name="customerInfo.pincode"
            value={formData.customerInfo?.pincode || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="City"
            name="customerInfo.city"
            value={formData.customerInfo?.city || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="State"
            name="customerInfo.state"
            value={formData.customerInfo?.state || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />

          <Typography variant="h6" style={{ marginTop: 20 }}>Billing Information</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.billingSameAsShipping}
                onChange={(e) => setFormData({ ...formData, billingSameAsShipping: e.target.checked })}
                name="billingSameAsShipping"
              />
            }
            label="Billing address is same as shipping address"
          />

          <Typography variant="h6" style={{ marginTop: 20 }}>Shipment Information</Typography>
          <TextField
            label="Product Description"
            name="productInfo.description"
            value={formData.productInfo?.description || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Quantity"
            name="productInfo.quantity"
            value={formData.productInfo?.quantity || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            type="number"
          />
          <TextField
            label="Value"
            name="productInfo.value"
            value={formData.productInfo?.value || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            type="number"
          />
          <TextField
            label="Order Notes"
            name="orderNotes"
            value={formData.orderNotes || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {initialData._id ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ShipmentForm;
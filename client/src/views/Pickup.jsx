import React, { useState, useEffect } from 'react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { Add, Timeline } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const Pickup = () => {
  const { token } = useAuth();
  const [pickups, setPickups] = useState([]);
  const [slots, setSlots] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [newPickup, setNewPickup] = useState({
    orderId: '',
    pickupAddress: '',
    preferredSlot: ''
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchPickups();
    fetchSlots();
  }, []);

  const fetchPickups = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/pickup`, { headers });
      setPickups(response.data);
    } catch (error) {
      console.error('Failed to fetch pickups:', error);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/pickup/slots`, { headers });
      setSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const handleRequestPickup = () => {
    setNewPickup({ orderId: '', pickupAddress: '', preferredSlot: '' });
    setDialogOpen(true);
  };

  const handleSavePickup = async () => {
    try {
      await axios.post(`${BASE_API_URL}/pickup/request`, newPickup, { headers });
      fetchPickups();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to request pickup:', error);
    }
  };

  const handleViewTimeline = (pickup) => {
    setSelectedPickup(pickup);
    setTimelineDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in-progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Pickup Management</h1>

      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Button variant="contained" startIcon={<Add />} onClick={handleRequestPickup}>
          Request Pickup
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Pickup Address</TableCell>
              <TableCell>Preferred Slot</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pickups.map((pickup) => (
              <TableRow key={pickup._id}>
                <TableCell>{pickup.orderId}</TableCell>
                <TableCell>{pickup.pickupAddress}</TableCell>
                <TableCell>{pickup.preferredSlot}</TableCell>
                <TableCell>
                  <Chip
                    label={pickup.status.replace('-', ' ').toUpperCase()}
                    color={getStatusColor(pickup.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{pickup.agentName || 'Not assigned'}</TableCell>
                <TableCell>
                  <Button size="small" startIcon={<Timeline />} onClick={() => handleViewTimeline(pickup)}>
                    Timeline
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Request Pickup</DialogTitle>
        <DialogContent>
          <TextField
            label="Order ID"
            value={newPickup.orderId}
            onChange={(e) => setNewPickup({ ...newPickup, orderId: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Pickup Address"
            value={newPickup.pickupAddress}
            onChange={(e) => setNewPickup({ ...newPickup, pickupAddress: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            select
            label="Preferred Time Slot"
            value={newPickup.preferredSlot}
            onChange={(e) => setNewPickup({ ...newPickup, preferredSlot: e.target.value })}
            fullWidth
            margin="normal"
          >
            {slots.map((slot) => (
              <MenuItem key={slot.id} value={slot.time}>
                {slot.time}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePickup} variant="contained">Request</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={timelineDialogOpen} onClose={() => setTimelineDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pickup Timeline - Order {selectedPickup?.orderId}</DialogTitle>
        <DialogContent>
          {selectedPickup && (
            <div className="space-y-4">
              {selectedPickup.timeline?.map((event, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mt-1"></div>
                  <div>
                    <p className="font-semibold">{event.status}</p>
                    <p className="text-sm text-gray-600">{new Date(event.timestamp).toLocaleString()}</p>
                    {event.note && <p className="text-sm">{event.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pickup;
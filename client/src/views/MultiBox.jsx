import React, { useState, useEffect } from 'react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const MultiBox = () => {
  const { token } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [boxes, setBoxes] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBox, setNewBox] = useState({ length: '', width: '', height: '', weight: '' });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (orderId) {
      fetchBoxes();
    }
  }, [orderId]);

  const fetchBoxes = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/multi-box/${orderId}`, { headers });
      setBoxes(response.data);
    } catch (error) {
      console.error('Failed to fetch boxes:', error);
    }
  };

  const handleAddBox = () => {
    setNewBox({ length: '', width: '', height: '', weight: '' });
    setDialogOpen(true);
  };

  const handleSaveBox = async () => {
    try {
      await axios.post(`http://localhost:5000/api/multi-box/${orderId}`, newBox, { headers });
      fetchBoxes();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save box:', error);
    }
  };

  const handleDeleteBox = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/multi-box/${id}`, { headers });
      fetchBoxes();
    } catch (error) {
      console.error('Failed to delete box:', error);
    }
  };

  const calculateTotalWeight = () => {
    return boxes.reduce((total, box) => total + parseFloat(box.weight || 0), 0);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Multi Box Management</h1>

      <div className="mb-6">
        <TextField
          label="Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          fullWidth
        />
      </div>

      {orderId && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Boxes for Order {orderId}</h2>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddBox}>
              Add Box
            </Button>
          </div>

          <TableContainer component={Paper} className="mb-6">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Length (cm)</TableCell>
                  <TableCell>Width (cm)</TableCell>
                  <TableCell>Height (cm)</TableCell>
                  <TableCell>Weight (kg)</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {boxes.map((box) => (
                  <TableRow key={box._id}>
                    <TableCell>{box.length}</TableCell>
                    <TableCell>{box.width}</TableCell>
                    <TableCell>{box.height}</TableCell>
                    <TableCell>{box.weight}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDeleteBox(box._id)} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p>Total Boxes: {boxes.length}</p>
            <p>Total Weight: {calculateTotalWeight()} kg</p>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add New Box</DialogTitle>
        <DialogContent>
          <TextField
            label="Length (cm)"
            type="number"
            value={newBox.length}
            onChange={(e) => setNewBox({ ...newBox, length: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Width (cm)"
            type="number"
            value={newBox.width}
            onChange={(e) => setNewBox({ ...newBox, width: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Height (cm)"
            type="number"
            value={newBox.height}
            onChange={(e) => setNewBox({ ...newBox, height: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Weight (kg)"
            type="number"
            value={newBox.weight}
            onChange={(e) => setNewBox({ ...newBox, weight: e.target.value })}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveBox} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MultiBox;
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, MenuItem, Card, CardContent } from '@mui/material';
import { CloudUpload, Visibility, Delete, Add } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const columns = [
  { field: 'fileName', headerName: 'File Name', width: 250 },
  { field: 'uploadedAt', headerName: 'Uploaded At', width: 180, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    renderCell: (params) => (
      <div className="flex space-x-1">
        <Button size="small" startIcon={<Visibility />} onClick={() => params.api.handleView(params.row)}>View</Button>
        <Button size="small" color="error" startIcon={<Delete />} onClick={() => params.api.handleDelete(params.row.id)}>Delete</Button>
      </div>
    ),
  },
];

const Manifests = () => {
  const { token } = useAuth();
  const [manifests, setManifests] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchManifests();
    fetchShipments();
  }, [token]);

  const fetchManifests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/manifests', { headers });
      setManifests(response.data);
    } catch (error) {
      console.error('Failed to fetch manifests:', error);
    }
    setLoading(false);
  };

  const fetchShipments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/shipments', { headers });
      setShipments(response.data);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    }
  };

  const handleUpload = () => {
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedShipment) {
      alert('Please select a file and a shipment');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('shipment', selectedShipment);
    try {
      await axios.post('http://localhost:5000/api/manifests', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchManifests();
      setShowForm(false);
      setSelectedFile(null);
      setSelectedShipment('');
    } catch (error) {
      console.error('Failed to upload manifest:', error);
    }
  };

  const handleView = (manifest) => {
    window.open(`http://localhost:5000/api/manifests/${manifest.id}/download`, '_blank');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this manifest?')) {
      try {
        await axios.delete(`http://localhost:5000/api/manifests/${id}`, { headers });
        fetchManifests();
      } catch (error) {
        console.error('Failed to delete manifest:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manifests</h1>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleUpload}>
          Upload Manifest
        </Button>
      </div>
      {showForm && (
        <Card className="mb-6">
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <TextField
                  type="file"
                  label="Select File"
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  required
                  fullWidth
                />
                <TextField
                  select
                  label="Select Shipment"
                  value={selectedShipment}
                  onChange={(e) => setSelectedShipment(e.target.value)}
                  required
                  fullWidth
                >
                  <MenuItem value="">Choose a shipment</MenuItem>
                  {shipments.map(shipment => (
                    <MenuItem key={shipment._id} value={shipment._id}>{shipment.trackingNumber}</MenuItem>
                  ))}
                </TextField>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="contained" color="primary" startIcon={<CloudUpload />}>Upload</Button>
                <Button onClick={() => setShowForm(false)} variant="outlined">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent>
          <div style={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={manifests}
              getRowId={(row) => row._id}
              columns={columns.map(col => col.field === 'actions' ? { ...col, renderCell: (params) => (
                <div className="flex space-x-1">
                  <Button size="small" startIcon={<Visibility />} onClick={() => handleView(params.row)}>View</Button>
                  <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(params.row._id)}>Delete</Button>
                </div>
              )} : col)}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 25]}
              loading={loading}
              disableSelectionOnClick
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Manifests;
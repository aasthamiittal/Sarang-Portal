import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, MenuItem, Card, CardContent, Chip } from '@mui/material';
import { CloudUpload, Visibility, Delete, Add, Edit, Send, Lock } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const getStatusColor = (status) => {
  switch (status) {
    case 'draft': return 'default';
    case 'edited': return 'warning';
    case 'submitted': return 'info';
    case 'locked': return 'success';
    default: return 'default';
  }
};

const columns = [
  { field: 'fileName', headerName: 'File Name', minWidth: 200 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 120,
    renderCell: (params) => (
      <Chip
        label={(params.value || 'unknown').replace('-', ' ')}
        color={getStatusColor(params.value)}
        size="small"
        sx={{ textTransform: 'capitalize' }}
      />
    ),
  },
  {
    field: 'shipment',
    headerName: 'Shipment',
    minWidth: 150,
    valueGetter: (params) => params.row.shipment?.orderId || 'N/A'
  },
  { field: 'uploadedAt', headerName: 'Uploaded At', minWidth: 150, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A' },
  {
    field: 'actions',
    headerName: 'Actions',
    minWidth: 250,
    renderCell: (params) => {
      const manifest = params.row;
      return (
        <div className="flex space-x-1">
          <Button size="small" startIcon={<Visibility />} onClick={() => handleView(manifest)}>View</Button>
          {manifest.status !== 'locked' && (
            <>
              {manifest.status === 'draft' && (
                <Button size="small" startIcon={<Edit />} color="primary" onClick={() => handleEdit(manifest)}>Edit</Button>
              )}
              {(manifest.status === 'draft' || manifest.status === 'edited') && (
                <Button size="small" startIcon={<Send />} color="secondary" onClick={() => handleManifestSubmit(manifest._id)}>Submit</Button>
              )}
              {manifest.status === 'submitted' && (
                <Button size="small" startIcon={<Lock />} color="success" onClick={() => handleManifestLock(manifest._id)}>Lock</Button>
              )}
            </>
          )}
          <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(manifest._id)}>Delete</Button>
        </div>
      );
    },
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
      const response = await axios.get(`${BASE_API_URL}/manifests`, { headers });
      setManifests(response.data);
    } catch (error) {
      console.error('Failed to fetch manifests:', error);
    }
    setLoading(false);
  };

  const fetchShipments = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/shipments`, { headers });
      setShipments(response.data.shipments || []);
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
      await axios.post(`${BASE_API_URL}/manifests`, formData, {
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
    window.open(`${BASE_API_URL}/manifests/${manifest._id}/download`, '_blank');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this manifest?')) {
      try {
        await axios.delete(`${BASE_API_URL}/manifests/${id}`, { headers });
        fetchManifests();
      } catch (error) {
        console.error('Failed to delete manifest:', error);
      }
    }
  };

  const handleEdit = (manifest) => {
    // For now, just show an alert. In a full implementation, this would open an edit form
    alert('Edit functionality would open a form to modify manifest details');
  };

  const handleManifestSubmit = async (id) => {
    if (window.confirm('Are you sure you want to submit this manifest? This will lock shipments for editing.')) {
      try {
        await axios.post(`${BASE_API_URL}/manifests/${id}/submit`, {}, { headers });
        fetchManifests();
        alert('Manifest submitted successfully');
      } catch (error) {
        console.error('Failed to submit manifest:', error);
        alert('Failed to submit manifest: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleManifestLock = async (id) => {
    if (window.confirm('Are you sure you want to lock this manifest? This is the final step.')) {
      try {
        await axios.post(`${BASE_API_URL}/manifests/${id}/lock`, {}, { headers });
        fetchManifests();
        alert('Manifest locked successfully');
      } catch (error) {
        console.error('Failed to lock manifest:', error);
        alert('Failed to lock manifest: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manifests</h1>
        {!showForm && (
          <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleUpload}>
            Upload Manifest
          </Button>
        )}
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
                  {Array.isArray(shipments) && shipments.map(shipment => (
                    <MenuItem key={shipment._id || shipment.id} value={shipment._id || shipment.id}>{shipment.trackingNumber || 'No Tracking'}</MenuItem>
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
        <CardContent className="overflow-x-auto">
          <div style={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={manifests}
              getRowId={(row) => row._id}
              columns={columns}
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
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, Card, CardContent } from '@mui/material';
import { Add, Edit, Delete, Timeline, CloudUpload, Search, FilterList } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import ShipmentForm from './ShipmentForm';
import ShipmentTimeline from '../components/Timeline';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'in-transit': return 'info';
    case 'delivered': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const columns = [
  { field: 'trackingNumber', headerName: 'Tracking Number', width: 180 },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value.replace('-', ' ').toUpperCase()}
        color={getStatusColor(params.value)}
        size="small"
      />
    ),
  },
  { field: 'origin', headerName: 'Origin', width: 120 },
  { field: 'destination', headerName: 'Destination', width: 120 },
  { field: 'cost', headerName: 'Cost ($)', width: 100, type: 'number' },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    renderCell: (params) => (
      <div className="flex space-x-1">
        <Button size="small" startIcon={<Timeline />} onClick={() => params.api.handleViewTimeline(params.row)}>Timeline</Button>
        <Button size="small" startIcon={<Edit />} onClick={() => params.api.handleEdit(params.row)}>Edit</Button>
        <Button size="small" color="error" startIcon={<Delete />} onClick={() => params.api.handleDelete(params.row.id)}>Delete</Button>
      </div>
    ),
  },
];

const Shipments = () => {
  const { token } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    carrier: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [editingShipment, setEditingShipment] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchShipments();
  }, [token, page, pageSize]);

  useEffect(() => {
    if (Object.values(filters).some(v => v)) {
      fetchShipments(1, filters);
      setPage(1);
    }
  }, [filters]);

  const fetchShipments = async (currentPage = page, currentFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v))
      });
      const response = await axios.get(`http://localhost:5000/api/shipments?${params}`, { headers });
      setShipments(response.data.shipments);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingShipment(null);
    setDialogOpen(true);
  };

  const handleEdit = (shipment) => {
    setEditingShipment(shipment);
    setDialogOpen(true);
  };

  const handleViewTimeline = (shipment) => {
    setSelectedShipment(shipment);
    setTimelineDialogOpen(true);
  };

  const handleBulkUpload = () => {
    setBulkDialogOpen(true);
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post('http://localhost:5000/api/shipments/bulk', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchShipments();
      setBulkDialogOpen(false);
      setSelectedFile(null);
      alert('Bulk upload successful');
    } catch (error) {
      console.error('Bulk upload failed:', error);
      alert('Bulk upload failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shipment?')) {
      try {
        await axios.delete(`http://localhost:5000/api/shipments/${id}`, { headers });
        fetchShipments();
      } catch (error) {
        console.error('Failed to delete shipment:', error);
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingShipment) {
        await axios.put(`http://localhost:5000/api/shipments/${editingShipment.id}`, formData, { headers });
      } else {
        await axios.post('http://localhost:5000/api/shipments', formData, { headers });
      }
      fetchShipments();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save shipment:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Shipments</h1>
        <div className="flex space-x-2">
          <Button variant="outlined" startIcon={<CloudUpload />} onClick={handleBulkUpload}>
            Bulk Upload
          </Button>
          <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleAdd}>
            Add Shipment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                InputProps={{
                  startAdornment: <Search />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in-transit">In Transit</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Carrier"
                value={filters.carrier}
                onChange={(e) => setFilters({ ...filters, carrier: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Origin"
                value={filters.origin}
                onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilters({
                  search: '',
                  status: '',
                  carrier: '',
                  origin: '',
                  destination: '',
                  startDate: '',
                  endDate: ''
                })}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div style={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={shipments}
            getRowId={(row) => row._id}
            columns={columns.map(col => col.field === 'actions' ? { ...col, renderCell: (params) => (
              <div className="flex space-x-1">
                <Button size="small" startIcon={<Timeline />} onClick={() => handleViewTimeline(params.row)}>Timeline</Button>
                <Button size="small" startIcon={<Edit />} onClick={() => handleEdit(params.row)}>Edit</Button>
                <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(params.row._id)}>Delete</Button>
              </div>
            )} : col)}
            page={page - 1}
            pageSize={pageSize}
            rowsPerPageOptions={[5, 10, 25]}
            onPageChange={(newPage) => setPage(newPage + 1)}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            paginationMode="server"
            rowCount={total}
            loading={loading}
            disableSelectionOnClick
          />
        </div>
      </div>
      <ShipmentForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingShipment || {}}
      />
      <Dialog open={timelineDialogOpen} onClose={() => setTimelineDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Shipment Timeline - {selectedShipment?.trackingNumber}</DialogTitle>
        <DialogContent>
          {selectedShipment && <ShipmentTimeline statusHistory={selectedShipment.statusHistory} />}
        </DialogContent>
      </Dialog>
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)}>
        <DialogTitle>Bulk Upload Shipments</DialogTitle>
        <DialogContent>
          <p>Upload a CSV file with columns: origin, destination, carrier, weight, status (optional)</p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ marginTop: 16 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFileSubmit} variant="contained">Upload</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Shipments;
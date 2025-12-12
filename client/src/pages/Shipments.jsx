import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, Card, CardContent, IconButton, Typography, Divider } from '@mui/material';
import { Add, Edit, Delete, Timeline, CloudUpload, Search, FilterList, Print, GetApp, Visibility, Assignment } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import ShipmentForm from './ShipmentForm';
import ShipmentTimeline from '../components/Timeline';

const getStatusColor = (status) => {
  switch (status) {
    case 'draft': return 'default';
    case 'pending-label': return 'warning';
    case 'packed': return 'info';
    case 'dispatched': return 'primary';
    case 'in-transit': return 'info';
    case 'delivered': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const columns = [
  { field: 'orderId', headerName: 'Order ID', minWidth: 100 },
  { field: 'trackingNumber', headerName: 'Tracking Number', minWidth: 150 },
  {
    field: 'status',
    headerName: 'Order Status',
    minWidth: 110,
    renderCell: (params) => (
      <Chip
        label={params.value.replace('-', ' ').toUpperCase()}
        color={getStatusColor(params.value)}
        size="small"
      />
    ),
  },
  { field: 'pickupDate', headerName: 'Pickup Date', minWidth: 100, renderCell: (params) => params?.value ? new Date(params.value).toLocaleDateString() : '-' },
  { field: 'dispatchDate', headerName: 'Dispatch Date', minWidth: 100, renderCell: (params) => params?.value ? new Date(params.value).toLocaleDateString() : '-' },
  { field: 'deliveryDate', headerName: 'Delivery Date', minWidth: 100, renderCell: (params) => params?.value ? new Date(params.value).toLocaleDateString() : '-' },
  { field: 'weight', headerName: 'Weight (kg)', minWidth: 80, type: 'number' },
  { field: 'cost', headerName: 'Cost ($)', minWidth: 80, type: 'number' },
  {
    field: 'actions',
    headerName: 'Actions',
    minWidth: 160,
    renderCell: (params) => (
      <div className="flex space-x-1">
        <IconButton size="small" onClick={() => params.api.handleViewDetails(params.row)} title="View Details">
          <Visibility />
        </IconButton>
        <IconButton size="small" onClick={() => params.api.handlePrintLabel(params.row)} title="Print Label">
          <Print />
        </IconButton>
        <IconButton size="small" onClick={() => params.api.handleViewTimeline(params.row)} title="Timeline">
          <Timeline />
        </IconButton>
        <IconButton size="small" onClick={() => params.api.handleEdit(params.row)} title="Edit">
          <Edit />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => params.api.handleDelete(params.row.id)} title="Delete">
          <Delete />
        </IconButton>
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
    paymentStatus: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
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

  const handleViewDetails = (shipment) => {
    setSelectedShipment(shipment);
    setDetailsDialogOpen(true);
  };

  const handlePrintLabel = async (shipment) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/shipments/${shipment._id}/label`, {
        headers,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `label-${shipment.trackingNumber}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download label:', error);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`http://localhost:5000/api/shipments/export?${params}`, {
        headers,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'shipments.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export shipments:', error);
    }
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
        <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outlined" startIcon={<GetApp />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="outlined" startIcon={<CloudUpload />} onClick={handleBulkUpload}>
            Bulk Upload
          </Button>
          <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleAdd}>
            Create New Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
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
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending-label">Pending Label</MenuItem>
                <MenuItem value="packed">Packed</MenuItem>
                <MenuItem value="dispatched">Dispatched</MenuItem>
                <MenuItem value="in-transit">In Transit</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                label="Payment Status"
                value={filters.paymentStatus}
                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                label="Carrier"
                value={filters.carrier}
                onChange={(e) => setFilters({ ...filters, carrier: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                label="Origin"
                value={filters.origin}
                onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilters({
                  search: '',
                  status: '',
                  carrier: '',
                  paymentStatus: '',
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

      <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        <div style={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={shipments}
            getRowId={(row) => row._id}
            columns={columns.map(col => col.field === 'actions' ? { ...col, renderCell: (params) => (
              <div className="flex space-x-1">
                <IconButton size="small" onClick={() => handleViewDetails(params.row)} title="View Details">
                  <Visibility />
                </IconButton>
                <IconButton size="small" onClick={() => handlePrintLabel(params.row)} title="Print Label">
                  <Print />
                </IconButton>
                <IconButton size="small" onClick={() => handleViewTimeline(params.row)} title="Timeline">
                  <Timeline />
                </IconButton>
                <IconButton size="small" onClick={() => handleEdit(params.row)} title="Edit">
                  <Edit />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)} title="Delete">
                  <Delete />
                </IconButton>
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
            autoWidth
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
        <DialogTitle>Bulk Upload Orders</DialogTitle>
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

      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details - {selectedShipment?.orderId}</DialogTitle>
        <DialogContent>
          {selectedShipment && (
            <div className="space-y-6">
              <div>
                <Typography variant="h6" gutterBottom>Customer Information</Typography>
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-h-16">
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography>{selectedShipment.customerInfo?.name || 'N/A'}</Typography>
                  </div>
                  <div className="min-h-16">
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography>{selectedShipment.customerInfo?.email || 'N/A'}</Typography>
                  </div>
                  <div className="min-h-16">
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography>{selectedShipment.customerInfo?.phone || 'N/A'}</Typography>
                  </div>
                  <div className="min-h-16">
                    <Typography variant="body2" color="text.secondary">Address</Typography>
                    <Typography>{selectedShipment.customerInfo?.address || 'N/A'}</Typography>
                  </div>
                </div>
              </div>

              <Divider />

              <div>
                <Typography variant="h6" gutterBottom>Product Information</Typography>
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-h-16">
                    <Typography variant="body2" color="text.secondary">Description</Typography>
                    <Typography>{selectedShipment.productInfo?.description || 'N/A'}</Typography>
                  </div>
                  <div className="min-h-16">
                    <Typography variant="body2" color="text.secondary">Quantity</Typography>
                    <Typography>{selectedShipment.productInfo?.quantity || 'N/A'}</Typography>
                  </div>
                  <div className="min-h-16">
                    <Typography variant="body2" color="text.secondary">Value</Typography>
                    <Typography>${selectedShipment.productInfo?.value || 'N/A'}</Typography>
                  </div>
                  <div className="min-h-16"></div>
                </div>
              </div>

              <Divider />

              <div>
                <Typography variant="h6" gutterBottom>Shipment Timeline</Typography>
                <ShipmentTimeline statusHistory={selectedShipment.statusHistory} />
              </div>

              <Divider />

              <div>
                <Typography variant="h6" gutterBottom>Order Notes</Typography>
                <Typography>{selectedShipment.orderNotes || 'No notes available'}</Typography>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Shipments;
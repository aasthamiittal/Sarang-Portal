import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Button, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem, 
  Box,
  IconButton, 
  Typography,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Timeline,
  CloudUpload,
  Search,
  Print,
  GetApp,
  Visibility,
  Tune,
  Receipt
} from '@mui/icons-material';
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

const statusTabs = [
  { label: 'All Orders', value: '' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Ready', value: 'pending-label' },
  { label: 'Packed', value: 'packed' },
  { label: 'Manifested', value: 'in-transit' },
  { label: 'Dispatched', value: 'dispatched' },
  { label: 'Received', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const Shipments = () => {
  const { token, user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
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
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [editingShipment, setEditingShipment] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);

  const headers = { Authorization: `Bearer ${token}` };

  const columns = [
    { 
      field: 'orderId', 
      headerName: 'Order ID', 
      flex: 1,
      minWidth: 140,
      sortable: true,
      renderCell: (params) => (
        <Box>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#1976d2', 
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.8125rem',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => handleViewDetails(params.row)}
          >
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
            DE-{params.row.trackingNumber?.slice(-5) || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6875rem' }}>
            Ref {params.row.referenceNumber || 'N/A'}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'customerDetails', 
      headerName: 'Customer Details', 
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8125rem' }}>
            {params.row.customerInfo?.firstName} {params.row.customerInfo?.lastName}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            display="block"
            sx={{ 
              fontSize: '0.6875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.row.customerInfo?.email}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
            {params.row.customerInfo?.mobile}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Order Date', 
      flex: 0.9,
      minWidth: 110,
      sortable: true,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
              {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'packageDetails', 
      headerName: 'Package', 
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.row.weight} kg</Typography>
          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8125rem' }}>
            ₹{params.row.cost?.toFixed(2) || '0.00'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
            {params.row.carrier || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 90,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('-', ' ')}
          color={getStatusColor(params.value)}
          size="small"
          sx={{ 
            textTransform: 'capitalize', 
            fontWeight: 500,
            fontSize: '0.6875rem',
            height: '22px'
          }}
        />
      ),
    },
    {
      field: 'lastMile',
      headerName: 'Delivery',
      flex: 0.7,
      minWidth: 90,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
          {params.row.deliveryDate
            ? 'Delivered'
            : params.row.dispatchDate
            ? 'Dispatched'
            : '-'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => {
        const shipment = params.row;
        const isLocked = shipment.labelGeneratedAt || shipment.manifestSubmittedAt;
        const canEdit = !isLocked && ['admin', 'manager', 'staff'].includes(user?.role);

        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => handleViewDetails(params.row)} size="small" title="View Details">
              <Visibility />
            </IconButton>
            <IconButton
              onClick={() => handleEdit(params.row)}
              size="small"
              title={isLocked ? (shipment.labelGeneratedAt ? 'Cannot edit: Label generated' : 'Cannot edit: Manifest submitted') : 'Edit'}
              disabled={!canEdit}
              sx={{ opacity: canEdit ? 1 : 0.5 }}
            >
              <Edit />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    fetchShipments();
  }, [token, page, pageSize]);

  useEffect(() => {
    const filterValues = { ...filters, search: searchQuery };
    if (Object.values(filterValues).some(v => v)) {
      fetchShipments(1, filterValues);
      setPage(1);
    }
  }, [filters, searchQuery]);

  const fetchShipments = async (currentPage = page, currentFilters = { ...filters, search: searchQuery }) => {
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
      const params = new URLSearchParams({ ...filters, search: searchQuery });
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
        await axios.put(`http://localhost:5000/api/shipments/${editingShipment._id}`, formData, { headers });
      } else {
        await axios.post('http://localhost:5000/api/shipments', formData, { headers });
      }
      fetchShipments();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save shipment:', error);
    }
  };

  const handleGenerateCustomsInvoice = async (shipmentId) => {
    try {
      // For demo purposes, use sample data. In real app, this would open a form
      const invoiceData = {
        shipmentId,
        hsCode: '84713010',
        declaredValue: 1000,
        originCountry: 'India',
        invoiceNumber: `INV-${Date.now()}`,
        currency: 'USD'
      };

      const response = await axios.post('http://localhost:5000/api/customs/invoices', invoiceData, { headers });
      alert('Customs invoice generated successfully');

      // Optionally download the invoice
      if (window.confirm('Would you like to download the customs invoice?')) {
        const downloadResponse = await axios.get(`http://localhost:5000/api/customs/invoices/${response.data._id}/download`, {
          headers,
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `customs-invoice-${response.data.invoiceNumber}.txt`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Failed to generate customs invoice:', error);
      alert('Failed to generate customs invoice: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setFilters({ ...filters, status: statusTabs[newValue].value });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      status: '',
      carrier: '',
      paymentStatus: '',
      origin: '',
      destination: '',
      startDate: '',
      endDate: ''
    });
    setSelectedTab(0);
  };

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            All Orders
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Orders &gt; All
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            sx={{ 
              bgcolor: '#4e5dde',
              textTransform: 'none',
              fontWeight: 500,
              px: 2.5,
              '&:hover': { bgcolor: '#3d4bc7' }
            }}
            onClick={handleAdd}
          >
            Add Order
          </Button>
          <Button 
            variant="contained"
            startIcon={<CloudUpload />}
            sx={{ 
              bgcolor: '#4e5dde',
              textTransform: 'none',
              fontWeight: 500,
              px: 2.5,
              '&:hover': { bgcolor: '#3d4bc7' }
            }}
            onClick={handleBulkUpload}
          >
            Bulk Order
          </Button>
        </Box>
      </Box>

      {/* Status Tabs */}
      <Box sx={{ bgcolor: 'white', borderRadius: 1, mb: 2, overflow: 'auto' }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9375rem',
              color: '#6b7280',
              minHeight: 48,
              '&.Mui-selected': {
                color: '#111827',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              bgcolor: '#111827'
            }
          }}
        >
          {statusTabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Search and Filters Bar */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 2,
        bgcolor: 'white',
        p: 2,
        borderRadius: 1,
        flexWrap: 'wrap'
      }}>
        <TextField
          placeholder="Search by Tracking ID, AWB, Order ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ 
            flex: '1 1 250px',
            minWidth: '200px',
            '& .MuiOutlinedInput-root': {
              bgcolor: 'white',
              '& fieldset': { borderColor: '#e5e7eb' }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#9ca3af' }} />
              </InputAdornment>
            ),
          }}
          size="small"
        />
        <Button
          variant="outlined"
          startIcon={<Tune />}
          onClick={() => setFiltersDialogOpen(true)}
          sx={{
            textTransform: 'none',
            borderColor: '#e5e7eb',
            color: '#374151',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#d1d5db',
              bgcolor: '#f9fafb'
            }
          }}
        >
          More Filters
        </Button>
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={handleExport}
          sx={{
            textTransform: 'none',
            borderColor: '#e5e7eb',
            color: '#374151',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#d1d5db',
              bgcolor: '#f9fafb'
            }
          }}
        >
          Export
        </Button>
      </Box>

      {/* Data Grid */}
      <Box sx={{ 
        bgcolor: 'white', 
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        width: '100%'
      }}>
        <DataGrid
          rows={shipments}
          getRowId={(row) => row._id}
          columns={columns}
          page={page - 1}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={(newPage) => setPage(newPage + 1)}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          paginationMode="server"
          rowCount={total}
          loading={loading}
          disableSelectionOnClick
          autoHeight
          rowHeight={90}
          sx={{
            border: 'none',
            width: '100%',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              color: '#6b7280',
              fontSize: '0.8125rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f3f4f6',
              py: 1.5
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                bgcolor: '#f9fafb'
              }
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #e5e7eb'
            },
            '& .MuiDataGrid-virtualScroller': {
              overflowX: 'hidden'
            }
          }}
        />
      </Box>

      {/* Filters Dialog */}
      <Dialog 
        open={filtersDialogOpen} 
        onClose={() => setFiltersDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              size="small"
              fullWidth
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
            <TextField
              select
              label="Payment Status"
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              size="small"
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
            <TextField
              label="Carrier"
              value={filters.carrier}
              onChange={(e) => setFilters({ ...filters, carrier: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="Origin"
              value={filters.origin}
              onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              size="small"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearAllFilters}>Clear All</Button>
          <Button onClick={() => setFiltersDialogOpen(false)} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>

      {/* Shipment Form Dialog */}
      <ShipmentForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingShipment || {}}
      />

      {/* Timeline Dialog */}
      <Dialog open={timelineDialogOpen} onClose={() => setTimelineDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Shipment Timeline - {selectedShipment?.trackingNumber}</DialogTitle>
        <DialogContent>
          {selectedShipment && <ShipmentTimeline statusHistory={selectedShipment.statusHistory} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimelineDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)}>
        <DialogTitle>Bulk Upload Orders</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV file with columns: origin, destination, carrier, weight, status (optional)
          </Typography>
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

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details - {selectedShipment?.orderId}</DialogTitle>
        <DialogContent>
          {selectedShipment && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              {/* AWB Number */}
              {selectedShipment.awbNumber && (
                <Box sx={{ bgcolor: '#f0f9ff', p: 2, borderRadius: 1, border: '1px solid #0ea5e9' }}>
                  <Typography variant="subtitle2" color="#0ea5e9" fontWeight={600}>
                    AWB Number: {selectedShipment.awbNumber}
                  </Typography>
                </Box>
              )}

              {/* Pickup Address */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Pickup Address
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Name</Typography>
                    <Typography variant="body2">{selectedShipment.pickupAddress?.name || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                    <Typography variant="body2">{selectedShipment.pickupAddress?.address || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography variant="body2">{selectedShipment.pickupAddress?.phone || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Customer Information */}
              <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Customer Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">First Name</Typography>
                    <Typography variant="body2">{selectedShipment.customerInfo?.firstName || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Last Name</Typography>
                    <Typography variant="body2">{selectedShipment.customerInfo?.lastName || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Mobile</Typography>
                    <Typography variant="body2">{selectedShipment.customerInfo?.mobile || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{selectedShipment.customerInfo?.email || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                    <Typography variant="body2">
                      {selectedShipment.customerInfo?.address1}, {selectedShipment.customerInfo?.city}, {selectedShipment.customerInfo?.state}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Pincode</Typography>
                    <Typography variant="body2">{selectedShipment.customerInfo?.pincode || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Product Information */}
              <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Product Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body2">{selectedShipment.productInfo?.description || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Quantity</Typography>
                    <Typography variant="body2">{selectedShipment.productInfo?.quantity || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Value</Typography>
                    <Typography variant="body2">₹{selectedShipment.productInfo?.value || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Customs Invoice */}
              <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Customs Invoice
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Receipt />}
                    variant="outlined"
                    onClick={() => handleGenerateCustomsInvoice(selectedShipment._id)}
                  >
                    Generate Invoice
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Generate customs documentation for international shipments
                </Typography>
              </Box>

              {/* Timeline */}
              <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Shipment Timeline
                </Typography>
                <ShipmentTimeline statusHistory={selectedShipment.statusHistory} />
              </Box>

              {/* Order Notes */}
              {selectedShipment.orderNotes && (
                <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Order Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedShipment.orderNotes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Shipments;
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
  Typography,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import {
  Search,
  GetApp,
  FilterList
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const AuditLog = () => {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const columns = [
    {
      field: 'timestamp',
      headerName: 'Date & Time',
      flex: 1.2,
      minWidth: 160,
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
      field: 'user',
      headerName: 'User',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {params.row.userName || 'System'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
            {params.row.userEmail || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ')}
          color={getActionColor(params.value)}
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
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'ipAddress',
      headerName: 'IP Address',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
          {params.value || 'N/A'}
        </Typography>
      )
    }
  ];

  const getActionColor = (action) => {
    switch (action) {
      case 'login': return 'success';
      case 'logout': return 'default';
      case 'failed_login': return 'error';
      case 'data_export': return 'info';
      case 'create_shipment': return 'primary';
      case 'update_shipment': return 'warning';
      case 'delete_shipment': return 'error';
      default: return 'default';
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, page, pageSize]);

  useEffect(() => {
    fetchLogs(1);
    setPage(1);
  }, [filters, searchQuery]);

  const fetchLogs = async (currentPage = page, currentFilters = { ...filters, search: searchQuery }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v))
      });
      const response = await axios.get(`${BASE_API_URL}/admin/audit-logs?${params}`, { headers });
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ ...filters, search: searchQuery });
      const response = await axios.get(`${BASE_API_URL}/admin/audit-logs/export?${params}`, {
        headers,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      action: '',
      userId: '',
      startDate: '',
      endDate: ''
    });
  };

  // Only allow admin access
  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Access Denied: Admin privileges required
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: 3, maxWidth: '150vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Audit Logs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            System activity and user actions
          </Typography>
        </Box>
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
          placeholder="Search by user, action, or description..."
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
          startIcon={<FilterList />}
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
          Filters
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
          rows={logs}
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
          rowHeight={70}
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
              label="Action"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              size="small"
              fullWidth
            >
              <MenuItem value="">All Actions</MenuItem>
              <MenuItem value="login">Login</MenuItem>
              <MenuItem value="logout">Logout</MenuItem>
              <MenuItem value="failed_login">Failed Login</MenuItem>
              <MenuItem value="data_export">Data Export</MenuItem>
              <MenuItem value="create_shipment">Create Shipment</MenuItem>
              <MenuItem value="update_shipment">Update Shipment</MenuItem>
              <MenuItem value="delete_shipment">Delete Shipment</MenuItem>
            </TextField>
            <TextField
              label="User ID"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              size="small"
              fullWidth
              placeholder="Enter user ID"
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
    </Box>
  );
};

export default AuditLog;
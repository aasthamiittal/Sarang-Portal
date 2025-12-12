import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Tabs, Tab, Box } from '@mui/material';
import { Edit, Delete, Block, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return 'error';
    case 'manager': return 'warning';
    case 'staff': return 'success';
    default: return 'default';
  }
};

const columns = [
  { field: 'name', headerName: 'Name', width: 150 },
  { field: 'email', headerName: 'Email', width: 200 },
  {
    field: 'role',
    headerName: 'Role',
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value.charAt(0).toUpperCase() + params.value.slice(1)}
        color={getRoleColor(params.value)}
        size="small"
      />
    ),
  },
  {
    field: 'isActive',
    headerName: 'Status',
    width: 100,
    renderCell: (params) => (
      <Chip
        label={params.value ? 'Active' : 'Inactive'}
        color={params.value ? 'success' : 'error'}
        size="small"
      />
    ),
  },
  { field: 'lastLogin', headerName: 'Last Login', width: 180, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : 'Never' },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 200,
    renderCell: (params) => (
      <div className="flex space-x-1">
        <Button size="small" startIcon={<Edit />} onClick={() => params.api.handleEditRole(params.row)}>Edit Role</Button>
        <Button
          size="small"
          startIcon={params.row.isActive ? <Block /> : <CheckCircle />}
          color={params.row.isActive ? 'error' : 'success'}
          onClick={() => params.api.handleToggleStatus(params.row)}
        >
          {params.row.isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button size="small" color="error" startIcon={<Delete />} onClick={() => params.api.handleDelete(params.row.id)}>Delete</Button>
      </div>
    ),
  },
];

const Admin = () => {
  const { token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchUsers();
    fetchActivityLogs();
  }, [token]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/users', { headers });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
    setLoading(false);
  };

  const fetchActivityLogs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/activity-logs', { headers });
      setActivityLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    }
  };

  const handleEditRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (user) => {
    if (window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} this user?`)) {
      try {
        await axios.put(`http://localhost:5000/api/admin/users/${user._id}/status`, { isActive: !user.isActive }, { headers });
        fetchUsers();
      } catch (error) {
        console.error('Failed to update user status:', error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { headers });
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleRoleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${selectedUser._id}/role`, { role: newRole }, { headers });
      fetchUsers();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const logColumns = [
    { field: 'user', headerName: 'User', width: 150, valueGetter: (params) => params.row.user?.name || 'Unknown' },
    { field: 'action', headerName: 'Action', width: 150 },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'timestamp', headerName: 'Timestamp', width: 180, valueFormatter: (params) => new Date(params.value).toLocaleString() },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Panel</h1>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="User Management" />
          <Tab label="Activity Logs" />
        </Tabs>
      </Box>
      {tabValue === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div style={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={users}
              getRowId={(row) => row._id}
              columns={columns.map(col => col.field === 'actions' ? { ...col, renderCell: (params) => (
                <div className="flex space-x-1">
                  <Button size="small" startIcon={<Edit />} onClick={() => handleEditRole(params.row)}>Edit Role</Button>
                  <Button
                    size="small"
                    startIcon={params.row.isActive ? <Block /> : <CheckCircle />}
                    color={params.row.isActive ? 'error' : 'success'}
                    onClick={() => handleToggleStatus(params.row)}
                  >
                    {params.row.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(params.row._id)}>Delete</Button>
                </div>
              )} : col)}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 25]}
              loading={loading}
              disableSelectionOnClick
            />
          </div>
        </div>
      )}
      {tabValue === 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div style={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={activityLogs}
              getRowId={(row) => row._id}
              columns={logColumns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 25]}
              disableSelectionOnClick
            />
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            margin="normal"
          >
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRoleUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Admin;
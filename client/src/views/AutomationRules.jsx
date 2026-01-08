import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, Switch, FormControlLabel } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const RULE_TYPES = [
  { value: 'CARRIER_SELECTION', label: 'Carrier Selection' },
  { value: 'AUTO_PICKUP', label: 'Auto Pickup' },
  { value: 'AUTO_MANIFEST', label: 'Auto Manifest' },
  { value: 'NDR_ACTION', label: 'NDR Action' },
  { value: 'WALLET_ALERT', label: 'Wallet Alert' }
];

const columns = [
  { field: 'name', headerName: 'Name', width: 150 },
  { field: 'ruleType', headerName: 'Type', width: 150 },
  { field: 'priority', headerName: 'Priority', width: 100 },
  {
    field: 'isActive',
    headerName: 'Active',
    width: 100,
    renderCell: (params) => (
      <Chip
        label={params.value ? 'Active' : 'Inactive'}
        color={params.value ? 'success' : 'error'}
        size="small"
      />
    ),
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 200,
    renderCell: (params) => (
      <div className="flex gap-1">
        <Button size="small" startIcon={<Edit />} onClick={() => params.api.handleEdit(params.row)}>Edit</Button>
        <Button size="small" color="error" startIcon={<Delete />} onClick={() => params.api.handleDelete(params.row.id)}>Delete</Button>
      </div>
    ),
  },
];

const AutomationRules = () => {
  const { token } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ruleType: '',
    conditions: {},
    actions: {},
    isActive: true,
    priority: 0
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchRules();
  }, [token]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/automation/rules', { headers });
      setRules(response.data);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    }
    setLoading(false);
  };

  const handleEdit = (rule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      ruleType: rule.ruleType,
      conditions: rule.conditions || {},
      actions: rule.actions || {},
      isActive: rule.isActive,
      priority: rule.priority
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await axios.delete(`http://localhost:5000/api/automation/rules/${id}`, { headers });
        fetchRules();
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (selectedRule) {
        await axios.put(`http://localhost:5000/api/automation/rules/${selectedRule._id}`, formData, { headers });
      } else {
        await axios.post('http://localhost:5000/api/automation/rules', formData, { headers });
      }
      setDialogOpen(false);
      setSelectedRule(null);
      setFormData({
        name: '',
        ruleType: '',
        conditions: {},
        actions: {},
        isActive: true,
        priority: 0
      });
      fetchRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleConditionChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: { ...prev.conditions, [key]: value }
    }));
  };

  const handleActionChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      actions: { ...prev.actions, [key]: value }
    }));
  };

  const renderConditionFields = () => {
    switch (formData.ruleType) {
      case 'CARRIER_SELECTION':
        return (
          <>
            <TextField label="Min Weight" type="number" value={formData.conditions.weight?.min || ''} onChange={(e) => handleConditionChange('weight', { ...formData.conditions.weight, min: parseFloat(e.target.value) })} />
            <TextField label="Max Weight" type="number" value={formData.conditions.weight?.max || ''} onChange={(e) => handleConditionChange('weight', { ...formData.conditions.weight, max: parseFloat(e.target.value) })} />
            <TextField label="Zone" value={formData.conditions.zone || ''} onChange={(e) => handleConditionChange('zone', e.target.value)} />
          </>
        );
      case 'WALLET_ALERT':
        return (
          <TextField label="Wallet Threshold" type="number" value={formData.conditions.walletThreshold || ''} onChange={(e) => handleConditionChange('walletThreshold', parseFloat(e.target.value))} />
        );
      default:
        return <div>Conditions vary by rule type</div>;
    }
  };

  const renderActionFields = () => {
    switch (formData.ruleType) {
      case 'CARRIER_SELECTION':
        return (
          <TextField label="Select Carrier ID" value={formData.actions.selectCarrier || ''} onChange={(e) => handleActionChange('selectCarrier', e.target.value)} />
        );
      case 'NDR_ACTION':
        return (
          <TextField select label="NDR Action" value={formData.actions.setNdrAction || ''} onChange={(e) => handleActionChange('setNdrAction', e.target.value)}>
            <MenuItem value="REATTEMPT">Reattempt</MenuItem>
            <MenuItem value="RTO">RTO</MenuItem>
            <MenuItem value="HOLD">Hold</MenuItem>
          </TextField>
        );
      case 'WALLET_ALERT':
        return (
          <TextField label="Alert Type" value={formData.actions.sendAlert || ''} onChange={(e) => handleActionChange('sendAlert', e.target.value)} />
        );
      default:
        return <div>Actions vary by rule type</div>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Automation Rules</h1>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Add Rule
        </Button>
      </div>
      <div style={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={rules}
          getRowId={(row) => row._id}
          columns={columns.map(col => col.field === 'actions' ? { ...col, renderCell: (params) => (
            <div className="flex gap-1">
              <Button size="small" startIcon={<Edit />} onClick={() => handleEdit(params.row)}>Edit</Button>
              <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(params.row._id)}>Delete</Button>
            </div>
          )} : col)}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25]}
          loading={loading}
          disableSelectionOnClick
        />
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedRule ? 'Edit Rule' : 'Add Rule'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="Rule Type"
            value={formData.ruleType}
            onChange={(e) => setFormData(prev => ({ ...prev, ruleType: e.target.value }))}
            margin="normal"
          >
            {RULE_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
            ))}
          </TextField>
          <div className="my-4">
            <h3 className="text-lg font-semibold">Conditions</h3>
            {renderConditionFields()}
          </div>
          <div className="my-4">
            <h3 className="text-lg font-semibold">Actions</h3>
            {renderActionFields()}
          </div>
          <TextField
            fullWidth
            label="Priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
            margin="normal"
          />
          <FormControlLabel
            control={<Switch checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />}
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AutomationRules;
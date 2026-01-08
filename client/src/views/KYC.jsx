import React, { useState, useEffect } from 'react';
import { TextField, Button, Card, CardContent, Typography, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Box, Alert, LinearProgress } from '@mui/material';
import { CloudUpload, CheckCircle, Cancel, Pending } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const KYC = () => {
  const { user, token } = useAuth();
  const [kycData, setKycData] = useState({
    gstNumber: '',
    panNumber: '',
    iecNumber: ''
  });
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState('pending');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (user) {
      setKycData({
        gstNumber: user.gstNumber || '',
        panNumber: user.panNumber || '',
        iecNumber: user.iecNumber || ''
      });
      setKycStatus(user.kycStatus || 'pending');
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/kyc/documents', { headers });
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch KYC documents:', error);
    }
  };

  const handleKycDataChange = (e) => {
    setKycData({ ...kycData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (event, documentType) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    setUploading(true);
    try {
      await axios.post('http://localhost:5000/api/kyc/upload', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchDocuments();
      alert('Document uploaded successfully');
    } catch (error) {
      alert('Failed to upload document: ' + (error.response?.data?.message || error.message));
    }
    setUploading(false);
  };

  const handleSubmitKyc = async () => {
    setLoading(true);
    try {
      await axios.put('http://localhost:5000/api/kyc/update', kycData, { headers });
      alert('KYC information updated successfully');
    } catch (error) {
      alert('Failed to update KYC information: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle color="success" />;
      case 'rejected': return <Cancel color="error" />;
      default: return <Pending color="warning" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>KYC Verification</Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Complete your KYC verification to unlock all features. Our team will review your documents within 24-48 hours.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>KYC Information</Typography>
              <Box component="form" sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="GST Number"
                      name="gstNumber"
                      value={kycData.gstNumber}
                      onChange={handleKycDataChange}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="PAN Number"
                      name="panNumber"
                      value={kycData.panNumber}
                      onChange={handleKycDataChange}
                      placeholder="AAAAA0000A"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="IEC Number"
                      name="iecNumber"
                      value={kycData.iecNumber}
                      onChange={handleKycDataChange}
                      placeholder="0300000000"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleSubmitKyc}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? 'Updating...' : 'Update KYC Information'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Document Upload</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload the required documents for verification.
              </Typography>

              <Box sx={{ mt: 2 }}>
                {[
                  { type: 'gst', label: 'GST Certificate' },
                  { type: 'pan', label: 'PAN Card' },
                  { type: 'iec', label: 'IEC Certificate' },
                  { type: 'address_proof', label: 'Address Proof' },
                  { type: 'identity_proof', label: 'Identity Proof' }
                ].map(({ type, label }) => (
                  <Box key={type} sx={{ mb: 2 }}>
                    <input
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      id={`file-${type}`}
                      type="file"
                      onChange={(e) => handleFileUpload(e, type)}
                    />
                    <label htmlFor={`file-${type}`}>
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                        fullWidth
                        disabled={uploading}
                      >
                        Upload {label}
                      </Button>
                    </label>
                  </Box>
                ))}
              </Box>

              {uploading && <LinearProgress sx={{ mt: 2 }} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Verification Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  icon={getStatusIcon(kycStatus)}
                  label={`KYC Status: ${kycStatus.toUpperCase()}`}
                  color={getStatusColor(kycStatus)}
                  variant="outlined"
                />
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Uploaded Documents</Typography>
              {documents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No documents uploaded yet.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {documents.map((doc) => (
                    <Grid item xs={12} sm={6} md={4} key={doc._id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {getStatusIcon(doc.status)}
                            <Typography variant="subtitle2" sx={{ ml: 1 }}>
                              {doc.documentType.replace('_', ' ').toUpperCase()}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {doc.originalName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                          </Typography>
                          <Chip
                            size="small"
                            label={doc.status}
                            color={getStatusColor(doc.status)}
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default KYC;
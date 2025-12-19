import React, { useState, useEffect } from 'react';
import { TextField, Button, Card, CardContent, Typography, Avatar, Grid, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, Tab, Tabs, Box } from '@mui/material';
import { Lock, Security, People, VerifiedUser } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const Profile = () => {
  const { user, updateProfile, updateSettings, token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settingsData, setSettingsData] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      sms: false,
      inApp: true
    }
  });
  const [kycDialogOpen, setKycDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      setSettingsData(user.settings || settingsData);
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSettingsChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (type === 'checkbox') {
      setSettingsData({
        ...settingsData,
        notifications: { ...settingsData.notifications, [name]: checked }
      });
    } else {
      setSettingsData({ ...settingsData, [name]: value });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(profileData);
    setLoading(false);
    alert(result.message);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.put('http://localhost:5000/api/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { headers });
      alert('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert('Failed to change password: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const handleKycSubmit = async () => {
    // Mock KYC verification
    alert('KYC verification submitted. Our team will review your documents.');
    setKycDialogOpen(false);
  };

  const handleAddUser = async () => {
    if (user.role !== 'admin') return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/admin/users', newUserData, { headers });
      alert('User added successfully');
      setNewUserData({ name: '', email: '', password: '', role: 'user' });
      setAdminDialogOpen(false);
    } catch (error) {
      alert('Failed to add user: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateSettings(settingsData);
    setLoading(false);
    alert(result.message);
  };

  if (!user) return <div>Loading...</div>;

  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
      <div role="tabpanel" hidden={value !== index} {...other}>
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<People />} label="Profile" />
            <Tab icon={<Lock />} label="Security" />
            <Tab icon={<Security />} label="Preferences" />
            {user.role === 'admin' && <Tab icon={<VerifiedUser />} label="Admin" />}
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>Profile Information</Typography>
                <Avatar sx={{ width: 80, height: 80, mb: 2 }}>{user.name?.charAt(0)}</Avatar>
                <form onSubmit={handleProfileSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        multiline
                        rows={3}
                        value={profileData.address}
                        onChange={handleProfileChange}
                      />
                    </Grid>
                  </Grid>
                  <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>KYC Verification</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Verify your identity to unlock additional features.
                </Typography>
                <Button variant="outlined" onClick={() => setKycDialogOpen(true)} startIcon={<VerifiedUser />}>
                  Start KYC Verification
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom>Change Password</Typography>
            <form onSubmit={handlePasswordSubmit}>
              <Grid container spacing={2} sx={{ maxWidth: 400 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary" disabled={loading}>
                    {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" gutterBottom>App Preferences</Typography>
            <form onSubmit={handleSettingsSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Theme"
                    name="theme"
                    value={settingsData.theme}
                    onChange={handleSettingsChange}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Language"
                    name="language"
                    value={settingsData.language}
                    onChange={handleSettingsChange}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Timezone"
                    name="timezone"
                    value={settingsData.timezone}
                    onChange={handleSettingsChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Notifications</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settingsData.notifications.email}
                        onChange={handleSettingsChange}
                        name="email"
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settingsData.notifications.sms}
                        onChange={handleSettingsChange}
                        name="sms"
                      />
                    }
                    label="SMS Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settingsData.notifications.inApp}
                        onChange={handleSettingsChange}
                        name="inApp"
                      />
                    }
                    label="In-App Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Settings'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </TabPanel>

          {user.role === 'admin' && (
            <TabPanel value={activeTab} index={3}>
              <Typography variant="h6" gutterBottom>Admin Panel</Typography>
              <Button variant="contained" onClick={() => setAdminDialogOpen(true)} startIcon={<People />}>
                Add New User
              </Button>
            </TabPanel>
          )}
        </CardContent>
      </Card>

      {/* KYC Dialog */}
      <Dialog open={kycDialogOpen} onClose={() => setKycDialogOpen(false)}>
        <DialogTitle>KYC Verification</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Please upload the following documents for verification:
          </Typography>
          <ul>
            <li>Government-issued ID</li>
            <li>Proof of address</li>
            <li>Business registration (if applicable)</li>
          </ul>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Our team will review your documents within 24-48 hours.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKycDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleKycSubmit} variant="contained">Submit for Review</Button>
        </DialogActions>
      </Dialog>

      {/* Admin Add User Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={newUserData.name}
            onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUserData.email}
            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={newUserData.password}
            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            select
            fullWidth
            label="Role"
            value={newUserData.role}
            onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
            margin="normal"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained" disabled={loading}>
            {loading ? 'Adding...' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Profile;
import React, { useState, useEffect } from 'react';
import { TextField, Button, Card, CardContent, Typography, Avatar, Grid, Switch, FormControlLabel } from '@mui/material';
import { useAuth } from '../AuthContext';

const Profile = () => {
  const { user, updateProfile, updateSettings } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
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
  const [loading, setLoading] = useState(false);

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

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateSettings(settingsData);
    setLoading(false);
    alert(result.message);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>Profile & Settings</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Profile Information</Typography>
              <Avatar sx={{ width: 80, height: 80, mb: 2 }}>{user.name?.charAt(0)}</Avatar>
              <form onSubmit={handleProfileSubmit}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={3}
                  value={profileData.address}
                  onChange={handleProfileChange}
                  margin="normal"
                />
                <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Account Settings</Typography>
              <form onSubmit={handleSettingsSubmit}>
                <TextField
                  select
                  fullWidth
                  label="Theme"
                  name="theme"
                  value={settingsData.theme}
                  onChange={handleSettingsChange}
                  margin="normal"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Language"
                  name="language"
                  value={settingsData.language}
                  onChange={handleSettingsChange}
                  margin="normal"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </TextField>

                <TextField
                  fullWidth
                  label="Timezone"
                  name="timezone"
                  value={settingsData.timezone}
                  onChange={handleSettingsChange}
                  margin="normal"
                />

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Notifications</Typography>
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

                <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
                  {loading ? 'Updating...' : 'Update Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Profile;
import React, { useState, useEffect } from 'react';
import { Button, TextField, Card, CardContent, CardActions, Typography, Grid, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ShoppingCart, Store, Webhook, Sync } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const Integrations = () => {
  const { token } = useAuth();
  const [integrations, setIntegrations] = useState({});
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/integration/status', { headers });
      setIntegrations(response.data);
    } catch (error) {
      console.error('Failed to fetch integration status:', error);
    }
  };

  const handleConnectShopify = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/integration/shopify/connect', { apiKey }, { headers });
      alert('Shopify connected successfully');
      fetchIntegrationStatus();
      setApiKeyDialogOpen(false);
    } catch (error) {
      console.error('Failed to connect Shopify:', error);
      alert('Failed to connect Shopify');
    }
  };

  const handleSetupWebhook = async () => {
    try {
      await axios.post('http://localhost:5000/api/integration/webhooks', { url: webhookUrl }, { headers });
      alert('Webhook setup successfully');
      fetchIntegrationStatus();
      setWebhookDialogOpen(false);
    } catch (error) {
      console.error('Failed to setup webhook:', error);
      alert('Failed to setup webhook');
    }
  };

  const handleSync = async (platform) => {
    try {
      await axios.post(`http://localhost:5000/api/integration/${platform}/sync`, {}, { headers });
      alert('Sync completed successfully');
    } catch (error) {
      console.error('Failed to sync:', error);
      alert('Failed to sync');
    }
  };

  const integrationCards = [
    {
      title: 'Shopify',
      icon: <ShoppingCart fontSize="large" />,
      connected: integrations.shopify?.connected,
      description: 'Sync orders and products from Shopify store',
      onConnect: () => setApiKeyDialogOpen(true),
      onSync: () => handleSync('shopify')
    },
    {
      title: 'WooCommerce',
      icon: <Store fontSize="large" />,
      connected: integrations.woocommerce?.connected,
      description: 'Integrate with WooCommerce for seamless order management',
      onConnect: () => alert('WooCommerce integration coming soon'),
      onSync: () => handleSync('woocommerce')
    },
    {
      title: 'Amazon',
      icon: <ShoppingCart fontSize="large" />,
      connected: integrations.amazon?.connected,
      description: 'Connect Amazon seller account for order synchronization',
      onConnect: () => alert('Amazon integration coming soon'),
      onSync: () => handleSync('amazon')
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Integrations</h1>

      <Grid container spacing={4} className="mb-8">
        {integrationCards.map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
            <Card className="h-full">
              <CardContent className="text-center">
                <div className="mb-4 text-blue-500">{card.icon}</div>
                <Typography variant="h5" component="div" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mb-4">
                  {card.description}
                </Typography>
                <Typography variant="body2" color={card.connected ? 'success.main' : 'error.main'}>
                  {card.connected ? 'Connected' : 'Not Connected'}
                </Typography>
              </CardContent>
              <CardActions className="justify-center">
                {!card.connected ? (
                  <Button size="small" variant="contained" onClick={card.onConnect}>
                    Connect
                  </Button>
                ) : (
                  <Button size="small" variant="outlined" onClick={card.onSync}>
                    <Sync className="mr-1" />
                    Sync
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card className="mb-6">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Webhook className="mr-2" />
            Webhook Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mb-4">
            Configure webhooks to receive real-time updates from integrated platforms
          </Typography>
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="body2">
                Webhook URL: {integrations.webhook?.url || 'Not configured'}
              </Typography>
            </div>
            <Button variant="outlined" onClick={() => setWebhookDialogOpen(true)}>
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mb-4">
            Manage API keys and access settings
          </Typography>
          <FormControlLabel
            control={<Switch checked={integrations.api?.enabled || false} />}
            label="Enable API Access"
          />
          <div className="mt-4">
            <Typography variant="body2" className="mb-2">
              API Key: {integrations.api?.key ? '••••••••' + integrations.api.key.slice(-4) : 'Not generated'}
            </Typography>
            <Button variant="outlined" size="small">
              Regenerate Key
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)}>
        <DialogTitle>Connect Shopify</DialogTitle>
        <DialogContent>
          <TextField
            label="Shopify API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            fullWidth
            margin="normal"
            type="password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConnectShopify} variant="contained">Connect</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={webhookDialogOpen} onClose={() => setWebhookDialogOpen(false)}>
        <DialogTitle>Setup Webhook</DialogTitle>
        <DialogContent>
          <TextField
            label="Webhook URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="https://your-app.com/webhook"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWebhookDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSetupWebhook} variant="contained">Setup</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Integrations;
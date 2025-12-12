import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip } from '@mui/material';
import { AccountBalanceWallet, Add, CreditCard } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const Billing = () => {
  const { token } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletActivity, setWalletActivity] = useState([]);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [filter, setFilter] = useState('all');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchWalletData();
  }, [token]);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, activityRes] = await Promise.all([
        axios.get('http://localhost:5000/api/wallet/balance', { headers }),
        axios.get('http://localhost:5000/api/wallet/history', { headers })
      ]);
      setWalletBalance(balanceRes.data.balance);
      setWalletActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/wallet/recharge', { amount: rechargeAmount }, { headers });
      setRechargeDialogOpen(false);
      setRechargeAmount('');
      fetchWalletData();
      alert('Recharge successful!');
    } catch (error) {
      console.error('Failed to recharge:', error);
      alert('Recharge failed. Please try again.');
    }
  };

  const filteredActivity = walletActivity.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Wallet</h1>

      {/* Wallet Balance Card */}
      <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <AccountBalanceWallet fontSize="large" />
            <div>
              <Typography variant="h6">Wallet Balance</Typography>
              <Typography variant="h4" className="font-bold">${walletBalance.toFixed(2)}</Typography>
            </div>
          </div>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setRechargeDialogOpen(true)}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            Recharge
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6">Transaction History</Typography>
            <div className="flex space-x-2">
              {['all', 'credit', 'debit'].map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setFilter(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredActivity.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={activity.type}
                        color={activity.type === 'credit' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell className={activity.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      {activity.type === 'credit' ? '+' : '-'}${activity.amount}
                    </TableCell>
                    <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Recharge Dialog */}
      <Dialog open={rechargeDialogOpen} onClose={() => setRechargeDialogOpen(false)}>
        <DialogTitle>Recharge Wallet</DialogTitle>
        <DialogContent>
          <TextField
            label="Amount ($)"
            type="number"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ min: 0, step: 0.01 }}
          />
          <Typography variant="body2" color="text.secondary" className="mt-2">
            Enter the amount you want to add to your wallet. This will simulate a payment gateway integration.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRechargeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRecharge} variant="contained" startIcon={<CreditCard />}>
            Recharge
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Billing;
import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Tabs, Tab, Box } from '@mui/material';
import { AccountBalanceWallet, Add, CreditCard, Assessment, GetApp } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const Billing = () => {
  const { token } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletActivity, setWalletActivity] = useState([]);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [filter, setFilter] = useState('all');
  const [reportTab, setReportTab] = useState(0);
  const [reportsData, setReportsData] = useState({
    ledger: [],
    invoiceSummary: {},
    dailyBooking: [],
    shipmentStatus: [],
    courierWise: []
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchWalletData();
    fetchReportsData();
  }, [token]);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, activityRes] = await Promise.all([
        axios.get(`${BASE_API_URL}/billing/balance`, { headers }),
        axios.get(`${BASE_API_URL}/billing/activity`, { headers })
      ]);
      setWalletBalance(balanceRes.data.balance);
      setWalletActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const fetchReportsData = async () => {
    try {
      const [ledgerRes, invoiceRes, dailyRes, statusRes, courierRes] = await Promise.all([
        axios.get('http://localhost:5000/api/ledger/report', { headers }),
        axios.get('http://localhost:5000/api/ledger/invoice-summary', { headers }),
        axios.get('http://localhost:5000/api/reports/daily-booking', { headers }),
        axios.get('http://localhost:5000/api/reports/shipment-status', { headers }),
        axios.get('http://localhost:5000/api/reports/courier-wise', { headers })
      ]);

      setReportsData({
        ledger: ledgerRes.data,
        invoiceSummary: invoiceRes.data,
        dailyBooking: dailyRes.data,
        shipmentStatus: statusRes.data,
        courierWise: courierRes.data
      });
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await axios.post(`${BASE_API_URL}/billing/recharge`, { amount: rechargeAmount }, { headers });
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
            <div className="flex flex-wrap gap-2">
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

      {/* Reports Section */}
      <Card className="mt-6">
        <CardContent>
          <div className="flex items-center mb-4">
            <Assessment className="mr-2" />
            <Typography variant="h6">Reports</Typography>
          </div>

          <Tabs value={reportTab} onChange={(e, newValue) => setReportTab(newValue)} className="mb-4">
            <Tab label="Ledger" />
            <Tab label="Invoice Summary" />
            <Tab label="Daily Booking" />
            <Tab label="Shipment Status" />
            <Tab label="Courier-wise" />
          </Tabs>

          {reportTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportsData.ledger.slice(0, 10).map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip label={entry.type} color={entry.type === 'credit' ? 'success' : 'error'} size="small" />
                      </TableCell>
                      <TableCell>${entry.amount}</TableCell>
                      <TableCell>{entry.description || 'N/A'}</TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {reportTab === 1 && (
            <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <Typography variant="h6">{reportsData.invoiceSummary.totalInvoices || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Invoices</Typography>
              </Card>
              <Card className="p-4">
                <Typography variant="h6">{reportsData.invoiceSummary.paidInvoices || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Paid</Typography>
              </Card>
              <Card className="p-4">
                <Typography variant="h6">{reportsData.invoiceSummary.pendingInvoices || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
              </Card>
              <Card className="p-4">
                <Typography variant="h6">${reportsData.invoiceSummary.totalAmount || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Amount</Typography>
              </Card>
            </Box>
          )}

          {reportTab === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Bookings</TableCell>
                    <TableCell>Total Weight</TableCell>
                    <TableCell>Total Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportsData.dailyBooking.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell>{day.date}</TableCell>
                      <TableCell>{day.bookings}</TableCell>
                      <TableCell>{day.totalWeight}kg</TableCell>
                      <TableCell>${day.totalCost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {reportTab === 3 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Total Cost</TableCell>
                    <TableCell>Avg Weight</TableCell>
                    <TableCell>Avg Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportsData.shipmentStatus.map((status, index) => (
                    <TableRow key={index}>
                      <TableCell>{status.status}</TableCell>
                      <TableCell>{status.count}</TableCell>
                      <TableCell>${status.totalCost}</TableCell>
                      <TableCell>{status.avgWeight}kg</TableCell>
                      <TableCell>${status.avgCost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {reportTab === 4 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Courier</TableCell>
                    <TableCell>Total Shipments</TableCell>
                    <TableCell>Delivered</TableCell>
                    <TableCell>Delivery Rate</TableCell>
                    <TableCell>Total Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportsData.courierWise.map((courier, index) => (
                    <TableRow key={index}>
                      <TableCell>{courier.courier}</TableCell>
                      <TableCell>{courier.totalShipments}</TableCell>
                      <TableCell>{courier.delivered}</TableCell>
                      <TableCell>{courier.deliveryRate}%</TableCell>
                      <TableCell>${courier.totalCost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
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
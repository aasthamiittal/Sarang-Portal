import React, { useState, useEffect } from 'react';
import { TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Card, CardContent, Box, Typography, Chip, Alert } from '@mui/material';
import { LocalShipping, CompareArrows, TrendingDown, EmojiEvents } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const RateComparison = () => {
  const { token } = useAuth();
  const [form, setForm] = useState({ weight: '', zone: '' });
  const [carriers, setCarriers] = useState([]);
  const [rates, setRates] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const carriersRes = await axios.get(`${BASE_API_URL}/carriers`, { headers });
        setCarriers(carriersRes.data);
        const ratesRes = await axios.get(`${BASE_API_URL}/rates`, { headers });
        setRates(ratesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load carriers and rates. Please try again.');
      }
    };
    fetchData();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCompare = () => {
    const { weight, zone } = form;
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('Please enter a valid weight');
      return;
    }
    if (!zone) {
      alert('Please select a zone');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      const now = new Date();
      const comp = carriers.map(carrier => {
        const rate = rates.find(r => 
          r.carrier && 
          r.carrier._id === carrier._id && 
          r.zone === zone && 
          r.isActive && 
          (!r.effectiveFrom || new Date(r.effectiveFrom) <= now) && 
          (!r.effectiveTo || new Date(r.effectiveTo) >= now)
        );
        let cost = 0;
        if (rate) {
          const baseCost = Math.max(rate.perKgPrice * weightNum, rate.minimumCharge);
          const fuelSurcharge = baseCost * (rate.fuelSurchargePercent / 100);
          const additionalFees = rate.additionalFees;
          cost = baseCost + fuelSurcharge + additionalFees;
        }
        return { carrier: carrier.name, cost };
      }).filter(c => c.cost > 0).sort((a, b) => a.cost - b.cost);
      
      setComparison(comp);
      setLoading(false);
    }, 300);
  };

  const getSavingsPercentage = (cost, lowestCost) => {
    if (lowestCost === 0) return 0;
    return (((cost - lowestCost) / lowestCost) * 100).toFixed(1);
  };

  const lowestCost = comparison.length > 0 ? comparison[0].cost : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Rate Comparison</h1>
      
      {/* Input Card */}
      <Card 
        elevation={0} 
        sx={{ 
          mb: 4, 
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          backgroundColor: 'white'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField 
              label="Weight" 
              name="weight" 
              value={form.weight} 
              onChange={handleChange} 
              type="number"
              placeholder="Enter weight in kg"
              margin="normal"
              sx={{ 
                flex: '1 1 200px',
                minWidth: 200
              }}
            />
            <TextField 
              select 
              label="Zone" 
              name="zone" 
              value={form.zone} 
              onChange={handleChange}
              margin="normal"
              sx={{ 
                flex: '1 1 200px',
                minWidth: 200
              }}
            >
              <MenuItem value="domestic">Domestic</MenuItem>
              <MenuItem value="international">International</MenuItem>
            </TextField>
            <Button 
              variant="contained" 
              onClick={handleCompare}
              disabled={loading}
              sx={{ 
                mb: 1
              }}
              style={{minWidth:'150px', margin:'20px 0px'}}
            >
              {loading ? 'Comparing...' : 'Compare'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Results Section */}
      {comparison.length > 0 && (
        <Box>
          <Alert 
            severity="success" 
            icon={<TrendingDown />}
            sx={{ mb: 3 }}
          >
            Found {comparison.length} carrier{comparison.length !== 1 ? 's' : ''} with available rates. 
            Best rate: <strong>${lowestCost.toFixed(2)}</strong>
          </Alert>

          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                    RANK
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                    CARRIER
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>
                    COST
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>
                    DIFFERENCE
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparison.map((c, i) => {
                  const savings = getSavingsPercentage(c.cost, lowestCost);
                  const isLowest = i === 0;
                  
                  return (
                    <TableRow 
                      key={i}
                      sx={{ 
                        '&:hover': { backgroundColor: '#f9fafb' },
                        transition: 'background-color 0.2s',
                        backgroundColor: isLowest ? '#f0fdf4' : 'transparent'
                      }}
                    >
                      <TableCell>
                        {isLowest ? (
                          <Chip 
                            icon={<EmojiEvents sx={{ fontSize: 18 }} />}
                            label="Best" 
                            size="small"
                            sx={{ 
                              backgroundColor: '#10b981', 
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        ) : (
                          <Chip 
                            label={`#${i + 1}`} 
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 500, borderColor: '#d1d5db', color: '#6b7280' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <LocalShipping sx={{ color: '#9ca3af' }} />
                          <Typography sx={{ fontWeight: 500, color: '#111827' }}>
                            {c.carrier}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: '1.125rem',
                            color: isLowest ? '#10b981' : '#111827'
                          }}
                        >
                          ${c.cost.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {isLowest ? (
                          <Chip 
                            label="Lowest" 
                            size="small"
                            sx={{ 
                              backgroundColor: '#d1fae5', 
                              color: '#065f46',
                              fontWeight: 500
                            }}
                          />
                        ) : (
                          <Chip 
                            label={`+${savings}%`}
                            size="small"
                            sx={{ 
                              backgroundColor: '#fef3c7', 
                              color: '#92400e',
                              fontWeight: 500
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </Box>
      )}

      {comparison.length === 0 && form.weight && form.zone && !loading && (
        <Alert severity="info">
          No rates found for the selected criteria. Please try different parameters.
        </Alert>
      )}
    </div>
  );
};

export default RateComparison;
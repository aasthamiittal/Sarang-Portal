import React, { useState, useEffect } from 'react';
import { TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, MenuItem } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const RateComparison = () => {
  const { token } = useAuth();
  const [form, setForm] = useState({ weight: '', zone: '' });
  const [carriers, setCarriers] = useState([]);
  const [rates, setRates] = useState([]);
  const [comparison, setComparison] = useState([]);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      const carriersRes = await axios.get('http://localhost:5000/api/carriers', { headers });
      setCarriers(carriersRes.data);
      const ratesRes = await axios.get('http://localhost:5000/api/rates', { headers });
      setRates(ratesRes.data);
    };
    fetchData();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCompare = () => {
    const { weight, zone } = form;
    const comp = carriers.map(carrier => {
      const rate = rates.find(r => r.carrier._id === carrier._id && r.zone === zone && r.isActive);
      let cost = 0;
      if (rate) {
        const baseCost = Math.max(rate.perKgPrice * weight, rate.minimumCharge);
        const fuelSurcharge = baseCost * (rate.fuelSurchargePercent / 100);
        const additionalFees = rate.additionalFees;
        cost = baseCost + fuelSurcharge + additionalFees;
      }
      return { carrier: carrier.name, cost };
    }).filter(c => c.cost > 0).sort((a, b) => a.cost - b.cost);
    setComparison(comp);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Rate Comparison</h1>
      <div className="mb-6">
        <TextField label="Weight" name="weight" value={form.weight} onChange={handleChange} type="number" margin="normal" />
        <TextField select label="Zone" name="zone" value={form.zone} onChange={handleChange} margin="normal">
          <MenuItem value="domestic">Domestic</MenuItem>
          <MenuItem value="international">International</MenuItem>
        </TextField>
        <Button variant="contained" onClick={handleCompare}>Compare</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Carrier</TableCell>
            <TableCell>Cost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {comparison.map((c, i) => (
            <TableRow key={i}>
              <TableCell>{c.carrier}</TableCell>
              <TableCell>{c.cost}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RateComparison;
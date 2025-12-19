import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const RateComparison = () => {
  const { token } = useAuth();
  const [form, setForm] = useState({
    destCountry: '',
    destPincode: '',
    deadWeight: '',
    packageLength: '',
    packageBreadth: '',
    packageHeight: ''
  });
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

  const handleReset = () => {
    setForm({
      destCountry: '',
      destPincode: '',
      deadWeight: '',
      packageLength: '',
      packageBreadth: '',
      packageHeight: ''
    });
    setComparison([]);
  };

  const handleCalculate = () => {
    const { deadWeight, packageLength, packageBreadth, packageHeight } = form;
    const volumetricWeight = (packageLength * packageBreadth * packageHeight) / 5000;
    const applicableWeight = Math.max(deadWeight, volumetricWeight);

    const comp = carriers.map(carrier => {
      const rate = rates.find(r => r.carrier._id === carrier._id && r.isActive);
      let cost = 0;
      if (rate) {
        const baseCost = Math.max(rate.perKgPrice * applicableWeight, rate.minimumCharge);
        const fuelSurcharge = baseCost * (rate.fuelSurchargePercent / 100);
        const additionalFees = rate.additionalFees;
        cost = baseCost + fuelSurcharge + additionalFees;
      }
      return { carrier: carrier.name, cost };
    }).filter(c => c.cost > 0).sort((a, b) => a.cost - b.cost);
    setComparison(comp);
  };

  return (
    <main className="py-4">
      <div className="lg:flex lg:flex-row lg:w-full">
        <div className="rounded-lg bg-card text-card-foreground m-4 p-3 px-0 pb-4 mx-0 mt-0 overflow-auto lg:w-2/3">
          <div className="p-6 pt-0">
            <form className="space-y-5" novalidate="">
              <div className="flex flex-col justify-between gap-4 gap-x-2 md:flex-row md:gap-x-10">
                <div className="mt-0 md:w-1/2">
                  <div className="space-y-1">
                    <label className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="destCountry">
                      Destination Country <span className="ml-1 text-red">*</span>
                    </label>
                    <button
                      className="items-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-gray-300 bg-background px-4 py-2 flex justify-between overflow-hidden w-full h-10 font-normal text-black rounded text-nowrap hover:text-black hover:border-gray-400 max-w-144 focus-within:ring-1 ring-primary focus-within:ring-offset-0"
                      role="combobox"
                      aria-expanded="false"
                      id="button-country-destCountry"
                      aria-describedby="destCountry-form-item-description"
                      aria-invalid="false"
                      type="button"
                      aria-haspopup="dialog"
                      aria-controls="radix-:rf:"
                      data-state="closed"
                    >
                      {form.destCountry || 'Select Country'}
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down ml-2 w-4 h-4 opacity-50 shrink-0">
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-0 md:w-1/2">
                  <div className="space-y-1">
                    <label className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="destPincode">
                      Destination Pincode
                    </label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground placeholder:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      placeholder="Enter Destination Pincode . . ."
                      name="destPincode"
                      id="destPincode"
                      aria-describedby="destPincode-form-item-description"
                      aria-invalid="false"
                      value={form.destPincode}
                      onChange={handleChange}
                    />
                    <p className="mr-auto text-xs font-light text-left text-gray-450">
                      Add destination postcode for accurate pricing and shippers.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4">
                <div className="mt-0 md:mr-10">
                  <div className="space-y-1">
                    <label className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="deadWeight">
                      Dead Weight <span className="ml-1 text-red">*</span>
                    </label>
                    <div className="flex flex-row rounded focus-within:ring-1 ring-primary focus-within:ring-offset-2" id="deadWeight">
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground placeholder:text-sm focus-visible:outline-none focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Eg. 1.25"
                        name="deadWeight"
                        step="0.01"
                        value={form.deadWeight}
                        onChange={handleChange}
                      />
                      <div className="flex h-10 bg-gray-200 border border-l-0 border-input rounded-r-md w-14">
                        <span className="flex items-center px-3 text-sm border-l border-input">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 md:mr-5">
                  <div className="space-y-1">
                    <label className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="packageLength">
                      Length
                    </label>
                    <div className="flex flex-row rounded focus-within:ring-1 ring-primary focus-within:ring-offset-2" id="packageLength">
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground placeholder:text-sm focus-visible:outline-none focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Eg. 10"
                        min="1.0"
                        name="packageLength"
                        value={form.packageLength}
                        onChange={handleChange}
                      />
                      <div className="flex h-10 bg-gray-200 border border-l-0 border-input rounded-r-md w-14">
                        <span className="flex items-center px-3 text-sm border-l border-input">cm</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 md:mr-5">
                  <div className="space-y-1">
                    <label className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="packageBreadth">
                      Breadth
                    </label>
                    <div className="flex flex-row rounded focus-within:ring-1 ring-primary focus-within:ring-offset-2" id="packageBreadth">
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground placeholder:text-sm focus-visible:outline-none focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Eg. 10"
                        min="1.0"
                        name="packageBreadth"
                        value={form.packageBreadth}
                        onChange={handleChange}
                      />
                      <div className="flex h-10 bg-gray-200 border border-l-0 border-input rounded-r-md w-14">
                        <span className="flex items-center px-3 text-sm border-l border-input">cm</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 md:mt-0">
                  <div className="space-y-1">
                    <label className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="packageHeight">
                      Height
                    </label>
                    <div className="flex flex-row rounded focus-within:ring-1 ring-primary focus-within:ring-offset-2" id="packageHeight">
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground placeholder:text-sm focus-visible:outline-none focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Eg. 10"
                        min="1.0"
                        name="packageHeight"
                        value={form.packageHeight}
                        onChange={handleChange}
                      />
                      <div className="flex h-10 bg-gray-200 border border-l-0 border-input rounded-r-md w-14">
                        <span className="flex items-center px-3 text-sm border-l border-input">cm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-6 lg:justify-end">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:border-primary hover:text-accent-foreground h-10 px-4 py-2 border-primary text-primary"
                  type="button"
                  onClick={handleReset}
                >
                  Reset
                </button>
                <div className="flex items-center justify-center">
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    type="button"
                    onClick={handleCalculate}
                  >
                    Calculate
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="rounded-lg bg-card text-card-foreground m-4 p-3 hidden px-5 pt-0 pb-12 mt-0 mb-4 shadow-none lg:w-1/3 lg:block">
          <div className="flex flex-col items-center justify-center gap-y-3">
            <p className="mt-8 text-base font-semibold">Quick Tips</p>
            <svg className="w-40 h-40" viewBox="0 0 105 98" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* SVG content */}
            </svg>
            <div className="space-y-2 text-xs font-normal">
              <p className="text-sm font-semibold text-left">Dead Weight:</p>
              <p>Dead weight (or dry weight) refers to the actual weight of the package in kilograms.</p>
            </div>
            <div className="mt-1 text-xs">
              <p className="text-sm font-semibold">
                Volumetric Weight:<span className="mx-2 font-base">(L x W x H / 5000)</span>
              </p>
              <p className="mt-1 font-normal">Volumetric Weight (or DIM weight) is calculated based on the dimensions of the package.</p>
              <p className="mt-2">The formula for calculating volumetric weight involves multiplying the length, width, and height of the package and then dividing by 5000.</p>
            </div>
            <div className="mt-1 text-xs">
              <p className="text-sm font-semibold">Additionally:</p>
              <p className="mt-2">The higher value between volumetric weight and dead weight will be used for freight rate calculation.</p>
              <p className="mt-2">Prices are subject to change based on fuel surcharges and courier company base rates.</p>
              <p className="mt-2 font-normal">The above prices exclude GST.</p>
            </div>
          </div>
        </div>
      </div>
      {comparison.length > 0 && (
        <div className="m-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Carrier</th>
                <th className="border border-gray-300 px-4 py-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 px-4 py-2">{c.carrier}</td>
                  <td className="border border-gray-300 px-4 py-2">₹{c.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default RateComparison;
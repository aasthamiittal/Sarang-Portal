import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { BASE_API_URL } from '../constants';

const NdrList = () => {
  const { token } = useAuth();
  const [ndrCases, setNdrCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    fetchNdrCases();
  }, [token]);

  const fetchNdrCases = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/ndr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNdrCases(response.data.ndrCases);
    } catch (error) {
      console.error('Failed to fetch NDR cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (caseId, action) => {
    try {
      await axios.post(`${BASE_API_URL}/ndr/${caseId}/action`, {
        action,
        notes: actionNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCase(null);
      setActionNotes('');
      fetchNdrCases(); // Refresh list
    } catch (error) {
      console.error('Failed to perform action:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading NDR cases...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">NDR Cases</h2>

      {ndrCases.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No NDR cases found
        </div>
      ) : (
        <div className="space-y-4">
          {ndrCases.map((ndrCase) => (
            <div key={ndrCase._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">Order: {ndrCase.shipmentId?.orderId}</h3>
                  <p className="text-sm text-gray-600">Reason: {ndrCase.reason}</p>
                  <p className="text-sm text-gray-600">Attempts: {ndrCase.attempts}</p>
                  <p className="text-sm text-gray-600">Current Action: {ndrCase.currentAction}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCase(ndrCase._id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Take Action
                  </button>
                </div>
              </div>

              {selectedCase === ndrCase._id && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="w-full p-2 border rounded mb-3"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => performAction(ndrCase._id, 'REATTEMPT')}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Reattempt Delivery
                    </button>
                    <button
                      onClick={() => performAction(ndrCase._id, 'RTO')}
                      className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                      Return to Origin
                    </button>
                    <button
                      onClick={() => performAction(ndrCase._id, 'HOLD')}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Hold
                    </button>
                    <button
                      onClick={() => setSelectedCase(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <h4 className="text-sm font-medium mb-2">History:</h4>
                <div className="space-y-1">
                  {ndrCase.history?.map((entry, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      {new Date(entry.timestamp).toLocaleString()}: {entry.action} - {entry.notes}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NdrList;
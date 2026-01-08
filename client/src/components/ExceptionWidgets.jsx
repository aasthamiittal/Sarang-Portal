import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';

const ExceptionWidgets = ({ ndrCases = 0, exceptionCases = 0, onNdrClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className={`bg-red-50 p-4 rounded-lg border border-red-200 ${onNdrClick ? 'cursor-pointer hover:bg-red-100' : ''}`} onClick={onNdrClick}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-red-800">NDR Cases</h3>
            <p className="text-2xl font-bold text-red-900">{ndrCases}</p>
            <p className="text-xs text-red-600">Require attention</p>
          </div>
          <Package className="w-8 h-8 text-red-500" />
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Exception Cases</h3>
            <p className="text-2xl font-bold text-yellow-900">{exceptionCases}</p>
            <p className="text-xs text-yellow-600">Customs/SLA issues</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
        </div>
      </div>
    </div>
  );
};

export default ExceptionWidgets;
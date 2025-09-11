'use client';

import { useState } from 'react';

interface DebugCheckoutDataProps {
  deliveryInfo: any;
  shopId: string;
}

export default function DebugCheckoutData({ deliveryInfo, shopId }: DebugCheckoutDataProps) {
  const [showDebug, setShowDebug] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        {showDebug ? 'Hide' : 'Show'} Debug Data
      </button>
      
      {showDebug && (
        <div className="mt-2">
          <h4 className="font-semibold text-sm mb-2">Debug Information:</h4>
          <div className="text-xs space-y-2">
            <div>
              <strong>Shop ID:</strong> {shopId}
            </div>
            <div>
              <strong>Contact Phone:</strong> {deliveryInfo.contactPhone || 'MISSING'}
            </div>
            <div>
              <strong>Contact Email:</strong> {deliveryInfo.contactEmail || 'MISSING'}
            </div>
            <div>
              <strong>Delivery Option:</strong> {deliveryInfo.deliveryOption}
            </div>
            {deliveryInfo.deliveryOption === 'delivery' && (
              <div>
                <strong>Address:</strong> {JSON.stringify(deliveryInfo.address, null, 2)}
              </div>
            )}
            {deliveryInfo.deliveryOption === 'pickup' && (
              <div>
                <strong>Pickup Location ID:</strong> {deliveryInfo.pickupLocationId || 'MISSING'}
              </div>
            )}
            <div>
              <strong>Full Delivery Info:</strong>
              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                {JSON.stringify(deliveryInfo, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


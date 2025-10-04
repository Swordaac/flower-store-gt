'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import PrintConfiguration from './PrintConfiguration';

interface Order {
  _id: string;
  orderNumber: string;
  recipient: {
    name: string;
    email: string;
    phone: string;
  };
  delivery: {
    method: 'delivery' | 'pickup';
    date: string;
    time: string;
  };
  status: string;
  createdAt: string;
  printPreferences?: {
    deliveryInstructionsTray: string;
    cardMessageTray: string;
    orderSummaryTray: string;
    printAllDocuments: boolean;
    printDeliveryInstructions: boolean;
    printCardMessage: boolean;
    printOrderSummary: boolean;
  };
}

interface OrderPrintManagerProps {
  order: Order;
  onPrintStatusChange?: (orderId: string, status: 'printing' | 'completed' | 'failed') => void;
}

export default function OrderPrintManager({ order, onPrintStatusChange }: OrderPrintManagerProps) {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'completed' | 'failed'>('idle');
  const [printResults, setPrintResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePrintComplete = (results: any) => {
    setPrintResults(results);
    setPrintStatus(results.success ? 'completed' : 'failed');
    setPrintDialogOpen(false);
    
    if (onPrintStatusChange) {
      onPrintStatusChange(order._id, results.success ? 'completed' : 'failed');
    }
  };

  const handleTestPrint = (config: any) => {
    console.log('Test print configuration:', config);
    // You can add additional test print logic here
  };

  const getStatusBadge = () => {
    switch (printStatus) {
      case 'printing':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Printing</Badge>;
      case 'completed':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Printed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  const getPrintPreferencesSummary = () => {
    if (!order.printPreferences) return 'Default settings';
    
    const prefs = order.printPreferences;
    const activeDocuments = [];
    
    if (prefs.printDeliveryInstructions) activeDocuments.push('Delivery Instructions');
    if (prefs.printCardMessage) activeDocuments.push('Card Message');
    if (prefs.printOrderSummary) activeDocuments.push('Order Summary');
    
    return `${activeDocuments.join(', ')} (${activeDocuments.length} documents)`;
  };

  return (
    <div className="space-y-4">
      {/* Order Print Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Print Management</CardTitle>
              <CardDescription>
                Order #{order.orderNumber} - {order.recipient.name}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Recipient:</span> {order.recipient.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {order.recipient.email}
              </div>
              <div>
                <span className="font-medium">Method:</span> {order.delivery.method.charAt(0).toUpperCase() + order.delivery.method.slice(1)}
              </div>
              <div>
                <span className="font-medium">Date:</span> {new Date(order.delivery.date).toLocaleDateString()}
              </div>
            </div>

            {/* Print Preferences Summary */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Print Configuration:</span> {getPrintPreferencesSummary()}
              </div>
              {order.printPreferences && (
                <div className="text-xs text-gray-600 mt-1">
                  Trays: Delivery ({order.printPreferences.deliveryInstructionsTray}), 
                  Card ({order.printPreferences.cardMessageTray}), 
                  Summary ({order.printPreferences.orderSummaryTray})
                </div>
              )}
            </div>

            {/* Print Results */}
            {printResults && (
              <Alert variant={printResults.success ? 'default' : 'destructive'}>
                {printResults.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {printResults.success ? (
                    <div>
                      <div className="font-medium">Print completed successfully!</div>
                      <div className="text-sm mt-1">
                        {printResults.results && (
                          <>
                            {printResults.results.deliveryInstructions?.success && 'Delivery Instructions ✓ '}
                            {printResults.results.cardMessage?.success && 'Card Message ✓ '}
                            {printResults.results.orderSummary?.success && 'Order Summary ✓'}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Print failed</div>
                      <div className="text-sm mt-1">{printResults.message}</div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <Printer className="h-4 w-4 mr-2" />
                    Configure & Print
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Print Configuration</DialogTitle>
                    <DialogDescription>
                      Configure print settings and tray selection for Order #{order.orderNumber}
                    </DialogDescription>
                  </DialogHeader>
                  <PrintConfiguration
                    orderId={order._id}
                    onPrintComplete={handlePrintComplete}
                    onTestPrint={handleTestPrint}
                  />
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={() => setPrintDialogOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

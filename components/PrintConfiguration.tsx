'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Printer, Settings, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface Printer {
  id: string;
  name: string;
  state: string;
  hasMultipleTrays: boolean;
  trayCount: number;
  trays: Array<{
    name: string;
    id: string;
    description: string;
  }>;
}

interface PrintLayout {
  name: string;
  description: string;
  paperSize: string;
  orientation: string;
  defaultTray: string;
}

interface PrintConfigurationProps {
  orderId?: string;
  onPrintComplete?: (results: any) => void;
  onTestPrint?: (config: any) => void;
}

export default function PrintConfiguration({ 
  orderId, 
  onPrintComplete, 
  onTestPrint 
}: PrintConfigurationProps) {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [layouts, setLayouts] = useState<PrintLayout[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [printConfig, setPrintConfig] = useState({
    deliveryInstructionsTray: 'default',
    cardMessageTray: 'default',
    orderSummaryTray: 'default',
    printAllDocuments: true,
    printDeliveryInstructions: true,
    printCardMessage: true,
    printOrderSummary: true
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load printers and layouts on component mount
  useEffect(() => {
    loadPrinters();
    loadLayouts();
    loadStatus();
  }, []);

  const loadPrinters = async () => {
    try {
      const response = await fetch('/api/print-config/printers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPrinters(data.data);
        if (data.data.length > 0) {
          setSelectedPrinter(data.data[0].id);
        }
      } else {
        setError(data.message || 'Failed to load printers');
      }
    } catch (err) {
      setError('Failed to load printers');
      console.error('Error loading printers:', err);
    }
  };

  const loadLayouts = async () => {
    try {
      const response = await fetch('/api/print-config/layouts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setLayouts(Object.values(data.data));
      } else {
        setError(data.message || 'Failed to load layouts');
      }
    } catch (err) {
      setError('Failed to load layouts');
      console.error('Error loading layouts:', err);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/print-config/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Error loading status:', err);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setPrintConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTrayChange = (documentType: string, trayId: string) => {
    setPrintConfig(prev => ({
      ...prev,
      [`${documentType}Tray`]: trayId
    }));
  };

  const getSelectedPrinter = () => {
    return printers.find(p => p.id === selectedPrinter);
  };

  const handleTestPrint = async (printType: string) => {
    if (!selectedPrinter) {
      setError('Please select a printer');
      return;
    }

    setTestLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/print-config/test-print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          printType,
          printerId: selectedPrinter,
          trayId: printConfig[`${printType}Tray` as keyof typeof printConfig]
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Test print for ${printType} submitted successfully`);
        if (onTestPrint) {
          onTestPrint({ printType, config: printConfig });
        }
      } else {
        setError(data.message || `Failed to test print ${printType}`);
      }
    } catch (err) {
      setError(`Failed to test print ${printType}`);
      console.error('Error testing print:', err);
    } finally {
      setTestLoading(false);
    }
  };

  const handlePrintOrder = async () => {
    if (!orderId) {
      setError('No order ID provided');
      return;
    }

    if (!selectedPrinter) {
      setError('Please select a printer');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/print-config/print-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId,
          printConfig: {
            ...printConfig,
            printerId: selectedPrinter
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Order documents printed successfully');
        if (onPrintComplete) {
          onPrintComplete(data.data);
        }
      } else {
        setError(data.message || 'Failed to print order documents');
      }
    } catch (err) {
      setError('Failed to print order documents');
      console.error('Error printing order:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPrinterData = getSelectedPrinter();

  return (
    <div className="space-y-6">
      {/* Status Card */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Print Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {status.printers.total}
                </div>
                <div className="text-sm text-gray-600">Available Printers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {status.printers.withMultipleTrays}
                </div>
                <div className="text-sm text-gray-600">Multi-Tray Printers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {status.connection.success ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">Connection Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Printer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Printer Selection</CardTitle>
          <CardDescription>
            Choose a printer and configure tray settings for different document types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="printer-select">Select Printer</Label>
            <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a printer" />
              </SelectTrigger>
              <SelectContent>
                {printers.map((printer) => (
                  <SelectItem key={printer.id} value={printer.id}>
                    <div className="flex items-center gap-2">
                      <span>{printer.name}</span>
                      <Badge variant={printer.state === 'online' ? 'default' : 'secondary'}>
                        {printer.state}
                      </Badge>
                      {printer.hasMultipleTrays && (
                        <Badge variant="outline">
                          {printer.trayCount} trays
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPrinterData && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Available Trays</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedPrinterData.trays.map((tray) => (
                  <div key={tray.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{tray.name}</div>
                      <div className="text-sm text-gray-600">{tray.description}</div>
                    </div>
                    <Badge variant="outline">{tray.id}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Print Configuration</CardTitle>
          <CardDescription>
            Configure which documents to print and which trays to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Print All Documents Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="print-all">Print All Documents</Label>
              <p className="text-sm text-gray-600">
                Automatically print all order documents
              </p>
            </div>
            <Switch
              id="print-all"
              checked={printConfig.printAllDocuments}
              onCheckedChange={(checked) => handleConfigChange('printAllDocuments', checked)}
            />
          </div>

          <Separator />

          {/* Individual Document Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Document Settings</h4>
            
            {/* Delivery Instructions */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="print-delivery">Delivery Instructions</Label>
                  <Badge variant="outline">A4</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Print delivery address and instructions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="print-delivery"
                  checked={printConfig.printDeliveryInstructions}
                  onCheckedChange={(checked) => handleConfigChange('printDeliveryInstructions', checked)}
                />
                <Select
                  value={printConfig.deliveryInstructionsTray}
                  onValueChange={(value) => handleTrayChange('deliveryInstructions', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPrinterData?.trays.map((tray) => (
                      <SelectItem key={tray.id} value={tray.id}>
                        {tray.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestPrint('deliveryInstructions')}
                  disabled={testLoading}
                >
                  {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Card Message */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="print-card">Card Message</Label>
                  <Badge variant="outline">A6</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Print card message and occasion
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="print-card"
                  checked={printConfig.printCardMessage}
                  onCheckedChange={(checked) => handleConfigChange('printCardMessage', checked)}
                />
                <Select
                  value={printConfig.cardMessageTray}
                  onValueChange={(value) => handleTrayChange('cardMessage', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPrinterData?.trays.map((tray) => (
                      <SelectItem key={tray.id} value={tray.id}>
                        {tray.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestPrint('cardMessage')}
                  disabled={testLoading}
                >
                  {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="print-summary">Order Summary</Label>
                  <Badge variant="outline">A4</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Print order details and financial summary
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="print-summary"
                  checked={printConfig.printOrderSummary}
                  onCheckedChange={(checked) => handleConfigChange('printOrderSummary', checked)}
                />
                <Select
                  value={printConfig.orderSummaryTray}
                  onValueChange={(value) => handleTrayChange('orderSummary', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPrinterData?.trays.map((tray) => (
                      <SelectItem key={tray.id} value={tray.id}>
                        {tray.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestPrint('orderSummary')}
                  disabled={testLoading}
                >
                  {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              onClick={handlePrintOrder}
              disabled={loading || !orderId}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Print Order Documents
            </Button>
            <Button
              variant="outline"
              onClick={loadStatus}
              disabled={loading}
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

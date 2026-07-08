'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/context';

export default function SendPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<'details' | 'routes' | 'review'>('details');
  const [formData, setFormData] = useState({
    sourceAsset: 'XLM',
    sourceAmount: '',
    destAsset: 'USD',
    destAmount: '',
    recipient: '',
    recipientName: '',
  });

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const mockRoutes = [
    {
      id: 'route-1',
      path: ['XLM', 'USDC', 'USD'],
      totalFees: '0.5%',
      rate: '0.42',
      destAmount: '420.00',
      time: '3-5 minutes',
      savings: '45.12',
    },
    {
      id: 'route-2',
      path: ['XLM', 'EUR', 'USD'],
      totalFees: '1.2%',
      rate: '0.38',
      destAmount: '380.00',
      time: '5-10 minutes',
      savings: '12.50',
    },
    {
      id: 'route-3',
      path: ['XLM', 'BTC', 'USDC', 'USD'],
      totalFees: '2.1%',
      rate: '0.35',
      destAmount: '350.00',
      time: '10-15 minutes',
      savings: '5.30',
    },
  ];

  const handleNext = () => {
    if (!formData.sourceAmount || !formData.recipient) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep('routes');
  };

  const handleSelectRoute = (routeId: string) => {
    setSelectedRoute(routeId);
    setStep('review');
  };

  const handleSubmit = async () => {
    toast.success('Payment initiated successfully');
    setTimeout(() => {
      setStep('details');
      setFormData({ ...formData, sourceAmount: '', recipient: '', recipientName: '' });
      setSelectedRoute(null);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">Send Money</h1>
      <p className="text-muted-foreground mb-8">
        Find and use the best conversion paths on the Stellar Network
      </p>

      {/* Stepper */}
      <div className="flex gap-4 mb-8">
        {['details', 'routes', 'review'].map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : ['details', 'routes'].includes(step) && ['routes', 'review'].includes(s)
                  ? 'bg-primary/30 text-muted-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {idx + 1}
            </div>
            {idx < 2 && <div className="w-12 h-1 bg-border ml-2 mr-2"></div>}
          </div>
        ))}
      </div>

      {/* Step 1: Payment Details */}
      {step === 'details' && (
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* From */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">From</label>
              <div className="flex gap-2">
                <select
                  value={formData.sourceAsset}
                  onChange={(e) => setFormData({ ...formData, sourceAsset: e.target.value })}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>XLM</option>
                  <option>USDC</option>
                  <option>EUR</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={formData.sourceAmount}
                  onChange={(e) => setFormData({ ...formData, sourceAmount: e.target.value })}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">To</label>
              <div className="flex gap-2">
                <select
                  value={formData.destAsset}
                  onChange={(e) => setFormData({ ...formData, destAsset: e.target.value })}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
                <input
                  type="text"
                  placeholder="Destination amount"
                  value={formData.destAmount}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Recipient</label>
            <input
              type="text"
              placeholder="Stellar address or email"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Recipient Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Recipient Name</label>
            <input
              type="text"
              placeholder="Optional: for your records"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition"
          >
            Find Best Routes
          </button>
        </div>
      )}

      {/* Step 2: Choose Route */}
      {step === 'routes' && (
        <div className="space-y-4">
          {mockRoutes.map((route) => (
            <div
              key={route.id}
              onClick={() => handleSelectRoute(route.id)}
              className={`bg-card border-2 rounded-lg p-6 cursor-pointer transition ${
                selectedRoute === route.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">
                    Path: {route.path.join(' → ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Settlement time: {route.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{route.destAmount}</p>
                  <p className="text-xs text-accent">Fees: {route.totalFees}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Exchange Rate</p>
                  <p className="font-semibold text-foreground">{route.rate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">You Save</p>
                  <p className="font-semibold text-accent">${route.savings}</p>
                </div>
                <button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition"
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">From:</span>
              <span className="font-semibold text-foreground">
                {formData.sourceAmount} {formData.sourceAsset}
              </span>
            </div>
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">To:</span>
              <span className="font-semibold text-foreground">{formData.destAmount} {formData.destAsset}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">Recipient:</span>
              <span className="font-semibold text-foreground">{formData.recipient}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg">
              <span className="text-muted-foreground">You Save:</span>
              <span className="font-bold text-accent">$45.12</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition"
          >
            Confirm & Send
          </button>
        </div>
      )}
    </div>
  );
}

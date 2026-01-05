import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import {
  CreditCard,
  Smartphone,
  QrCode,
  Banknote,
  CheckCircle,
  X,
  Loader,
  Shield,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import QRCodeGenerator from './QrCodeGenerator';

const PaymentModal = ({ isOpen, onClose, order, onPaymentSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const createOrderMutation = useMutation(
    async ({ orderId, paymentMethod }) => {
      const response = await api.post('/api/payments/create-order', {
        orderId,
        paymentMethod
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        if (selectedMethod === 'qr_code') {
          generateQRCode(data.data);
        } else {
          initializeRazorpayPayment(data.data);
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create payment order');
        setPaymentStatus('failed');
      }
    }
  );

  const verifyPaymentMutation = useMutation(
    async (paymentData) => {
      const response = await api.post('/api/payments/verify', paymentData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setPaymentStatus('success');
        toast.success('Payment completed successfully!');
        setTimeout(() => {
          onPaymentSuccess(data.data.order);
          onClose();
        }, 2000);
      },
      onError: (error) => {
        setPaymentStatus('failed');
        toast.error(error.response?.data?.message || 'Payment verification failed');
      }
    }
  );

  const generateQRCode = (paymentData) => {
    // Generate UPI QR code data
    const qrData = {
      upi: {
        pa: 'your-upi-id@bank', // Replace with your UPI ID
        pn: 'Food Ordering App',
        tn: `Order ${order.orderNumber}`,
        am: paymentData.amount,
        cu: 'INR'
      }
    };
    setQrCodeData(qrData);
    setShowQRCode(true);
  };

  const initializeRazorpayPayment = (paymentData) => {
    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh and try again.');
      setPaymentStatus('failed');
      return;
    }

    const options = {
      key: paymentData.key,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: 'Food Ordering App',
      description: `Order ${order.orderNumber}`,
      order_id: paymentData.razorpayOrderId,
      handler: function (response) {
        handlePaymentSuccess(response);
      },
      prefill: {
        name: order.user?.name || '',
        email: order.user?.email || '',
        contact: order.user?.phone || ''
      },
      notes: {
        orderId: order._id,
        orderNumber: order.orderNumber
      },
      theme: {
        color: '#10B981'
      },
      modal: {
        ondismiss: function () {
          setPaymentStatus('pending');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error('Failed to open payment gateway');
      setPaymentStatus('failed');
    }
  };

  const handlePaymentSuccess = (response) => {
    if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
      toast.error('Invalid payment response. Please try again.');
      setPaymentStatus('failed');
      return;
    }

    setPaymentStatus('verifying');
    verifyPaymentMutation.mutate({
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
      orderId: order._id
    });
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setPaymentStatus('pending');
    setShowQRCode(false);
    setQrCodeData(null);
  };

  const handleStartPayment = () => {
    if (selectedMethod === 'upi' && !upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    if (!order || !order._id) {
      toast.error('Invalid order. Please try again.');
      return;
    }

    setPaymentStatus('processing');
    createOrderMutation.mutate({
      orderId: order._id,
      paymentMethod: selectedMethod
    });
  };

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Pay using UPI apps like Google Pay, PhonePe, Paytm',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'qr_code',
      name: 'QR Code',
      icon: QrCode,
      description: 'Scan QR code to pay using any UPI app',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay using credit or debit card',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Banknote,
      description: 'Pay using your bank account',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      toast.error('Payment gateway failed to load. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-lg"
            title="Close payment modal"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Order Summary</h3>
          <div className="space-y-2 text-xs sm:text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span>Order Number:</span>
              <span className="font-medium text-gray-900">{order.orderNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Amount:</span>
              <span className="font-bold text-base sm:text-lg text-primary-600">
                ₹{(order.finalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        {paymentStatus === 'pending' && (
          <div className="p-4 sm:p-6">
            <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Select Payment Method</h3>
            <div className="space-y-2 sm:space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedMethod === method.id
                      ? `${method.borderColor} ${method.bgColor}`
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <method.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${method.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">{method.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">{method.description}</p>
                    </div>
                    {selectedMethod === method.id && (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* UPI ID Input */}
            {selectedMethod === 'upi' && (
              <div className="mt-3 sm:mt-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all duration-200"
                  aria-label="UPI ID"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your UPI ID (e.g., yourname@okicici)
                </p>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-blue-900">Secure Payment</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Your payment is secured by Razorpay with bank-level encryption
                  </p>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleStartPayment}
              disabled={createOrderMutation.isLoading || !order}
              className="w-full mt-4 sm:mt-6 btn-primary flex items-center justify-center py-2.5 sm:py-3 text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              title="Proceed to payment"
            >
              {createOrderMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ₹{(order.finalAmount || 0).toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}

        {/* QR Code Display */}
        {showQRCode && qrCodeData && (
          <div className="p-4 sm:p-6 text-center">
            <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Scan QR Code</h3>
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
              <QRCodeGenerator
                upiId={qrCodeData.upi.pa}
                payeeName={qrCodeData.upi.pn}
                transactionNote={qrCodeData.upi.tn}
                amount={qrCodeData.upi.am}
                currency={qrCodeData.upi.cu}
                size={180}
              />
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 mt-3">
                Scan this QR code with any UPI app to pay ₹{order.finalAmount.toFixed(2)}
              </p>
              <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded">
                <p>UPI ID: {qrCodeData.upi.pa}</p>
                <p>Amount: ₹{qrCodeData.upi.am}</p>
                <p>Order: {qrCodeData.upi.tn}</p>
              </div>
            </div>
            <button
              onClick={() => setShowQRCode(false)}
              className="mt-3 sm:mt-4 w-full btn-outline text-sm transition-all duration-200"
              title="Back to payment methods"
            >
              Back to Payment Methods
            </button>
          </div>
        )}

        {/* Payment Status - Processing */}
        {paymentStatus === 'processing' && (
          <div className="p-4 sm:p-6 text-center min-h-64 flex flex-col items-center justify-center">
            <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mx-auto mb-3 sm:mb-4 animate-spin" />
            <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Processing Payment</h3>
            <p className="text-xs sm:text-sm text-gray-600">Please wait while we process your payment...</p>
          </div>
        )}

        {/* Payment Status - Verifying */}
        {paymentStatus === 'verifying' && (
          <div className="p-4 sm:p-6 text-center min-h-64 flex flex-col items-center justify-center">
            <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mx-auto mb-3 sm:mb-4 animate-spin" />
            <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Verifying Payment</h3>
            <p className="text-xs sm:text-sm text-gray-600">Please wait while we verify your payment...</p>
          </div>
        )}

        {/* Payment Status - Success */}
        {paymentStatus === 'success' && (
          <div className="p-4 sm:p-6 text-center min-h-64 flex flex-col items-center justify-center">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Payment Successful!</h3>
            <p className="text-xs sm:text-sm text-gray-600">Your order has been confirmed.</p>
          </div>
        )}

        {/* Payment Status - Failed */}
        {paymentStatus === 'failed' && (
          <div className="p-4 sm:p-6 text-center min-h-64 flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Payment Failed</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Something went wrong with your payment. Please try again.
            </p>
            <button
              onClick={() => {
                setPaymentStatus('pending');
                setUpiId('');
                setShowQRCode(false);
              }}
              className="btn-primary text-sm transition-all duration-200"
              title="Try payment again"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
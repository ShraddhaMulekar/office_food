import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ 
  upiId, 
  payeeName = 'Food Ordering App',
  transactionNote = 'Payment',
  amount, 
  currency = 'INR',
  size = 200,
  className = ''
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateQRCode = async () => {
      // Validate required parameters
      if (!upiId) {
        setError('UPI ID is required');
        setIsLoading(false);
        return;
      }

      if (!amount || amount <= 0) {
        setError('Valid amount is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Create UPI payment URL as per UPI specification
        const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&tn=${encodeURIComponent(transactionNote)}&am=${parseFloat(amount).toFixed(2)}&cu=${currency}`;
        
        // Validate UPI string length
        if (upiString.length > 2000) {
          setError('UPI string is too long');
          setIsLoading(false);
          return;
        }

        // Generate QR code with error handling
        const dataUrl = await QRCode.toDataURL(upiString, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });

        setQrCodeDataUrl(dataUrl);
        setError(null);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code. Please try again.');
        setQrCodeDataUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [upiId, payeeName, transactionNote, amount, currency, size]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center py-8 text-red-600 text-center ${className}`}>
        <div className="space-y-2">
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs text-gray-500">Please check your UPI ID and try again</p>
        </div>
      </div>
    );
  }

  if (!qrCodeDataUrl) {
    return (
      <div className={`flex items-center justify-center py-8 text-gray-500 ${className}`}>
        <span className="text-sm">Unable to generate QR code</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
        <img 
          src={qrCodeDataUrl} 
          alt="UPI Payment QR Code" 
          className="w-auto h-auto"
          style={{ maxWidth: size, maxHeight: size }}
        />
      </div>
      <div className="mt-4 text-xs text-gray-600 text-center space-y-1 bg-gray-50 p-3 rounded-lg w-full">
        <p className="font-medium text-gray-900">QR Code Details:</p>
        <p>
          <span className="font-medium">UPI ID:</span> {upiId}
        </p>
        <p>
          <span className="font-medium">Amount:</span> ₹{parseFloat(amount).toFixed(2)} {currency}
        </p>
        {transactionNote && (
          <p>
            <span className="font-medium">Note:</span> {transactionNote}
          </p>
        )}
      </div>
    </div>
  );
};

export default QRCodeGenerator;
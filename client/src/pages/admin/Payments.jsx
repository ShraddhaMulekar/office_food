import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Download,
  Eye,
  Check,
  X,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Payments = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: paymentsData, isLoading, error } = useQuery(
    ['adminPayments', searchTerm, paymentStatusFilter, paymentMethodFilter, dateFrom, dateTo, currentPage, itemsPerPage],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (paymentStatusFilter !== 'all') params.append('paymentStatus', paymentStatusFilter);
      if (paymentMethodFilter !== 'all') params.append('paymentMethod', paymentMethodFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      
      const response = await api.get(`/api/admin/payments?${params.toString()}`);
      return response.data.data;
    }
  );

  const verifyPaymentMutation = useMutation(
    async ({ orderId, transactionId, verified }) => {
      const response = await api.post('/api/payments/verify', {
        orderId,
        transactionId,
        verified
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Payment verification updated successfully!');
        queryClient.invalidateQueries('adminPayments');
        setShowPaymentModal(false);
        setSelectedPayment(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to verify payment');
      },
    }
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-50';
      case 'pending':
        return 'text-warning-600 bg-warning-50';
      case 'failed':
        return 'text-error-600 bg-error-50';
      case 'refunded':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'upi':
        return <CreditCard className="w-4 h-4" />;
      case 'cod':
        return <span className="text-lg font-bold">₹</span>;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <span className="text-lg font-bold">₹</span>;
    }
  };

  const handleVerifyPayment = (verified) => {
    if (!selectedPayment) return;
    
    verifyPaymentMutation.mutate({
      orderId: selectedPayment._id,
      transactionId: selectedPayment.paymentDetails?.transactionId,
      verified
    });
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleExport = () => {
    if (!paymentsData?.payments || paymentsData.payments.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      // Prepare data for export
      const exportData = paymentsData.payments.map((payment) => ({
        'Order Number': payment.orderNumber,
        'Customer Name': payment.user?.name || 'N/A',
        'Customer Email': payment.user?.email || 'N/A',
        'Payment Method': payment.paymentMethod?.toUpperCase() || 'N/A',
        'Amount': payment.finalAmount,
        'Status': payment.paymentStatus?.charAt(0).toUpperCase() + payment.paymentStatus?.slice(1) || 'N/A',
        'Transaction ID': payment.paymentDetails?.transactionId || 'N/A',
        'UPI ID': payment.paymentDetails?.upiId || 'N/A',
        'Payment Date': formatDate(payment.createdAt),
        'Delivery Address': payment.deliveryDetails?.address || 'N/A',
        'Floor': payment.deliveryDetails?.floor || 'N/A',
        'Desk Number': payment.deliveryDetails?.deskNumber || 'N/A'
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Order Number
        { wch: 20 }, // Customer Name
        { wch: 25 }, // Customer Email
        { wch: 15 }, // Payment Method
        { wch: 12 }, // Amount
        { wch: 12 }, // Status
        { wch: 25 }, // Transaction ID
        { wch: 20 }, // UPI ID
        { wch: 20 }, // Payment Date
        { wch: 30 }, // Delivery Address
        { wch: 10 }, // Floor
        { wch: 12 }  // Desk Number
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Transactions');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `payment_transactions_${date}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);
      toast.success('Payment transactions exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export payment transactions');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const resetFilters = () => {
    setSearchTerm('');
    setPaymentStatusFilter('all');
    setPaymentMethodFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">Failed to load payment data</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container-mobile py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Payment Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Manage payments, verify transactions, and process refunds</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button 
                onClick={resetFilters}
                className="btn-outline flex items-center text-sm w-full sm:w-auto justify-center hover:bg-gray-50 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Filters
              </button>
              <button 
                onClick={handleExport}
                className="btn-primary flex items-center text-sm w-full sm:w-auto justify-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-100 mb-1">Total Revenue</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {formatCurrency(paymentsData?.summary?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-lg flex-shrink-0 ml-2 backdrop-blur-sm">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white">₹</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-100 mb-1">Pending Payments</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {paymentsData?.summary?.pendingCount || 0}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-lg flex-shrink-0 ml-2 backdrop-blur-sm">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-100 mb-1">Completed Payments</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {paymentsData?.summary?.completedCount || 0}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-lg flex-shrink-0 ml-2 backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-100 mb-1">Failed Payments</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {paymentsData?.summary?.failedCount || 0}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-lg flex-shrink-0 ml-2 backdrop-blur-sm">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-white shadow-lg border-0 mb-4 sm:mb-6">
          <div className="card-body p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                />
              </div>

              {/* Payment Status Filter */}
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="input text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              {/* Payment Method Filter */}
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="input text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
              >
                <option value="all">All Methods</option>
                <option value="upi">UPI</option>
                <option value="cod">COD</option>
                <option value="card">Card</option>
              </select>

              {/* Date From */}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                placeholder="From Date"
              />

              {/* Date To */}
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                placeholder="To Date"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="card bg-white shadow-lg border-0">
          <div className="card-header p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Payment Transactions</h2>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <label className="text-xs sm:text-sm text-gray-600">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                    className="input text-xs sm:text-sm w-16 sm:w-20 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs sm:text-sm text-gray-600">per page</span>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body p-0 sm:p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentsData?.payments?.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                      <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 bg-blue-100 px-2 py-1 rounded-full inline-block">
                          #{payment.orderNumber}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{payment.user?.name}</div>
                        <div className="text-xs text-gray-500">{payment.user?.email}</div>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span className="text-xs sm:text-sm text-gray-900 capitalize font-medium">
                            {payment.paymentMethod}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          {formatCurrency(payment.finalAmount)}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(payment.paymentStatus)}`}>
                          {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {payment.paymentMethod === 'upi' && payment.paymentStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleVerifyPayment(true)}
                                className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100 transition-all duration-200"
                                title="Verify Payment"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(false)}
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-all duration-200"
                                title="Reject Payment"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!paymentsData?.payments || paymentsData.payments.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium">No payments found</p>
                  <p className="text-sm">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {paymentsData?.pagination && paymentsData.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-xs sm:text-sm text-gray-700">
                  Showing {((paymentsData.pagination.currentPage - 1) * paymentsData.pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(paymentsData.pagination.currentPage * paymentsData.pagination.itemsPerPage, paymentsData.pagination.totalItems)} of{' '}
                  {paymentsData.pagination.totalItems} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(paymentsData.pagination.currentPage - 1)}
                    disabled={paymentsData.pagination.currentPage === 1}
                    className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, paymentsData.pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (paymentsData.pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (paymentsData.pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (paymentsData.pagination.currentPage >= paymentsData.pagination.totalPages - 2) {
                        pageNum = paymentsData.pagination.totalPages - 4 + i;
                      } else {
                        pageNum = paymentsData.pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 ${
                            pageNum === paymentsData.pagination.currentPage
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(paymentsData.pagination.currentPage + 1)}
                    disabled={paymentsData.pagination.currentPage === paymentsData.pagination.totalPages}
                    className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Payment Details
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Order Number
                  </label>
                  <p className="text-sm font-bold text-blue-600">#{selectedPayment.orderNumber}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Customer
                  </label>
                  <p className="text-sm font-medium text-gray-900">{selectedPayment.user?.name}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.user?.email}</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <p className="text-sm font-medium text-purple-600 capitalize">{selectedPayment.paymentMethod}</p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Amount
                  </label>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(selectedPayment.finalAmount)}
                  </p>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(selectedPayment.paymentStatus)}`}>
                    {selectedPayment.paymentStatus.charAt(0).toUpperCase() + selectedPayment.paymentStatus.slice(1)}
                  </span>
                </div>

                {selectedPayment.paymentDetails?.transactionId && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Transaction ID
                    </label>
                    <p className="text-sm font-mono text-yellow-700">{selectedPayment.paymentDetails.transactionId}</p>
                  </div>
                )}

                {selectedPayment.paymentDetails?.upiId && (
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      UPI ID
                    </label>
                    <p className="text-sm font-mono text-indigo-700">{selectedPayment.paymentDetails.upiId}</p>
                  </div>
                )}

                <div className="bg-pink-50 p-3 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <p className="text-sm font-medium text-pink-700">{formatDate(selectedPayment.createdAt)}</p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-outline flex-1 hover:bg-gray-50 transition-all duration-200"
                >
                  Close
                </button>
                {selectedPayment.paymentMethod === 'upi' && selectedPayment.paymentStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => handleVerifyPayment(true)}
                      disabled={verifyPaymentMutation.isLoading}
                      className="btn-success flex-1 flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {verifyPaymentMutation.isLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Verify
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(false)}
                      disabled={verifyPaymentMutation.isLoading}
                      className="btn-error flex-1 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {verifyPaymentMutation.isLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments; 

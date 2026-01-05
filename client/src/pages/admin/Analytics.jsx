import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Star,
  Calendar,
  Filter,
  Download,
  ArrowLeft
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Analytics = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('daily');
  const [days, setDays] = useState(30);

  const { data: revenueData, isLoading: revenueLoading } = useQuery(
    ['revenueAnalytics', period, days],
    async () => {
      const response = await api.get(`/api/admin/analytics/revenue?period=${period}&days=${days}`);
      return response.data.data;
    }
  );

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'adminDashboard',
    async () => {
      const response = await api.get('/api/admin/dashboard');
      return response.data.data;
    }
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (revenueLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-mobile py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Analytics Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">Detailed reports and insights for your business</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="input text-sm w-full sm:w-auto"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="input text-sm w-full sm:w-auto"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={365}>Last year</option>
                  </select>
                </div>
              </div>
              <button className="btn-outline flex items-center text-sm w-full sm:w-auto justify-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="card">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData?.revenue?.total || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-primary-100 rounded-lg flex-shrink-0 ml-2">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-600">₹</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {formatNumber(dashboardData?.orders?.total || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-secondary-100 rounded-lg flex-shrink-0 ml-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-secondary-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Active Users</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {formatNumber(dashboardData?.users?.active || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-success-100 rounded-lg flex-shrink-0 ml-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-success-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Delivery Rate</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {dashboardData?.orders?.deliveryRate || 0}%
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-warning-100 rounded-lg flex-shrink-0 ml-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-warning-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Revenue Trend</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData?.revenueData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Order Status Distribution</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData?.orderStatusDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {dashboardData?.orderStatusDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Selling Dishes */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Top Selling Dishes</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {dashboardData?.topDishes?.map((dish, index) => (
                  <div key={dish._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{dish._id}</p>
                        <p className="text-sm text-gray-500">
                          {dish.totalQuantity} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(dish.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.topDishes || dashboardData.topDishes.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Performance */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Delivery Staff Performance</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {dashboardData?.deliveryPerformance?.map((staff, index) => (
                  <div key={staff._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-success-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-500">
                          {staff.deliveredCount} deliveries
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-900">
                          {((staff.deliveredCount / dashboardData.orders.delivered) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.deliveryPerformance || dashboardData.deliveryPerformance.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No delivery data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Analytics */}
        <div className="mt-8">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Payment Method Distribution</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData?.payments?.map((payment) => (
                  <div key={payment._id} className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {payment.count}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {payment._id} payments
                    </div>
                  </div>
                ))}
                {(!dashboardData?.payments || dashboardData.payments.length === 0) && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No payment data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 

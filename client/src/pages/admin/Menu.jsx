import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Utensils, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  CheckCircle,
  X,
  Upload,
  Camera,
  ArrowLeft
} from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Menu = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isAvailable: true,
    preparationTime: '',
    calories: '',
    allergens: '',
  });

  const { data: menuItems, isLoading, error } = useQuery(
    ['adminMenu', searchTerm, categoryFilter, availabilityFilter],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (availabilityFilter !== 'all') params.append('isAvailable', availabilityFilter === 'available');
      
      const response = await api.get(`/api/admin/menu?${params.toString()}`);
      return response.data.data;
    }
  );

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery(
    ['adminMenuCategories'],
    async () => {
      const response = await api.get('/api/admin/menu/categories');
      console.log('Categories response:', response.data);
      return response.data.data.categories;
    },
    {
      onError: (error) => {
        console.error('Categories fetch error:', error);
        toast.error('Failed to load categories');
      },
      // Fallback categories in case API fails
      initialData: [
        { _id: 'breakfast', name: 'Breakfast' },
        { _id: 'lunch', name: 'Lunch' },
        { _id: 'dinner', name: 'Dinner' },
        { _id: 'snacks', name: 'Snacks' },
        { _id: 'beverages', name: 'Beverages' },
        { _id: 'desserts', name: 'Desserts' }
      ],
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Debug logging
  console.log('Categories data:', categories);
  console.log('Categories loading:', categoriesLoading);
  console.log('Categories error:', categoriesError);

  const uploadImageMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post('/api/admin/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Set the uploaded image URL in formData
        setFormData(prev => ({ ...prev, image: data.data.imageUrl }));
        setImagePreview(data.data.imageUrl);
        setIsUploading(false);
        toast.success('Image uploaded successfully!');
      },
      onError: (error) => {
        setIsUploading(false);
        toast.error(error.response?.data?.message || 'Failed to upload image');
      },
    }
  );

  const addMenuItemMutation = useMutation(
    async (menuData) => {
      const response = await api.post('/api/admin/menu', menuData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Menu item added successfully!');
        setShowAddModal(false);
        resetForm();
        queryClient.invalidateQueries('adminMenu');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add menu item');
      },
    }
  );

  const updateMenuItemMutation = useMutation(
    async ({ itemId, menuData }) => {
      const response = await api.put(`/api/admin/menu/${itemId}`, menuData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Menu item updated successfully!');
        setShowEditModal(false);
        setSelectedItem(null);
        resetForm();
        queryClient.invalidateQueries('adminMenu');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update menu item');
      },
    }
  );

  const deleteMenuItemMutation = useMutation(
    async (itemId) => {
      const response = await api.delete(`/api/admin/menu/${itemId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Menu item deleted successfully!');
        queryClient.invalidateQueries('adminMenu');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete menu item');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      isAvailable: true,
      preparationTime: '',
      calories: '',
      allergens: '',
    });
    setImagePreview('');
  };

  const handleImageUpload = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setIsUploading(true);
      uploadImageMutation.mutate(file);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else {
      toast.error('Please upload an image file');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else {
      toast.error('Please select an image file');
    }
  };

  const handleAddItem = () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if image is provided
    if (!formData.image) {
      toast.error('Please upload an image or provide an image URL');
      return;
    }

    // Prepare the data for submission
    const submitData = {
      ...formData,
      // Ensure category is lowercase to match server validation
      category: formData.category.toLowerCase(),
      // Convert allergens to comma-separated string if it's an array
      allergens: Array.isArray(formData.allergens) ? formData.allergens.join(',') : formData.allergens,
      // Ensure numeric fields are properly converted
      price: parseFloat(formData.price),
      preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
      calories: formData.calories ? parseInt(formData.calories) : undefined
    };

    addMenuItemMutation.mutate(submitData);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      image: item.image || '',
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime?.toString() || '',
      calories: item.calories?.toString() || '',
      allergens: item.allergens || '',
    });
    setImagePreview(item.image || '');
    setShowEditModal(true);
  };

  const handleUpdateItem = () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Prepare the data for submission
    const submitData = {
      ...formData,
      // Ensure category is lowercase to match server validation
      category: formData.category.toLowerCase(),
      // Convert allergens to comma-separated string if it's an array
      allergens: Array.isArray(formData.allergens) ? formData.allergens.join(',') : formData.allergens,
      // Ensure numeric fields are properly converted
      price: parseFloat(formData.price),
      preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
      calories: formData.calories ? parseInt(formData.calories) : undefined
    };

    updateMenuItemMutation.mutate({
      itemId: selectedItem._id,
      menuData: submitData
    });
  };

  const handleDeleteItem = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteMenuItemMutation.mutate(item._id);
    }
  };

  const handleToggleAvailability = (item) => {
    updateMenuItemMutation.mutate({
      itemId: item._id,
      menuData: { isAvailable: !item.isAvailable }
    });
  };

  // Ensure menuItems is an array and handle the data structure properly
  const menuItemsArray = Array.isArray(menuItems) ? menuItems : (menuItems?.menuItems || []);
  
  const filteredItems = menuItemsArray.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && item.isAvailable) ||
      (availabilityFilter === 'unavailable' && !item.isAvailable);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

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
          <p className="text-error-600 mb-4">Failed to load menu items</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="container-mobile mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Manage Menu</h1>
              <p className="text-sm sm:text-base text-gray-600">Add, edit, and manage menu items with photos</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center justify-center w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4 sm:mb-6">
          <div className="card-body p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 text-sm sm:text-base"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input pl-10 text-sm sm:text-base"
                >
                  <option value="all">All Categories</option>
                  {categoriesLoading && <option disabled>Loading categories...</option>}
                  {categoriesError && <option disabled>Error loading categories</option>}
                  {Array.isArray(categories) && categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="input pl-10 text-sm sm:text-base"
                >
                  <option value="all">All Items</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-center sm:justify-end">
                <span className="text-xs sm:text-sm text-gray-500">
                  {filteredItems?.length || 0} items found
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems && filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item._id} className="card hover:shadow-md transition-shadow">
                <div className="relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full aspect-[4/3] sm:aspect-[3/2] object-cover rounded-t-lg"
                      onError={(e) => {
                        console.error('Admin image failed to load:', item.image);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full aspect-[4/3] sm:aspect-[3/2] bg-gray-200 rounded-t-lg flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
                    <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                <div className="card-body p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-lg line-clamp-1">{item.name}</h3>
                    <span className="text-sm sm:text-lg font-bold text-primary-600 ml-2">₹{item.price.toFixed(2)}</span>
                  </div>

                  <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center space-x-2 mb-3">
                    <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-500 capitalize line-clamp-1">{item.category}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="btn-outline flex items-center text-xs sm:text-sm py-1.5 sm:py-2 flex-1 sm:flex-none justify-center"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`btn text-xs sm:text-sm py-1.5 sm:py-2 flex items-center flex-1 sm:flex-none justify-center ${item.isAvailable ? 'btn-error' : 'btn-success'}`}
                      >
                        {item.isAvailable ? (
                          <>
                            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Enable
                          </>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="btn-error flex items-center text-xs sm:text-sm py-1.5 sm:py-2 justify-center"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 sm:py-12">
              <div className="text-gray-400 mb-4">
                <Utensils className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No menu items have been added yet'
                }
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Menu Item
              </button>
            </div>
          )}
        </div>

        {/* Add Menu Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Menu Item
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input h-20 resize-none"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Select category</option>
                      {categoriesLoading && <option disabled>Loading categories...</option>}
                      {categoriesError && <option disabled>Error loading categories</option>}
                      {Array.isArray(categories) && categories.map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categoriesError && (
                      <p className="text-sm text-red-600 mt-1">Failed to load categories</p>
                    )}
                    {Array.isArray(categories) && categories.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">No categories available</p>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dish Photo
                  </label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center ${
                      isUploading ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                    }`}
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {isUploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <LoadingSpinner className="w-5 h-5" />
                          <span className="text-primary-600 text-sm">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">
                              <span className="text-primary-600 hover:text-primary-500">
                                Click to upload
                              </span>{' '}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Manual URL Input */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or enter image URL
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      className="input"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preparation Time (mins)
                    </label>
                    <input
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergens
                  </label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    className="input"
                    placeholder="e.g., nuts, dairy, gluten (comma-separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    List allergens separated by commas
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                    Available for ordering
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={handleAddItem}
                  disabled={addMenuItemMutation.isLoading}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {addMenuItemMutation.isLoading ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Item
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Menu Item Modal */}
        {showEditModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Menu Item
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input h-20 resize-none"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Select category</option>
                      {categoriesLoading && <option disabled>Loading categories...</option>}
                      {categoriesError && <option disabled>Error loading categories</option>}
                      {Array.isArray(categories) && categories.map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categoriesError && (
                      <p className="text-sm text-red-600 mt-1">Failed to load categories</p>
                    )}
                    {Array.isArray(categories) && categories.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">No categories available</p>
                    )}
                  </div>
                </div>

                {/* Image Upload for Edit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dish Photo
                  </label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center ${
                      isUploading ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                    }`}
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload-edit"
                    />
                    <label htmlFor="image-upload-edit" className="cursor-pointer">
                      {isUploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <LoadingSpinner className="w-5 h-5" />
                          <span className="text-primary-600 text-sm">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">
                              <span className="text-primary-600 hover:text-primary-500">
                                Click to upload
                              </span>{' '}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Manual URL Input */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or enter image URL
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      className="input"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preparation Time (mins)
                    </label>
                    <input
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergens
                  </label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    className="input"
                    placeholder="e.g., nuts, dairy, gluten (comma-separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    List allergens separated by commas
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailableEdit"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailableEdit" className="ml-2 block text-sm text-gray-900">
                    Available for ordering
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={handleUpdateItem}
                  disabled={updateMenuItemMutation.isLoading}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {updateMenuItemMutation.isLoading ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Update Item
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                    resetForm();
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu; 

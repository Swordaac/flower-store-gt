'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/contexts/UserContext';

interface ProductFormData {
  name: string;
  color: string;
  description: string;
  price: {
    standard: string;
    deluxe: string;
    premium: string;
  };
  stock: string;
  category: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  images: Array<{
    size: string;
    publicId?: string;
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  deluxeImage: {
    publicId?: string;
    url: string;
    alt: string;
  };
  premiumImage: {
    publicId?: string;
    url: string;
    alt: string;
  };
}

interface ProductFormProps {
  product?: any;
  onSubmit: (data: ProductFormData) => Promise<any> | void;
  onCancel: () => void;
  isEditing?: boolean;
  shopId?: string; // Required for image uploads
}

const categories = [
  'bouquet',
  'single-flower',
  'plant',
  'gift-basket',
  'seasonal',
  'wedding',
  'funeral',
  'anniversary',
  'birthday',
  'other'
];

const colors = [
  'red',
  'pink',
  'white',
  'yellow',
  'orange',
  'purple',
  'blue',
  'green',
  'mixed',
  'other'
];

const imageSizes = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' }
];

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  onCancel,
  isEditing = false,
  shopId
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    color: '',
    description: '',
    price: {
      standard: '',
      deluxe: '',
      premium: ''
    },
    stock: '',
    category: [],
    tags: [],
    isActive: true,
    isFeatured: false,
    images: [],
    deluxeImage: {
      publicId: '',
      url: '',
      alt: ''
    },
    premiumImage: {
      publicId: '',
      url: '',
      alt: ''
    }
  });

  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingFileSizes, setPendingFileSizes] = useState<{[key: number]: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session } = useUser();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        color: product.color || '',
        description: product.description || '',
        price: {
          standard: product.price?.standard ? (product.price.standard / 100).toString() : '',
          deluxe: product.price?.deluxe ? (product.price.deluxe / 100).toString() : '',
          premium: product.price?.premium ? (product.price.premium / 100).toString() : ''
        },
        stock: product.stock?.toString() || '',
        category: product.category || [],
        tags: product.tags || [],
        isActive: product.isActive !== undefined ? product.isActive : true,
        isFeatured: product.isFeatured || false,
        images: product.images || [],
        deluxeImage: product.deluxeImage || { publicId: '', url: '', alt: '' },
        premiumImage: product.premiumImage || { publicId: '', url: '', alt: '' }
      });
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePriceChange = (tier: 'standard' | 'deluxe' | 'premium', value: string) => {
    setFormData(prev => ({
      ...prev,
      price: {
        ...prev.price,
        [tier]: value
      }
    }));
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      category: checked 
        ? [...prev.category, category]
        : prev.category.filter(c => c !== category)
    }));
  };

  const handleTierImageChange = (tier: 'deluxe' | 'premium', field: 'url' | 'alt', value: string) => {
    setFormData(prev => ({
      ...prev,
      [`${tier}Image`]: {
        ...prev[`${tier}Image`],
        [field]: value
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileSelect = (files: FileList) => {
    if (files.length === 0) return;

    // Convert FileList to Array and add to pending files
    const newFiles = Array.from(files);
    
    setPendingFiles(prev => {
      const updatedFiles = [...prev, ...newFiles];
      
      // Initialize size for new files (default to medium)
      const newSizes: {[key: number]: string} = {};
      newFiles.forEach((_, index) => {
        newSizes[prev.length + index] = 'medium';
      });
      
      setPendingFileSizes(prevSizes => ({...prevSizes, ...newSizes}));
      
      return updatedFiles;
    });
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setPendingFileSizes(prev => {
      const newSizes = {...prev};
      delete newSizes[index];
      return newSizes;
    });
  };

  const updatePendingFileSize = (index: number, size: string) => {
    setPendingFileSizes(prev => ({
      ...prev,
      [index]: size
    }));
  };

  const uploadImages = async (productId: string): Promise<any[]> => {
    if (pendingFiles.length === 0) return [];

    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    if (!shopId) {
      throw new Error('Shop ID is required for image uploads');
    }

    console.log('Starting image upload:', { productId, shopId, fileCount: pendingFiles.length });
    setUploading(true);

    try {
      const formData = new FormData();
      
      // Add all pending files
      pendingFiles.forEach((file, index) => {
        console.log(`Adding file ${index}:`, file.name, file.size, file.type);
        formData.append('images', file);
      });
      
      // Add image sizes as a single array
      const sizes = pendingFiles.map((_, index) => pendingFileSizes[index] || 'medium');
      formData.append('imageSizes', JSON.stringify(sizes));
      formData.append('productId', productId);

      console.log('Sending upload request to:', 'http://localhost:5001/api/images/upload/multiple');
      console.log('Image sizes being sent:', sizes);
      console.log('Pending file sizes state:', pendingFileSizes);

      const response = await fetch('http://localhost:5001/api/images/upload/multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      console.log('Upload response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Image upload response:', data);

      if (data.success) {
        // Clear pending files after successful upload
        setPendingFiles([]);
        alert(`Successfully uploaded ${data.data.images.length} images!`);
        return data.data.images;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Image upload failed: ${errorMessage}`);
      throw error;
    } finally {
      setUploading(false);
    }
  };


  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert prices to cents
      const priceInCents = {
        standard: Math.round(parseFloat(formData.price.standard) * 100),
        deluxe: Math.round(parseFloat(formData.price.deluxe) * 100),
        premium: Math.round(parseFloat(formData.price.premium) * 100)
      };
      
      const submitData = {
        ...formData,
        price: {
          standard: priceInCents.standard.toString(),
          deluxe: priceInCents.deluxe.toString(),
          premium: priceInCents.premium.toString()
        },
        stock: parseInt(formData.stock).toString(),
        // Only send images that have been uploaded (have publicId)
        images: formData.images.filter(img => img.publicId)
      };
      
      console.log('Submitting product data:', submitData);
      console.log('Pending files:', pendingFiles.length);
      
      // Submit the product first
      const createdProduct = await onSubmit(submitData);
      console.log('Product created:', createdProduct);
      
      // If there are pending files and we have a product ID, upload images
      if (pendingFiles.length > 0 && createdProduct && createdProduct._id) {
        console.log('Starting image upload for product:', createdProduct._id);
        await uploadImages(createdProduct._id);
      } else {
        console.log('No image upload needed:', { 
          pendingFiles: pendingFiles.length, 
          hasProduct: !!createdProduct, 
          hasId: !!(createdProduct && createdProduct._id) 
        });
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Failed to create product. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Color *
              </label>
              <select
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a color</option>
                {colors.map(color => (
                  <option key={color} value={color}>
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Describe your product..."
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categories * (Select at least one)
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.category.includes(category)}
                    onChange={(e) => handleCategoryChange(category, e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
            {formData.category.length === 0 && (
              <p className="mt-1 text-sm text-red-600">Please select at least one category</p>
            )}
          </div>

          {/* Tiered Pricing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Pricing Tiers (USD) *
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Standard
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={formData.price.standard}
                    onChange={(e) => handlePriceChange('standard', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Deluxe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={formData.price.deluxe}
                    onChange={(e) => handlePriceChange('deluxe', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Premium
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={formData.price.premium}
                    onChange={(e) => handlePriceChange('premium', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stock Quantity *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              required
              min="0"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="0"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Images
            </label>
            
            {!shopId && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Image upload requires a shop. Please ensure you have a shop and are logged in.
                </p>
              </div>
            )}
            
            {/* Upload Area */}
            <div className="mt-1">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  !shopId
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : dragOver
                    ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
                    : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onDrop={shopId ? handleDrop : undefined}
                onDragOver={shopId ? handleDragOver : undefined}
                onDragLeave={shopId ? handleDragLeave : undefined}
                onClick={shopId ? openFileDialog : undefined}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  className="hidden"
                  disabled={uploading}
                />

                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-sm text-gray-600">Uploading images...</p>
                  </div>
                ) : !shopId ? (
                  <div className="flex flex-col items-center">
                    <PhotoIcon className="mx-auto h-16 w-16 text-gray-300" />
                    <div className="mt-4">
                      <p className="text-lg font-medium text-gray-400">
                        Image upload disabled
                      </p>
                      <p className="text-sm text-gray-400 mt-1">Shop ID required to upload images</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <PhotoIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <div className="mt-4">
                      <p className="text-lg font-medium text-gray-700">
                        <span className="font-semibold text-indigo-600 hover:text-indigo-500">
                          Drag & Drop Images Here
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        or <span className="font-medium text-indigo-600 hover:text-indigo-500">click to browse</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB each</p>
                      <p className="text-xs text-gray-400 mt-1">Images will be uploaded when you create the product</p>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* Image Gallery */}
            {(formData.images.length > 0 || pendingFiles.length > 0) && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Show uploaded images */}
              {formData.images.map((image, index) => (
                    <div key={`uploaded-${index}`} className="relative group">
                  <img
                    src={image.url}
                    alt={image.alt}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {image.size?.toUpperCase() || 'N/A'}
                      </div>
                      
                      {image.isPrimary && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                          {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              Set Primary
                    </button>
                          )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                            Delete
                    </button>
                        </div>
                  </div>
                </div>
              ))}
              
                  {/* Show pending files */}
                  {pendingFiles.map((file, index) => (
                    <div key={`pending-${index}`} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Pending
                      </div>

                      {/* Size selector - always visible */}
                      <div className="absolute bottom-2 left-2 right-2 z-10">
                        <select
                          value={pendingFileSizes[index] || 'medium'}
                          onChange={(e) => updatePendingFileSize(index, e.target.value)}
                          className="w-full text-xs bg-white bg-opacity-95 rounded px-2 py-1 border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {imageSizes.map(size => (
                            <option key={size.value} value={size.value}>
                              {size.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Remove button - only on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => removePendingFile(index)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 z-20"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {pendingFiles.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Images will be uploaded when you create the product
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tier-Specific Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Tier-Specific Images
            </label>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Deluxe Image */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Deluxe Version Image
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formData.deluxeImage.url}
                    onChange={(e) => handleTierImageChange('deluxe', 'url', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Image URL"
                  />
                  <input
                    type="text"
                    value={formData.deluxeImage.alt}
                    onChange={(e) => handleTierImageChange('deluxe', 'alt', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Alt text"
                  />
                  {formData.deluxeImage.url && (
                    <div className="mt-2">
                      <img
                        src={formData.deluxeImage.url}
                        alt={formData.deluxeImage.alt}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Premium Image */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Premium Version Image
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formData.premiumImage.url}
                    onChange={(e) => handleTierImageChange('premium', 'url', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Image URL"
                  />
                  <input
                    type="text"
                    value={formData.premiumImage.alt}
                    onChange={(e) => handleTierImageChange('premium', 'alt', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Alt text"
                  />
                  {formData.premiumImage.url && (
                    <div className="mt-2">
                      <img
                        src={formData.premiumImage.url}
                        alt={formData.premiumImage.alt}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Options */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Featured
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isEditing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

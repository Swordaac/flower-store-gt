# Cloudinary Setup Guide

This guide will help you set up Cloudinary for product image uploads in the Flower Store application.

## 1. Create a Cloudinary Account

1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your Cloudinary Credentials

1. Log into your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy the following values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

## 3. Configure Environment Variables

Add the following variables to your `.env` file in the backend directory:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace the placeholder values with your actual Cloudinary credentials.

## 4. Features Implemented

### Image Upload Endpoints

- **POST** `/api/images/upload/single` - Upload a single image for a product
- **POST** `/api/images/upload/multiple` - Upload multiple images for a product
- **DELETE** `/api/images/:publicId` - Delete an image
- **PUT** `/api/images/:publicId/primary` - Set an image as primary
- **GET** `/api/images/product/:productId` - Get all images for a product
- **GET** `/api/images/shop/:shopId` - Get all images for a shop's products

### Security Features

- **Shop-based Access Control**: Each shop can only manage images for their own products
- **Authentication Required**: All upload/delete operations require authentication
- **Role-based Access**: Only shop owners and admins can upload/delete images
- **Organized Storage**: Images are stored in folders organized by shop and product

### Folder Structure

Images are organized in Cloudinary with the following structure:
```
shops/
  └── {shopId}/
      └── products/
          └── {productId}/
              ├── image1.jpg
              ├── image2.jpg
              └── ...
```

## 5. Usage Examples

### Upload Single Image

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('productId', 'product_id_here');
formData.append('alt', 'Image description');

fetch('/api/images/upload/single', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Upload Multiple Images

```javascript
const formData = new FormData();
for (let i = 0; i < fileInput.files.length; i++) {
  formData.append('images', fileInput.files[i]);
}
formData.append('productId', 'product_id_here');

fetch('/api/images/upload/multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Delete Image

```javascript
fetch(`/api/images/${publicId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### Set Primary Image

```javascript
fetch(`/api/images/${publicId}/primary`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

## 6. Product Model Integration

The Product model has been updated to include image fields:

```javascript
images: [{
  publicId: String,      // Cloudinary public ID
  url: String,           // Cloudinary URL
  alt: String,           // Alt text for accessibility
  isPrimary: Boolean     // Whether this is the primary image
}]
```

## 7. Error Handling

The system handles various error scenarios:

- **File Size Limit**: Maximum 5MB per image
- **File Type Validation**: Only image files are allowed
- **Authentication Errors**: Proper error messages for unauthorized access
- **Shop Ownership**: Users can only manage images for their own products
- **Cloudinary Errors**: Graceful handling of upload/delete failures

## 8. Testing

To test the setup:

1. Ensure your `.env` file has the correct Cloudinary credentials
2. Start the backend server: `npm start`
3. Use the API endpoints with proper authentication
4. Check the Cloudinary dashboard to see uploaded images

## 9. Security Considerations

- Images are stored with organized folder structure for easy management
- Each shop can only access their own images
- Admin users have access to all images
- File uploads are validated for type and size
- Authentication is required for all management operations

## 10. Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month

For production use, consider upgrading to a paid plan based on your needs.

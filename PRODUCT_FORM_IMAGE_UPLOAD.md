# Product Form with Image Upload Integration

The ProductForm component has been updated to include Cloudinary image upload functionality with drag-and-drop support.

## Features

- **Drag & Drop Upload**: Users can drag and drop image files directly onto the upload area
- **Multiple Image Support**: Upload single or multiple images at once
- **Real-time Preview**: See uploaded images immediately in a gallery view
- **Primary Image Selection**: Set any uploaded image as the primary image
- **Image Management**: Delete images with automatic Cloudinary cleanup
- **Progress Indicators**: Visual feedback during upload process
- **File Validation**: Only image files up to 5MB each are accepted

## Updated Component Props

```typescript
interface ProductFormProps {
  product?: any;                    // Existing product for editing
  onSubmit: (data: ProductFormData) => void;  // Form submission handler
  onCancel: () => void;             // Cancel handler
  isEditing?: boolean;              // Whether editing existing product
  shopId?: string;                  // Required for image uploads
}
```

## Usage Example

```tsx
import { ProductForm } from '@/components/ProductForm';
import { useUser } from '@/contexts/UserContext';

function MyComponent() {
  const { userShop, session } = useUser();
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (formData: any) => {
    // Handle form submission
    console.log('Product data:', formData);
  };

  return (
    <div>
      <button onClick={() => setShowForm(true)}>
        Add New Product
      </button>

      {showForm && (
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          shopId={userShop?._id}  // Required for image uploads
        />
      )}
    </div>
  );
}
```

## Image Upload Flow

### 1. Upload Process
- User drags files or clicks upload area
- Files are validated (type and size)
- Images are uploaded to Cloudinary with organized folder structure
- Upload progress is shown to user
- Images appear in gallery with management options

### 2. Folder Structure
Images are organized in Cloudinary as:
```
shops/
  └── {shopId}/
      └── products/
          └── {productId}/
              ├── image1.jpg
              ├── image2.jpg
              └── ...
```

### 3. Image Management
- **Set Primary**: Click "Set Primary" to make an image the main product image
- **Delete**: Click "Delete" to remove an image (also deletes from Cloudinary)
- **Preview**: Hover over images to see management options

## Form Data Structure

The form now includes Cloudinary image data:

```typescript
interface ProductFormData {
  name: string;
  description: string;
  price: string;           // In dollars (will be converted to cents)
  quantity: string;
  category: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  images: Array<{
    publicId?: string;     // Cloudinary public ID
    url: string;           // Cloudinary URL
    alt: string;           // Alt text for accessibility
    isPrimary: boolean;    // Whether this is the primary image
  }>;
}
```

## API Integration

The component automatically handles:

### Image Upload
- **Single Image**: `POST /api/images/upload/single`
- **Multiple Images**: `POST /api/images/upload/multiple`

### Image Management
- **Delete Image**: `DELETE /api/images/:publicId`
- **Set Primary**: `PUT /api/images/:publicId/primary`

### Authentication
All image operations require:
- Valid JWT token in Authorization header
- User must own the shop or be an admin
- Shop ID must be provided

## Error Handling

The component handles various error scenarios:

- **Authentication Errors**: Shows alert if user is not authenticated
- **Shop Validation**: Ensures shopId is provided
- **Upload Failures**: Shows error messages for failed uploads
- **Network Errors**: Handles connection issues gracefully
- **File Validation**: Prevents invalid file types and sizes

## Security Features

- **Shop Isolation**: Users can only upload images for their own products
- **Authentication Required**: All operations require valid authentication
- **File Validation**: Only image files up to 5MB are accepted
- **Automatic Cleanup**: Deleted images are removed from Cloudinary

## Styling

The component uses Tailwind CSS classes and includes:

- **Drag & Drop Area**: Dashed border with hover effects
- **Upload Progress**: Spinning indicator during uploads
- **Image Gallery**: Grid layout with hover overlays
- **Management Buttons**: Primary/Delete buttons with proper styling
- **Responsive Design**: Works on mobile and desktop

## Browser Support

- **Modern Browsers**: Full drag & drop support
- **File API**: Uses HTML5 File API for file handling
- **FormData**: Uses FormData for multipart uploads
- **Fetch API**: Uses modern fetch for HTTP requests

## Performance Considerations

- **Image Optimization**: Cloudinary automatically optimizes uploaded images
- **Lazy Loading**: Images are loaded as needed
- **Memory Management**: File buffers are handled efficiently
- **CDN Delivery**: Images are served via Cloudinary's global CDN

## Troubleshooting

### Common Issues

1. **"Authentication required"**
   - Ensure user is logged in
   - Check that session token is valid

2. **"Shop ID is required"**
   - Pass shopId prop to ProductForm
   - Ensure user has a shop

3. **Upload fails**
   - Check Cloudinary credentials in .env
   - Verify file size (max 5MB)
   - Ensure file is an image

4. **Images not showing**
   - Check network connection
   - Verify Cloudinary configuration
   - Check browser console for errors

### Debug Mode

Enable debug logging by adding to your component:

```tsx
// Add this to see detailed upload information
console.log('Upload data:', {
  files: files.length,
  shopId,
  productId: product?._id
});
```

## Migration from URL-based Images

If you were previously using URL-based image input:

1. **Remove old URL inputs**: The component no longer has URL input fields
2. **Update form data**: Images now include publicId and are managed via Cloudinary
3. **Update API calls**: Ensure your backend handles the new image structure
4. **Test thoroughly**: Verify upload, delete, and primary image functionality

## Best Practices

1. **Always provide shopId**: Required for proper image organization
2. **Handle errors gracefully**: Show user-friendly error messages
3. **Validate on backend**: Don't rely only on frontend validation
4. **Optimize images**: Use appropriate image sizes for your use case
5. **Test with different file types**: Ensure all supported formats work
6. **Monitor upload limits**: Be aware of Cloudinary free tier limits



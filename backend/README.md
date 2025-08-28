# Flower Store Backend API

A robust, scalable backend service built with Express.js and MongoDB for a flower store application.

## 🚀 Features

- **RESTful API** with comprehensive CRUD operations
- **MongoDB integration** with Mongoose ODM
- **Input validation** and error handling
- **Security middleware** (Helmet, CORS)
- **Request logging** with Morgan
- **Environment configuration** with dotenv
- **Health check endpoint** for monitoring

## 📦 Required Packages

### Core Dependencies
- `express` - Web framework for Node.js
- `mongoose` - MongoDB ODM for data modeling
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers middleware
- `morgan` - HTTP request logger

### Development Dependencies
- `nodemon` - Auto-restart server during development

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure your variables:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/flower-store
```

### 3. MongoDB Setup
Ensure MongoDB is running locally or update `MONGO_URI` to point to your MongoDB instance.

### 4. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/stock` - Update stock quantity

### Query Parameters for GET /api/products
- `category` - Filter by category (bouquet, single-flower, plant, accessory)
- `inStock` - Filter by stock availability (true/false)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `search` - Text search in product names

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Create a Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sunflower Bouquet",
    "price": 29.99,
    "quantity": 10,
    "description": "Beautiful yellow sunflowers",
    "category": "bouquet"
  }'
```

### 3. Get All Products
```bash
curl http://localhost:5000/api/products
```

### 4. Get Products by Category
```bash
curl "http://localhost:5000/api/products?category=bouquet"
```

## 🔐 Future Integrations

### Authentication
- JWT-based authentication middleware
- User registration and login endpoints
- Role-based access control

### Payment Processing
- Stripe integration for payment processing
- Order management system
- Inventory tracking

### Additional Features
- Image upload and storage
- Email notifications
- Analytics and reporting
- Rate limiting and caching

## 📁 Project Structure
```
backend/
├── app.js              # Main application file
├── models/
│   └── Product.js      # Product data model
├── routes/
│   └── products.js     # Product CRUD routes
├── package.json        # Dependencies and scripts
├── env.example         # Environment variables template
└── README.md           # This file
```

## 🚨 Error Handling

The API includes comprehensive error handling:
- **400** - Bad Request (validation errors)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error

All errors return consistent JSON responses with error details.

## 🔧 Development

### Adding New Models
1. Create model file in `models/` directory
2. Define schema with validation
3. Create corresponding routes in `routes/` directory
4. Add routes to `app.js`

### Adding Middleware
1. Install required package
2. Import and use in `app.js`
3. Consider order of middleware (security first, then business logic)

## 📊 Monitoring

- Health check endpoint for uptime monitoring
- Request logging with Morgan
- Error logging to console
- MongoDB connection status monitoring

## 🚀 Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set appropriate security headers
4. Use PM2 or similar process manager
5. Set up reverse proxy (Nginx/Apache)
6. Configure SSL certificates

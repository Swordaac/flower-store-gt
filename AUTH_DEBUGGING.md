# 🔐 Authentication Debugging Guide

## **🚨 Current Issue: "Invalid login credentials"**

### **Problem Description:**
- User signs up successfully in Supabase ✅
- User tries to sign in ❌
- Gets "Invalid login credentials" error ❌
- No user record created in MongoDB ❌

### **Root Causes & Solutions:**

#### **1. Email Confirmation Required**
**Problem:** Supabase requires email confirmation before allowing sign-in
**Solution:** 
- Check Supabase Dashboard > Authentication > Settings
- Look for "Enable email confirmations" setting
- If enabled, users must confirm email before signing in

#### **2. Password Mismatch**
**Problem:** User might be using different password than expected
**Solution:**
- Verify the password used during signup
- Check if password meets complexity requirements
- Ensure no extra spaces or special characters

#### **3. MongoDB Connection Issues**
**Problem:** Backend can't connect to MongoDB to create user records
**Solution:**
- Check MongoDB connection in backend
- Verify environment variables
- Check backend logs for connection errors

#### **4. Supabase JWT Token Issues**
**Problem:** Token verification failing in backend
**Solution:**
- Check JWT secret configuration
- Verify Supabase service role key
- Check token expiration settings

## **🔍 Debugging Steps:**

### **Step 1: Check Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Check if the user exists and status
4. Look for any error messages or pending confirmations

### **Step 2: Check Backend Logs**
1. Start your backend server: `cd backend && npm run dev`
2. Try to sign in with the created account
3. Check backend console for error messages
4. Look for MongoDB connection logs

### **Step 3: Test Authentication Flow**
1. Run the test script: `node test-auth-flow.js`
2. Check if backend endpoints are accessible
3. Verify MongoDB connection
4. Test with a valid JWT token

### **Step 4: Check Frontend Authentication**
1. Open browser DevTools
2. Go to Application > Local Storage
3. Look for `supabase.auth.token`
4. Check if token exists and is valid

## **🛠️ Quick Fixes:**

### **Fix 1: Disable Email Confirmation (Development)**
1. Go to Supabase Dashboard > Authentication > Settings
2. Disable "Enable email confirmations"
3. Test signup/signin flow again

### **Fix 2: Check Environment Variables**
```bash
# Backend .env file should have:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MONGO_URI=your-mongodb-connection-string
```

### **Fix 3: Verify MongoDB Connection**
```bash
# Test MongoDB connection
cd backend
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));
"
```

## **🧪 Testing Commands:**

### **Test Backend Health:**
```bash
curl http://localhost:5001/health
```

### **Test Public Endpoints:**
```bash
curl http://localhost:5001/api/shops
curl http://localhost:5001/api/products
```

### **Test Protected Endpoints (without token):**
```bash
curl http://localhost:5001/api/auth/profile
# Should return 401 Unauthorized
```

### **Test with Valid Token:**
```bash
# Get token from browser DevTools, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5001/api/auth/profile
```

## **📋 Common Error Messages:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid login credentials` | User not in MongoDB | Check backend logs, verify MongoDB connection |
| `Invalid or expired token` | JWT verification failed | Check Supabase keys, verify token |
| `Access token required` | No Authorization header | Include `Bearer TOKEN` in request |
| `Authentication failed` | Backend error | Check backend logs, verify environment |

## **🔧 Advanced Debugging:**

### **Enable Detailed Logging:**
```javascript
// In backend/middleware/auth.js
console.log('Token received:', token.substring(0, 20) + '...');
console.log('Supabase user:', user);
console.log('MongoDB user lookup result:', dbUser);
```

### **Check Supabase Auth Events:**
```javascript
// In frontend AuthContext
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});
```

### **Verify JWT Token:**
```bash
# Decode JWT token (without verification)
echo "YOUR_JWT_TOKEN" | cut -d'.' -f2 | base64 -d | jq .
```

## **📞 Getting Help:**

If the issue persists:
1. Check all logs (frontend, backend, Supabase)
2. Verify environment configuration
3. Test with a fresh user account
4. Check Supabase project settings
5. Verify MongoDB connection and permissions

## **✅ Success Indicators:**

- User appears in Supabase Authentication > Users
- User record created in MongoDB
- JWT token generated and valid
- Backend can verify token and find user
- Frontend receives valid session
- User can access protected routes

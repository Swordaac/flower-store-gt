# 🔐 Supabase Authentication Testing Guide

This guide will help you test the complete authentication system built with Supabase and Next.js.

## 📋 Prerequisites

1. **Supabase Project Setup**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project or use existing one
   - Get your project URL and anon key

2. **Environment Configuration**
   - Copy `env.local.example` to `.env.local`
   - Update with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## 🚀 Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - You should see the home page with navigation

## 🧪 Manual Testing Steps

### **Test 1: Home Page Navigation**
1. **Visit:** `http://localhost:3000`
2. **Expected Result:** 
   - Home page loads with navigation
   - "Sign In" and "Sign Up" buttons visible
   - No user information displayed

### **Test 2: User Registration**
1. **Click:** "Sign Up" button
2. **URL:** Should navigate to `/auth/signup`
3. **Fill Form:**
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
4. **Click:** "Create Account"
5. **Expected Result:**
   - Form submits successfully
   - Redirects to `/dashboard` (if email confirmation is disabled)
   - Or shows success message (if email confirmation is enabled)

### **Test 3: User Login**
1. **Navigate to:** `/auth/signin`
2. **Fill Form:**
   - Email: `test@example.com`
   - Password: `password123`
3. **Click:** "Sign In"
4. **Expected Result:**
   - Successful login
   - Redirects to `/dashboard`
   - Navigation shows user information

### **Test 4: Dashboard Access**
1. **After login, you should be on:** `/dashboard`
2. **Expected Result:**
   - User profile displayed
   - User information visible (name, email, join date)
   - Sign out button available
   - Quick actions section visible

### **Test 5: Protected Route Access**
1. **Try to access:** `/dashboard` without being logged in
2. **Expected Result:**
   - Automatically redirected to `/auth/signin`
   - Cannot access dashboard content

### **Test 6: Sign Out**
1. **On dashboard, click:** "Sign Out" button
2. **Expected Result:**
   - User logged out successfully
   - Redirected to `/auth/signin`
   - Session cleared

### **Test 7: Session Persistence**
1. **Login successfully**
2. **Refresh the page** (F5 or Cmd+R)
3. **Expected Result:**
   - User remains logged in
   - Dashboard still accessible
   - No need to re-enter credentials

## 🔍 Browser Developer Tools Testing

### **Network Tab Inspection**
1. **Open DevTools:** F12 or Cmd+Option+I
2. **Go to Network tab**
3. **Perform login/registration**
4. **Look for:**
   - Supabase API calls
   - JWT tokens in request headers
   - Authentication endpoints

### **JWT Token Verification**
1. **After login, check Network tab**
2. **Look for requests to your backend**
3. **Verify Authorization header contains:**
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### **Local Storage Inspection**
1. **Go to Application tab in DevTools**
2. **Check Local Storage**
3. **Look for Supabase session data**

## 🐛 Troubleshooting Common Issues

### **Issue: "Missing Supabase environment variables"**
**Solution:**
- Ensure `.env.local` file exists
- Check environment variable names are correct
- Restart development server after changes

### **Issue: "Authentication failed"**
**Solution:**
- Verify Supabase credentials
- Check if user exists in Supabase dashboard
- Ensure email confirmation is handled properly

### **Issue: "Cannot access dashboard"**
**Solution:**
- Check if user is properly authenticated
- Verify AuthContext is working
- Check browser console for errors

### **Issue: "Redirect loop"**
**Solution:**
- Check ProtectedRoute logic
- Verify authentication state
- Clear browser storage and cookies

## 📱 Testing Different Scenarios

### **Email Confirmation Flow**
1. **Enable email confirmation in Supabase**
2. **Register new user**
3. **Check email for confirmation link**
4. **Click confirmation link**
5. **Verify user can now login**

### **Password Reset Flow**
1. **Go to signin page**
2. **Click "Forgot password?" (if implemented)**
3. **Enter email address**
4. **Check email for reset link**
5. **Set new password**

### **Multiple User Sessions**
1. **Open multiple browser tabs**
2. **Login in one tab**
3. **Verify other tabs show logged-in state**
4. **Logout in one tab**
5. **Verify all tabs reflect logout**

## 🧪 Automated Testing (Optional)

### **Run Existing Tests**
```bash
npm test
```

### **Create New Tests**
Add tests for:
- Authentication success/failure
- Route protection
- Session management
- Error handling

## 📊 Expected Results Summary

| Test Case | Expected Result |
|-----------|-----------------|
| Home page load | ✅ Navigation visible, no user info |
| Registration | ✅ Account created, redirect to dashboard |
| Login | ✅ User authenticated, session established |
| Dashboard access | ✅ Protected content visible |
| Unauthorized access | ✅ Redirect to login page |
| Sign out | ✅ Session cleared, redirect to login |
| Page refresh | ✅ Session persists |
| Protected routes | ✅ Access control working |

## 🚀 Production Readiness Checklist

- [ ] Environment variables configured
- [ ] Supabase project settings optimized
- [ ] Error handling implemented
- [ ] Loading states working
- [ ] Route protection verified
- [ ] Session management tested
- [ ] Cross-browser compatibility checked
- [ ] Mobile responsiveness verified

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase dashboard settings
3. Check environment configuration
4. Review authentication flow logs

---

**Happy Testing! 🎉**

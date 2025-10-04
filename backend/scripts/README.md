# User Password Management Scripts

This directory contains scripts for managing user passwords in the Flower Store application.

## Prerequisites

1. **Environment Variables**: Ensure your `.env` file contains the required Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   MONGO_URI=your_mongodb_connection_string
   ```

2. **Dependencies**: Make sure all required packages are installed:
   ```bash
   cd backend
   npm install
   ```

## Available Scripts

### 1. Quick Password Change for test11@mcgill.ca

**File**: `change-test11-password.js`

**Usage**:
```bash
# Generate a random secure password
node change-test11-password.js

# Use a specific password
node change-test11-password.js mynewpassword123
```

**Features**:
- Automatically targets `test11@mcgill.ca`
- Generates secure random password if none provided
- Updates both Supabase and MongoDB records
- Provides clear success/failure feedback

### 2. General User Password Manager

**File**: `user-password-manager.js`

**Usage**:
```bash
# Change password for any user
node user-password-manager.js change <email> <new_password>

# Send password reset email
node user-password-manager.js reset <email>

# List all users
node user-password-manager.js list

# Generate a secure password
node user-password-manager.js generate-password [length]
```

**Examples**:
```bash
# Change password for test11@mcgill.ca
node user-password-manager.js change test11@mcgill.ca newpassword123

# Send reset email to test11@mcgill.ca
node user-password-manager.js reset test11@mcgill.ca

# List all users with their status
node user-password-manager.js list

# Generate a 16-character password
node user-password-manager.js generate-password 16
```

### 3. Basic Password Change Script

**File**: `change-user-password.js`

**Usage**:
```bash
node change-user-password.js <email> <new_password>
```

**Example**:
```bash
node change-user-password.js test11@mcgill.ca newpassword123
```

## Password Requirements

- **Minimum length**: 6 characters
- **Recommended**: 12+ characters with mix of:
  - Lowercase letters (a-z)
  - Uppercase letters (A-Z)
  - Numbers (0-9)
  - Special characters (!@#$%^&*)

## What the Scripts Do

### For Supabase:
1. Find the user by email
2. Update the password using Supabase Admin API
3. Verify the update was successful

### For MongoDB:
1. Find the user record (if exists)
2. Update the `lastLoginAt` timestamp
3. Log the user's role and status

## Error Handling

The scripts handle common errors:
- **User not found**: Clear error message if email doesn't exist
- **Invalid credentials**: Supabase API errors are displayed
- **Database connection**: MongoDB connection issues are caught
- **Password validation**: Length and format validation

## Security Notes

⚠️ **Important Security Considerations**:

1. **Service Role Key**: The scripts use the Supabase service role key, which has admin privileges
2. **Environment Variables**: Never commit `.env` files with real credentials
3. **Password Logging**: Passwords are logged in the console - be careful in shared environments
4. **Access Control**: Only authorized personnel should run these scripts

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Check your `.env` file has all required Supabase credentials
   - Ensure the service role key is correct

2. **"User not found in Supabase"**
   - Verify the email address is correct
   - Check if the user exists in your Supabase dashboard

3. **"MongoDB connection error"**
   - Verify your `MONGO_URI` is correct
   - Ensure MongoDB is running and accessible

4. **"Failed to update password in Supabase"**
   - Check your Supabase service role key permissions
   - Verify the user account is not disabled

### Debug Steps:

1. **Test Supabase connection**:
   ```bash
   node -e "const {supabaseService} = require('./config/supabase'); supabaseService.auth.admin.listUsers().then(console.log).catch(console.error)"
   ```

2. **Test MongoDB connection**:
   ```bash
   node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected')).catch(console.error)"
   ```

3. **Check user exists**:
   ```bash
   node user-password-manager.js list
   ```

## Quick Start for test11@mcgill.ca

To quickly change the password for `test11@mcgill.ca`:

```bash
cd backend/scripts
node change-test11-password.js
```

This will generate a secure random password and update it for the user.

## Support

If you encounter issues:
1. Check the error messages carefully
2. Verify your environment variables
3. Test the connection to both Supabase and MongoDB
4. Check the Supabase dashboard for user status

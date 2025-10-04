# Password Change Instructions for test11@mcgill.ca

## Quick Start

To change the password for `test11@mcgill.ca`, run one of these commands:

### Option 1: Quick Script (Recommended)
```bash
cd backend/scripts
node change-test11-password.js
```
This will generate a secure random password automatically.

### Option 2: Specify Your Own Password
```bash
cd backend/scripts
node change-test11-password.js yournewpassword123
```

### Option 3: Use the General Manager
```bash
cd backend/scripts
node user-password-manager.js change test11@mcgill.ca yournewpassword123
```

## What Happens When You Run the Script

1. **Connects to Supabase**: Finds the user `test11@mcgill.ca`
2. **Updates Password**: Changes the password in Supabase authentication
3. **Updates MongoDB**: Updates the user's last login time in the database
4. **Confirms Success**: Shows the new password and confirmation

## Prerequisites

Make sure your `.env` file contains:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MONGO_URI=your_mongodb_connection_string
```

## Example Output

```
🚀 Changing password for test11@mcgill.ca
──────────────────────────────────────────────────
🔍 Looking for user with email: test11@mcgill.ca
✅ Found user in Supabase: test11@mcgill.ca (ID: abc123...)
📅 Created: 12/1/2024, 10:30:00 AM
📅 Last sign in: 12/1/2024, 2:45:00 PM
✅ Password updated successfully in Supabase
✅ Found user in MongoDB: Test User (Role: customer)
✅ Updated last login time in MongoDB

🎉 SUCCESS! Password changed successfully!
──────────────────────────────────────────────────
📧 Email: test11@mcgill.ca
🔑 New Password: Kx9#mP2$vL8q
⏰ Updated: 12/1/2024, 3:00:00 PM
──────────────────────────────────────────────────
✅ The user can now log in with the new password.
```

## Troubleshooting

### If the script fails:

1. **Check environment variables**: Make sure your `.env` file has the correct Supabase credentials
2. **Verify user exists**: The user must exist in Supabase
3. **Check permissions**: Ensure the service role key has admin permissions
4. **Test connection**: Run `node user-password-manager.js list` to see all users

### Common Error Messages:

- **"User not found"**: The email doesn't exist in Supabase
- **"Missing Supabase environment variables"**: Check your `.env` file
- **"MongoDB connection error"**: Check your MongoDB connection string

## Security Notes

- The new password will be displayed in the console
- Make sure to run this in a secure environment
- The service role key has admin privileges - keep it secure
- Consider changing the password again after the user logs in

## Alternative: Password Reset Email

If you prefer to let the user reset their own password:

```bash
cd backend/scripts
node user-password-manager.js reset test11@mcgill.ca
```

This will send a password reset email to the user instead of setting a new password directly.

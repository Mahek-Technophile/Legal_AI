# Supabase Google OAuth Setup Guide

## The Error You're Seeing

```
"code": 400,
"error_code": "validation_failed", 
"msg": "Unsupported provider: provider is not enabled"
```

This means Google OAuth is not enabled in your Supabase project settings.

## Step-by-Step Fix

### 1. Enable Google OAuth in Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Providers" tab

3. **Enable Google Provider**
   - Find "Google" in the list of providers
   - Toggle it to "Enabled"
   - You'll see a configuration form

### 2. Configure Google OAuth Credentials

You need to get credentials from Google Cloud Console:

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable:
     - Google+ API
     - Google Identity and Access Management (IAM) API

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in required fields:
     - App name: "LegalAI Pro"
     - User support email: your email
     - Developer contact: your email
   - Add your domain to "Authorized domains"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "LegalAI Pro Supabase"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://your-domain.com` (for production)
   - Authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - Replace `your-project-ref` with your actual Supabase project reference

### 3. Configure Supabase with Google Credentials

Back in your Supabase Dashboard:

1. **In the Google provider settings, enter:**
   - **Client ID**: Copy from Google Cloud Console
   - **Client Secret**: Copy from Google Cloud Console

2. **Configure Redirect URL**
   - The redirect URL should be: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy this URL and add it to your Google OAuth credentials

3. **Save the configuration**

### 4. Update Your Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Test the Configuration

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Try Google sign-in again**
   - The error should be resolved
   - You should see the Google OAuth popup/redirect

## Additional Configuration Options

### Email Templates (Optional)
- Go to Authentication > Email Templates
- Customize confirmation and recovery email templates

### URL Configuration
- Go to Authentication > URL Configuration  
- Set your site URL and redirect URLs

### Rate Limiting (Recommended)
- Go to Authentication > Rate Limits
- Configure appropriate limits to prevent abuse

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**
   - Check that redirect URIs in Google Console match Supabase callback URL
   - Ensure no trailing slashes

2. **"access_denied"**
   - Check OAuth consent screen configuration
   - Ensure app is not in testing mode with restricted users

3. **"invalid_client"**
   - Verify Client ID and Secret are correct
   - Check that credentials are for the right Google Cloud project

### Debug Steps:

1. **Check Supabase Logs**
   - Go to your Supabase Dashboard
   - Check "Logs" section for authentication errors

2. **Verify Provider Status**
   - Ensure Google provider shows as "Enabled" with green status

3. **Test with Different Browser**
   - Clear cookies and cache
   - Try incognito/private mode

## Security Best Practices

1. **Restrict OAuth Scopes**
   - Only request necessary permissions (email, profile)

2. **Configure Authorized Domains**
   - Add only your actual domains to prevent misuse

3. **Monitor Usage**
   - Check Google Cloud Console quotas and usage
   - Monitor Supabase authentication logs

4. **Regular Key Rotation**
   - Rotate OAuth credentials periodically
   - Update both Google Console and Supabase

## Production Deployment

When deploying to production:

1. **Update Authorized Origins**
   - Add your production domain to Google OAuth credentials
   - Update Supabase URL configuration

2. **Environment Variables**
   - Ensure production environment has correct Supabase credentials
   - Never expose credentials in client-side code

3. **SSL Certificate**
   - Ensure your domain has valid SSL certificate
   - Google OAuth requires HTTPS for production

## Need Help?

If you're still having issues:

1. **Check Supabase Documentation**
   - [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

2. **Supabase Community**
   - [Supabase Discord](https://discord.supabase.com/)
   - [GitHub Discussions](https://github.com/supabase/supabase/discussions)

3. **Google OAuth Documentation**
   - [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
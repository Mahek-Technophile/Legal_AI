# LegalAI Pro - Secure Authentication System

A comprehensive legal document analysis platform with secure Firebase Authentication and Google OAuth 2.0 integration.

## 🔐 Authentication Features

### Firebase Authentication
- **Google OAuth 2.0** with popup and redirect methods
- **Email/Password** authentication with strong password requirements
- **Password reset** functionality
- **Email verification** for new accounts
- **Account linking** to connect multiple auth providers
- **Session management** with secure token handling
- **Rate limiting** to prevent abuse
- **CSRF protection** for secure requests

### Security Features
- HTTP-only cookie storage for refresh tokens
- Automatic token refresh
- Comprehensive error handling
- Activity logging for audit trails
- Cross-browser compatibility
- Secure session persistence

## 🚀 Setup Instructions

### 1. Firebase Configuration

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication

2. **Configure Google OAuth**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable Google sign-in provider
   - Add your domain to authorized domains

3. **Get Firebase Config**
   - Go to Project Settings > General
   - Copy your Firebase configuration
   - Add to `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Google Cloud Console Setup

1. **Enable APIs**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Identity and Access Management (IAM) API
   - Enable Google+ API (if required)

2. **Configure OAuth Consent Screen**
   - Go to APIs & Services > OAuth consent screen
   - Configure your app information
   - Add authorized domains

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - Add authorized redirect URIs:
     - `http://localhost:5173/auth/callback`
     - `https://yourdomain.com/auth/callback`

### 3. Firestore Database Setup

1. **Create Firestore Database**
   - Go to Firebase Console > Firestore Database
   - Create database in production mode
   - Choose your region

2. **Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read their own activity logs
    match /activity_logs/{logId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
    }
  }
}
```

## 🔧 Implementation Details

### Authentication Flow

1. **Sign Up Process**
   - User enters email, password, and display name
   - Password strength validation
   - Account creation with email verification
   - Automatic profile creation in Firestore
   - Activity logging

2. **Sign In Process**
   - Email/password or Google OAuth
   - Session token generation
   - Secure token storage
   - Profile data retrieval
   - Redirect to dashboard

3. **Session Management**
   - Automatic token refresh
   - Session validation
   - Secure logout with token cleanup
   - Cross-tab synchronization

### Security Measures

- **Rate Limiting**: Prevents brute force attacks
- **CSRF Protection**: Validates request authenticity
- **Token Security**: HTTP-only cookies for sensitive data
- **Input Validation**: Comprehensive form validation
- **Error Handling**: User-friendly error messages
- **Activity Logging**: Audit trail for security monitoring

## 📱 Usage

### Basic Authentication
```typescript
import { useFirebaseAuth } from './contexts/FirebaseAuthContext';

function MyComponent() {
  const { 
    user, 
    signInWithEmail, 
    signInWithGooglePopup,
    signOut 
  } = useFirebaseAuth();

  const handleSignIn = async () => {
    const { user, error } = await signInWithEmail(email, password);
    if (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <div>
      {user ? (
        <p>Welcome, {user.displayName}!</p>
      ) : (
        <button onClick={handleSignIn}>Sign In</button>
      )}
    </div>
  );
}
```

### Protected Routes
```typescript
import { useFirebaseAuth } from './contexts/FirebaseAuthContext';

function ProtectedComponent() {
  const { user, loading } = useFirebaseAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return <div>Protected content</div>;
}
```

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **HTTPS Only**: Use HTTPS in production
3. **Token Expiration**: Configure appropriate token lifetimes
4. **Regular Updates**: Keep Firebase SDK updated
5. **Monitoring**: Monitor authentication events and errors
6. **Backup**: Regular database backups

## 🔍 Troubleshooting

### Common Issues

1. **Popup Blocked**: Use redirect method as fallback
2. **CORS Errors**: Check authorized domains in Firebase
3. **Token Expired**: Implement automatic refresh
4. **Network Errors**: Add retry logic with exponential backoff

### Debug Mode
Set `NODE_ENV=development` to enable debug logging.

## 📊 Monitoring

The system includes comprehensive logging for:
- Authentication events
- Error tracking
- User activity
- Security events
- Performance metrics

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting provider**
   - Update authorized domains in Firebase
   - Configure environment variables
   - Set up HTTPS

3. **Post-deployment checklist**
   - Test authentication flows
   - Verify redirect URIs
   - Check security rules
   - Monitor error logs


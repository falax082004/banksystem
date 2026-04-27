# Firebase Security Rules Update

## 🔥 Update Your Firebase Realtime Database Rules

To allow orders to be saved and retrieved, update your Firebase Realtime Database rules:

### Current Rules (if any):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Recommended Rules for Production:
```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid"
      }
    },
    "orders": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid"
      }
    }
  }
}
```

### For Testing (Temporary - Less Secure):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

## 📝 How to Update Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Realtime Database** → **Rules**
4. Replace the existing rules with the recommended rules above
5. Click **Publish**

## ✅ What This Enables:

- **User-specific orders** - Each user can only see their own orders
- **Secure data access** - Orders are protected by user authentication
- **Real-time updates** - Orders sync across devices for the same user
- **Data persistence** - Orders survive app restarts and logouts

## 🚀 Features Now Working:

✅ **Orders saved to Firebase** - No more disappearing orders  
✅ **User-specific data** - Each user sees only their orders  
✅ **Persistent storage** - Orders survive logout/login  
✅ **Real-time sync** - Orders update across devices  
✅ **Order tracking** - Full order history per user  

---

**Note:** Use the "For Testing" rules temporarily if you want to test quickly, but switch to the "Recommended Rules" for production use.

## One-time Legacy User Migration

If your old accounts are stored in `users/<username>` (with plaintext `password` in DB), migrate them once to Firebase Auth + `users/<uid>`.

1. Create a Firebase service account JSON (Firebase Console -> Project Settings -> Service Accounts).
2. Set environment variables in PowerShell:

```powershell
$env:SERVICE_ACCOUNT_PATH="C:\path\to\serviceAccountKey.json"
$env:FIREBASE_DATABASE_URL="https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app"
```

3. Run a dry run first:

```powershell
npm run migrate:legacy-users -- --dry-run
```

4. Run the actual migration:

```powershell
npm run migrate:legacy-users
```

5. Optional cleanup (delete old username keys after successful migration):

```powershell
npm run migrate:legacy-users -- --delete-legacy
```







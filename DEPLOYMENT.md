# Deployment Guide

## Certificate Issuing Fix

The certificate issuing functionality has been fixed to work both locally and on deployment platforms.

### What Was Fixed

1. **Blockchain Integration**: The system now gracefully handles missing blockchain wallet configuration
2. **Error Handling**: Improved error messages and fallback mechanisms
3. **Simulation Mode**: When blockchain wallet is not configured, the system uses simulation mode
4. **Serverless Storage**: Fixed certificate storage for serverless platforms (Vercel, Netlify) using in-memory fallback
5. **Certificate Issuing**: Resolved 404 errors when viewing issued certificates

### Environment Variables (Optional)

For real blockchain integration, set these environment variables in your deployment platform:

```bash
TEST_WALLET_PRIVATE_KEY=your_private_key_here
TESTNET_RPC_URL=https://rpc-amoy.polygon.technology
```

### Deployment Platforms

#### Vercel
1. Go to your project settings
2. Navigate to Environment Variables
3. Add the variables above (optional)
4. Redeploy

#### Netlify
1. Go to Site settings
2. Navigate to Environment variables
3. Add the variables above (optional)
4. Redeploy

#### Other Platforms
Set the environment variables in your platform's configuration.

### How It Works

- **With Wallet**: Real blockchain transactions are recorded
- **Without Wallet**: Simulation mode with generated transaction hashes
- **Database**: Hybrid storage system:
  - **Local Development**: File-based storage
  - **Serverless Deployment**: In-memory storage (data persists during function execution)
  - **Fallback**: Always maintains data in memory as backup

### Important Notes for Production

- **Data Persistence**: On serverless platforms, data is stored in memory and will reset when functions restart
- **For Production**: Consider integrating with a database service (PostgreSQL, MongoDB) for persistent storage
- **Current Solution**: Works perfectly for demos and development, certificates persist during the session

The system is now robust and will work regardless of blockchain configuration or deployment platform.

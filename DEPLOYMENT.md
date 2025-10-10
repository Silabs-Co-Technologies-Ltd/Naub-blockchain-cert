# Deployment Guide

## Certificate Issuing Fix

The certificate issuing functionality has been fixed to work both locally and on deployment platforms.

### What Was Fixed

1. **Blockchain Integration**: The system now gracefully handles missing blockchain wallet configuration
2. **Error Handling**: Improved error messages and fallback mechanisms
3. **Simulation Mode**: When blockchain wallet is not configured, the system uses simulation mode

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
- **Database**: Always saves to file-based storage (works in all environments)

The system is now robust and will work regardless of blockchain configuration.

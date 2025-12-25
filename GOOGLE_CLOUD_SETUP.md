# Google Cloud Vision API Setup Guide

This guide will help you set up Google Cloud Vision API for the AI food validation feature in the Yondly app.

## Overview

The food validation feature uses Google Cloud Vision API to automatically detect and validate food items in donation photos. It ensures only non-perishable, packaged food items are accepted.

## Prerequisites

- A Google account
- A credit card (for Google Cloud - free tier available)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `yondly-food-validation` (or your preferred name)
5. Click "Create"

### 2. Enable the Vision API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Cloud Vision API"
3. Click on "Cloud Vision API"
4. Click "Enable"

### 3. Create Service Account Credentials

#### Option A: API Key (Simpler, Recommended for Development)

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. (Optional but recommended) Click "Restrict Key":
   - Under "API restrictions", select "Restrict key"
   - Select "Cloud Vision API" from the dropdown
   - Click "Save"

**Add to your backend `.env` file:**
```bash
GOOGLE_CLOUD_VISION_API_KEY=your-api-key-here
```

#### Option B: Service Account (More Secure, Recommended for Production)

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "Service Account"
3. Enter service account details:
   - Name: `yondly-vision-service`
   - Description: `Service account for Vision API`
4. Click "Create and Continue"
5. Grant role: **Cloud Vision API User**
6. Click "Continue" then "Done"
7. Click on the newly created service account
8. Go to the "Keys" tab
9. Click "Add Key" > "Create new key"
10. Choose "JSON" format
11. Click "Create" - a JSON file will be downloaded

**Add to your backend:**
1. Save the JSON file as `google-credentials.json` in the `backend/` directory
2. Add to `.gitignore`:
   ```
   google-credentials.json
   ```
3. Add to your backend `.env` file:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
   ```

### 4. Enable Billing (Required)

> **Note**: Google Cloud requires billing to be enabled, but Vision API has a generous free tier:
> - First 1,000 units/month: FREE
> - After that: $1.50 per 1,000 units

1. Go to **Billing** in the Google Cloud Console
2. Click "Link a billing account" or "Create billing account"
3. Follow the prompts to add your payment method
4. Link the billing account to your project

### 5. Verify Setup

After setting up credentials, restart your backend server:

```bash
cd backend
source venv/bin/activate  # or your virtual environment
python main.py
```

Check the logs for:
```
Google Cloud Vision client initialized with API Key
```
or
```
Google Cloud Vision client initialized with Service Account
```

### 6. Test the Feature

1. Start the app
2. Go to the Food tab
3. Try to post a food donation with a photo
4. The system will automatically validate the image

**Valid items** (should be accepted):
- Packaged pasta, rice, cereal
- Canned goods (vegetables, fruits, fish)
- Sealed snacks, cookies, crackers
- Bottled/jarred items (oil, sauce, condiments)

**Invalid items** (should be rejected):
- Fresh produce (fruits, vegetables)
- Homemade meals
- Opened/unsealed items
- Perishable items (dairy, meat, bread)

## Troubleshooting

### "Vision API not available, skipping validation"
- The API credentials are not configured
- Check your `.env` file has the correct key/path
- Restart the backend server

### "Failed to initialize Vision client"
- For API Key: Verify the key is correct and Vision API is enabled
- For Service Account: Verify the JSON file path is correct and the file exists

### "Quota exceeded" error
- You've exceeded the free tier (1,000 requests/month)
- Check your usage in Google Cloud Console > Vision API > Quotas
- Consider upgrading or optimizing usage

### Images always rejected
- The Vision API might not be detecting the items correctly
- Try with clearer photos showing packaging/labels
- Check the backend logs to see what labels were detected

## Cost Management

To avoid unexpected costs:

1. Set up budget alerts:
   - Go to **Billing** > **Budgets & alerts**
   - Create a budget (e.g., $5/month)
   - Set alert thresholds (50%, 90%, 100%)

2. Monitor usage:
   - Go to **Vision API** > **Metrics**
   - Check daily/monthly request counts

3. Disable the API when not needed:
   - Go to **APIs & Services** > **Library**
   - Find "Cloud Vision API"
   - Click "Disable"

## Security Best Practices

1. **Never commit credentials to Git**
   - Add `google-credentials.json` to `.gitignore`
   - Add `.env` to `.gitignore`

2. **Restrict API keys**
   - Limit to Vision API only
   - Add application restrictions if possible

3. **Use environment variables**
   - Never hardcode credentials in code
   - Use `.env` files for local development
   - Use secure secret management for production

## Next Steps

Once the API is set up:

1. ✅ Test with various food images
2. ✅ Monitor API usage and costs
3. ✅ Adjust validation logic if needed (in `backend/food_validator.py`)
4. ✅ Consider adding user feedback for rejected images

## Support

- [Google Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [Vision API Pricing](https://cloud.google.com/vision/pricing)
- [Python Client Library](https://googleapis.dev/python/vision/latest/index.html)

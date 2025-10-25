# Fintoosh Brand Fonts

This directory contains the brand fonts for Fintoosh. Download the required font files from Google Fonts and place them here.

## Required Fonts

### Inter (Primary Font - Modern, Friendly, Readable)
**✅ RECOMMENDED METHOD: Google Fonts Download**
1. Visit: https://fonts.google.com/specimen/Inter
2. Click "Download family" (top right)
3. Extract the ZIP file
4. Copy these files to this folder:
   - `Inter-Regular.ttf`
   - `Inter-Medium.ttf`
   - `Inter-SemiBold.ttf`
   - `Inter-Bold.ttf`

### Nunito (Secondary Font - Warm, Approachable)
**✅ RECOMMENDED METHOD: Google Fonts Download**
1. Visit: https://fonts.google.com/specimen/Nunito
2. Click "Download family" (top right)
3. Extract the ZIP file
4. Copy these files to this folder:
   - `Nunito-Regular.ttf`
   - `Nunito-Medium.ttf`
   - `Nunito-SemiBold.ttf`
   - `Nunito-Bold.ttf`

### Fredoka (Display Font - Fun, Celebratory)
**✅ RECOMMENDED METHOD: Google Fonts Download**
1. Visit: https://fonts.google.com/specimen/Fredoka
2. Click "Download family" (top right)
3. Extract the ZIP file
4. Copy these files to this folder:
   - `Fredoka-Regular.ttf`
   - `Fredoka-Medium.ttf`
   - `Fredoka-Bold.ttf`

## Download Instructions

### Method 1: Direct Download (Recommended)
1. Click each download link above (they're .woff2 files but work as .ttf)
2. Save each file with the exact filename shown (e.g., `Inter-Regular.ttf`)
3. Place all files directly in this `assets/fonts/` directory

### Method 2: Google Fonts Download
1. Visit each Google Fonts link (Alternative links above)
2. Click the "Download family" button
3. Extract the ZIP file
4. Copy only the required .ttf files to this `assets/fonts/` directory:
   - From Inter: `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`
   - From Nunito: `Nunito-Regular.ttf`, `Nunito-Medium.ttf`, `Nunito-SemiBold.ttf`, `Nunito-Bold.ttf`
   - From Fredoka: `Fredoka-Regular.ttf`, `Fredoka-Medium.ttf`, `Fredoka-Bold.ttf`

### Method 3: CDN Download (Advanced)
If you prefer to download via command line:
```bash
# Create fonts directory if not exists
mkdir -p assets/fonts

# Download Inter fonts
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-Regular.ttf
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-Medium.ttf
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-SemiBold.ttf
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-Bold.ttf

# Download Nunito fonts
curl -L "https://fonts.gstatic.com/s/nunito/v25/XRXV3I6Li01BKofINeaB.woff2" -o assets/fonts/Nunito-Regular.ttf
curl -L "https://fonts.gstatic.com/s/nunito/v25/XRXW3I6Li01BKofA6sKUb.woff2" -o assets/fonts/Nunito-Medium.ttf
curl -L "https://fonts.gstatic.com/s/nunito/v25/XRXW3I6Li01BKofAjsOUb.woff2" -o assets/fonts/Nunito-SemiBold.ttf
curl -L "https://fonts.gstatic.com/s/nunito/v25/XRXW3I6Li01BKofAksCUb.woff2" -o assets/fonts/Nunito-Bold.ttf

# Download Fredoka fonts
curl -L "https://fonts.gstatic.com/s/fredoka/v5/X7nP4bKf6EGKegLs.woff2" -o assets/fonts/Fredoka-Regular.ttf
curl -L "https://fonts.gstatic.com/s/fredoka/v5/X7nQ4bKf6EGKegLsBII.woff2" -o assets/fonts/Fredoka-Medium.ttf
curl -L "https://fonts.gstatic.com/s/fredoka/v5/X7nU4bKf6EGKegLsC4g.woff2" -o assets/fonts/Fredoka-Bold.ttf
```

## Verification

After downloading, verify you have these 11 files in `assets/fonts/`:
```
Inter-Regular.ttf
Inter-Medium.ttf
Inter-SemiBold.ttf
Inter-Bold.ttf
Nunito-Regular.ttf
Nunito-Medium.ttf
Nunito-SemiBold.ttf
Nunito-Bold.ttf
Fredoka-Regular.ttf
Fredoka-Medium.ttf
Fredoka-Bold.ttf
```

## Font Usage in Code

The fonts are configured in `constants/theme.ts` and loaded via `app.json`. They will be automatically available throughout the app using the `FONTS` object:

```javascript
import { FONTS } from '@/constants/theme';

// Usage examples
const primaryText = { fontFamily: FONTS.primary.regular };
const headingText = { fontFamily: FONTS.display.bold };
const educationalText = { fontFamily: FONTS.secondary.medium };
```

## Fallback Fonts

The theme configuration includes web fallbacks to system fonts for better performance and compatibility:

- **Web**: Uses system fonts with Inter as primary fallback
- **iOS**: Uses system fonts where available
- **Android**: Uses the loaded font files

## Font Loading

Fonts are automatically loaded when the app starts via the `expo-font` plugin configuration in `app.json`. No additional loading code is required in the app.

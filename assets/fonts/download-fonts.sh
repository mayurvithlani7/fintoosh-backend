#!/bin/bash

# Fintoosh Brand Fonts Download Script
# This script downloads all required brand fonts for the Fintoosh app

echo "🎨 Downloading Fintoosh Brand Fonts..."
echo "====================================="

# Create fonts directory if it doesn't exist
mkdir -p assets/fonts

echo "📥 Downloading Inter fonts..."
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-Regular.ttf
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-Medium.ttf
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-SemiBold.ttf
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-Bold.ttf

echo "📥 Downloading Nunito fonts..."
curl -L "https://fonts.gstatic.com/s/nunito/v25/XRXV3I6Li01BKofINeaB.woff2" -o assets/fonts/Nunito-Regular.ttf
curl -L "https://fonts.gstatic.com/s/nunito/v25/XRXW3I6Li01BKofA6sKUb.woff2" -o assets/fonts/Nunito-Medium.ttf
curl -L "https://fonts.gstatic.com/s/nunito/v25/XRXW3I6Li01BKofAjsOUb.woff2" -o assets/fonts/Nunito-SemiBold.ttf
curl -L "https://fonts.gstatic.com/s/nunito/v25/XRXW3I6Li01BKofAksCUb.woff2" -o assets/fonts/Nunito-Bold.ttf

echo "📥 Downloading Fredoka fonts..."
curl -L "https://fonts.gstatic.com/s/fredoka/v5/X7nP4bKf6EGKegLs.woff2" -o assets/fonts/Fredoka-Regular.ttf
curl -L "https://fonts.gstatic.com/s/fredoka/v5/X7nQ4bKf6EGKegLsBII.woff2" -o assets/fonts/Fredoka-Medium.ttf
curl -L "https://fonts.gstatic.com/s/fredoka/v5/X7nU4bKf6EGKegLsC4g.woff2" -o assets/fonts/Fredoka-Bold.ttf

echo ""
echo "✅ Font download complete!"
echo "=========================="
echo "Downloaded files:"
ls -la assets/fonts/

echo ""
echo "📋 Verification:"
echo "Should see 11 font files:"
echo "- Inter-Regular.ttf"
echo "- Inter-Medium.ttf"
echo "- Inter-SemiBold.ttf"
echo "- Inter-Bold.ttf"
echo "- Nunito-Regular.ttf"
echo "- Nunito-Medium.ttf"
echo "- Nunito-SemiBold.ttf"
echo "- Nunito-Bold.ttf"
echo "- Fredoka-Regular.ttf"
echo "- Fredoka-Medium.ttf"
echo "- Fredoka-Bold.ttf"

echo ""
echo "🎯 Next steps:"
echo "1. Run the app to test the fonts"
echo "2. Check that brand colors are displaying correctly"
echo "3. Update marketing materials with the same fonts and colors"

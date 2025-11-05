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
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuL2fAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-Light.ttf
curl -L "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuBWfAZ9hiJ-Ek-_EeA.woff2" -o assets/fonts/Inter-ExtraBold.ttf

echo "📥 Downloading SF Pro Display fonts..."
curl -L "https://fonts.gstatic.com/s/sfprodisplay/v2/Hg45b2AR9WOWdg4byWQpQ2DmS9z8KjK8.woff2" -o assets/fonts/SF-Pro-Display-Regular.ttf
curl -L "https://fonts.gstatic.com/s/sfprodisplay/v2/Hg45b2AR9WOWdg4byWQpQ2DmS9z8KjK8.woff2" -o assets/fonts/SF-Pro-Display-Medium.ttf
curl -L "https://fonts.gstatic.com/s/sfprodisplay/v2/Hg45b2AR9WOWdg4byWQpQ2DmS9z8KjK8.woff2" -o assets/fonts/SF-Pro-Display-SemiBold.ttf
curl -L "https://fonts.gstatic.com/s/sfprodisplay/v2/Hg45b2AR9WOWdg4byWQpQ2DmS9z8KjK8.woff2" -o assets/fonts/SF-Pro-Display-Bold.ttf

echo "📥 Downloading Poppins fonts..."
curl -L "https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrFJA.woff2" -o assets/fonts/Poppins-Light.ttf
curl -L "https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrFJAN.woff2" -o assets/fonts/Poppins-Regular.ttf
curl -L "https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrFJAO.woff2" -o assets/fonts/Poppins-Medium.ttf
curl -L "https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrFJAM.woff2" -o assets/fonts/Poppins-SemiBold.ttf
curl -L "https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrFJAD.woff2" -o assets/fonts/Poppins-Bold.ttf

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
echo "Should see 22 font files:"
echo ""
echo "Inter Fonts (6):"
echo "- Inter-Light.ttf"
echo "- Inter-Regular.ttf"
echo "- Inter-Medium.ttf"
echo "- Inter-SemiBold.ttf"
echo "- Inter-Bold.ttf"
echo "- Inter-ExtraBold.ttf"
echo ""
echo "SF Pro Display Fonts (4):"
echo "- SF-Pro-Display-Regular.ttf"
echo "- SF-Pro-Display-Medium.ttf"
echo "- SF-Pro-Display-SemiBold.ttf"
echo "- SF-Pro-Display-Bold.ttf"
echo ""
echo "Poppins Fonts (5):"
echo "- Poppins-Light.ttf"
echo "- Poppins-Regular.ttf"
echo "- Poppins-Medium.ttf"
echo "- Poppins-SemiBold.ttf"
echo "- Poppins-Bold.ttf"
echo ""
echo "Nunito Fonts (4):"
echo "- Nunito-Regular.ttf"
echo "- Nunito-Medium.ttf"
echo "- Nunito-SemiBold.ttf"
echo "- Nunito-Bold.ttf"
echo ""
echo "Fredoka Fonts (3):"
echo "- Fredoka-Regular.ttf"
echo "- Fredoka-Medium.ttf"
echo "- Fredoka-Bold.ttf"

echo ""
echo "🎯 Next steps:"
echo "1. Run the app to test the fonts"
echo "2. Check that brand colors are displaying correctly"
echo "3. Update marketing materials with the same fonts and colors"

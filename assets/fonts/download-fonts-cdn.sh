#!/bin/bash

# Fintoosh Brand Fonts Download Script - CDN VERSION
# Downloads proper TTF font files from CDNJS (Cloudflare)

echo "🎨 Downloading Fintoosh Brand Fonts from CDNJS..."
echo "================================================"

# Create fonts directory if it doesn't exist
mkdir -p assets/fonts

echo "📥 Downloading Inter fonts (TTF)..."
curl -L "https://cdnjs.cloudflare.com/ajax/libs/inter/4.0.0/Inter-Light.ttf" -o assets/fonts/Inter-Light.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/inter/4.0.0/Inter-Regular.ttf" -o assets/fonts/Inter-Regular.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/inter/4.0.0/Inter-Medium.ttf" -o assets/fonts/Inter-Medium.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/inter/4.0.0/Inter-SemiBold.ttf" -o assets/fonts/Inter-SemiBold.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/inter/4.0.0/Inter-Bold.ttf" -o assets/fonts/Inter-Bold.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/inter/4.0.0/Inter-ExtraBold.ttf" -o assets/fonts/Inter-ExtraBold.ttf

echo "📥 Downloading Poppins fonts (TTF)..."
curl -L "https://cdnjs.cloudflare.com/ajax/libs/poppins/4.0.0/Poppins-Light.ttf" -o assets/fonts/Poppins-Light.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/poppins/4.0.0/Poppins-Regular.ttf" -o assets/fonts/Poppins-Regular.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/poppins/4.0.0/Poppins-Medium.ttf" -o assets/fonts/Poppins-Medium.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/poppins/4.0.0/Poppins-SemiBold.ttf" -o assets/fonts/Poppins-SemiBold.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/poppins/4.0.0/Poppins-Bold.ttf" -o assets/fonts/Poppins-Bold.ttf

echo "📥 Downloading Nunito fonts (TTF)..."
curl -L "https://cdnjs.cloudflare.com/ajax/libs/nunito/2.0.0/Nunito-Regular.ttf" -o assets/fonts/Nunito-Regular.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/nunito/2.0.0/Nunito-Medium.ttf" -o assets/fonts/Nunito-Medium.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/nunito/2.0.0/Nunito-SemiBold.ttf" -o assets/fonts/Nunito-SemiBold.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/nunito/2.0.0/Nunito-Bold.ttf" -o assets/fonts/Nunito-Bold.ttf

echo "📥 Downloading Fredoka fonts (TTF)..."
curl -L "https://cdnjs.cloudflare.com/ajax/libs/fredoka/2.0.0/Fredoka-Regular.ttf" -o assets/fonts/Fredoka-Regular.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/fredoka/2.0.0/Fredoka-Medium.ttf" -o assets/fonts/Fredoka-Medium.ttf
curl -L "https://cdnjs.cloudflare.com/ajax/libs/fredoka/2.0.0/Fredoka-Bold.ttf" -o assets/fonts/Fredoka-Bold.ttf

echo "📝 Note: SF Pro Display fonts require Apple's licensing and are not available for download."
echo "      These will use system font fallbacks in the app configuration."

echo ""
echo "✅ Font download complete!"
echo "=========================="
echo "Downloaded TTF files:"
ls -la assets/fonts/*.ttf 2>/dev/null || echo "No TTF files found"

echo ""
echo "🔍 Verification:"
echo "Checking file types..."
if command -v file >/dev/null 2>&1; then
    file assets/fonts/*.ttf 2>/dev/null | head -5
else
    echo "file command not available, checking file sizes instead:"
    ls -lh assets/fonts/*.ttf 2>/dev/null || echo "No TTF files found"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Clear Expo cache: npx expo r -c"
echo "2. Run the app to test font loading"
echo "3. If fonts still don't work, check the URLs and try manual download"

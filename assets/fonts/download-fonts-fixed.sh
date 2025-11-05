#!/bin/bash

# Fintoosh Brand Fonts Download Script - FIXED VERSION
# Downloads proper TTF font files instead of WOFF2

echo "🎨 Downloading Fintoosh Brand Fonts (TTF Format)..."
echo "=================================================="

# Create fonts directory if it doesn't exist
mkdir -p assets/fonts

echo "📥 Downloading Inter fonts (TTF)..."
# Using a reliable CDN that provides TTF files
curl -L "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Light.ttf" -o assets/fonts/Inter-Light.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf" -o assets/fonts/Inter-Regular.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Medium.ttf" -o assets/fonts/Inter-Medium.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/inter/Inter-SemiBold.ttf" -o assets/fonts/Inter-SemiBold.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf" -o assets/fonts/Inter-Bold.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/inter/Inter-ExtraBold.ttf" -o assets/fonts/Inter-ExtraBold.ttf

echo "📥 Downloading Poppins fonts (TTF)..."
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Light.ttf" -o assets/fonts/Poppins-Light.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf" -o assets/fonts/Poppins-Regular.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Medium.ttf" -o assets/fonts/Poppins-Medium.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-SemiBold.ttf" -o assets/fonts/Poppins-SemiBold.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf" -o assets/fonts/Poppins-Bold.ttf

echo "📥 Downloading Nunito fonts (TTF)..."
curl -L "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-Regular.ttf" -o assets/fonts/Nunito-Regular.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-Medium.ttf" -o assets/fonts/Nunito-Medium.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-SemiBold.ttf" -o assets/fonts/Nunito-SemiBold.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-Bold.ttf" -o assets/fonts/Nunito-Bold.ttf

echo "📥 Downloading Fredoka fonts (TTF)..."
curl -L "https://github.com/google/fonts/raw/main/ofl/fredoka/Fredoka-Regular.ttf" -o assets/fonts/Fredoka-Regular.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/fredoka/Fredoka-Medium.ttf" -o assets/fonts/Fredoka-Medium.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/fredoka/Fredoka-Bold.ttf" -o assets/fonts/Fredoka-Bold.ttf

echo "📥 Downloading SF Pro Display fonts..."
# SF Pro Display is Apple's proprietary font, using open alternatives
# For now, we'll use a similar system font approach or find open alternatives
echo "Note: SF Pro Display requires special licensing. Using system fonts as fallback."

echo ""
echo "✅ Font download complete!"
echo "=========================="
echo "Downloaded TTF files:"
ls -la assets/fonts/*.ttf

echo ""
echo "🔍 Verification:"
echo "Checking file types..."
file assets/fonts/*.ttf | head -10

echo ""
echo "🎯 Next steps:"
echo "1. Clear Expo cache: npx expo r -c"
echo "2. Run the app to test font loading"
echo "3. Check console for any remaining font errors"

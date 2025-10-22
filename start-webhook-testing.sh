#!/bin/bash

# ElevenLabs Webhook Testing Script
# This script starts ngrok and provides the webhook URL for ElevenLabs configuration

echo "🚀 ElevenLabs Webhook Testing Setup"
echo "===================================="
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000/api/webhooks/elevenlabs > /dev/null 2>&1; then
    echo "⚠️  WARNING: Dev server not responding on port 3000"
    echo "   Please make sure 'npm run dev' is running in another terminal"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit..."
fi

echo "✅ Starting ngrok tunnel to localhost:3000..."
echo ""
echo "📝 INSTRUCTIONS:"
echo "   1. ngrok will start and show you a public URL"
echo "   2. Copy the HTTPS URL (it will look like: https://abc123.ngrok.io)"
echo "   3. Your webhook URL will be: [ngrok-url]/api/webhooks/elevenlabs"
echo "   4. Configure this URL in your ElevenLabs dashboard"
echo "   5. Make a test call to your ElevenLabs agent"
echo "   6. Watch the logs below for incoming webhooks"
echo ""
echo "💡 TIP: Open http://127.0.0.1:4040 in your browser to see webhook traffic"
echo ""
echo "Press Ctrl+C to stop ngrok when done testing"
echo ""
echo "===================================="
echo ""

# Start ngrok
~/bin/ngrok http 3000

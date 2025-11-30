#!/bin/bash

# Script to add a sample video for testing the interactive video meme

echo "📹 Video Setup Instructions"
echo "=========================="
echo ""
echo "To add your video meme:"
echo "1. Place your MP4 video file in: frontend/public/videos/"
echo "2. Name it: agent-meme.mp4"
echo "3. Or update the videoSrc prop in LandingPage.tsx"
echo ""
echo "Recommended video specs:"
echo "- Format: MP4 (H.264 codec)"
echo "- Resolution: 1280x720 or 1920x1080"
echo "- Duration: 5-15 seconds (perfect for meme)"
echo "- File size: < 5MB for fast loading"
echo ""
echo "Example command to place your video:"
echo "cp ~/Downloads/my-meme-video.mp4 frontend/public/videos/agent-meme.mp4"
echo ""
echo "✨ The interactive slider will scrub through the video as you drag!"

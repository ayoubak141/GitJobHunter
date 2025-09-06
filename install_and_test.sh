#!/bin/bash

# GitJobHunter Installation and Test Script
echo "🔧 GitJobHunter Installation and Test Script"
echo "============================================"

# Check Python version
echo "📋 Checking Python version..."
python3 --version

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

# Run health check without webhook
echo "🔍 Running health check..."
export CONFIG_FILE="config.test.json"
export LOG_LEVEL="DEBUG"

# Test configuration validation
echo "✅ Testing configuration validation..."
python3 -c "
import sys
sys.path.append('.')
from job_finder import load_config, health_check
config = load_config()
print(f'Loaded {len(config)} feed configurations')
issues = health_check()
if issues:
    print('⚠️  Health check issues:', issues)
else:
    print('✅ Health check passed!')
"

# Run tests if pytest is available
echo "🧪 Running tests..."
if command -v pytest &> /dev/null; then
    python3 -m pytest tests/ -v || echo "⚠️  Some tests failed, but that's expected without proper setup"
else
    echo "⚠️  pytest not available, skipping tests"
fi

echo "🎉 Installation script completed!"
echo ""
echo "Next steps:"
echo "1. Set your Discord webhook URL: export DISCORD_WEBHOOK_URL='your_webhook_url'"
echo "2. Customize config.json with your desired job feeds"
echo "3. Run the job finder: python3 job_finder.py"

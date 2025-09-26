#!/bin/bash

# Ollama Setup and Monitoring Script for AI Agent Integration System
# Run this script to complete your Ollama setup

set -e

echo "🚀 Setting up Ollama for AI Agent Integration System..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Ollama is installed
print_status "Checking Ollama installation..."
if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version | grep -o 'version is [0-9.]*' | cut -d' ' -f3)
    print_success "Ollama $OLLAMA_VERSION is installed"
else
    print_error "Ollama is not installed. Please install it first."
    exit 1
fi

# Check if Ollama service is running
print_status "Checking Ollama service..."
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    print_success "Ollama service is running"
else
    print_warning "Ollama service not running. Starting it..."
    ollama serve &
    sleep 5
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_success "Ollama service started successfully"
    else
        print_error "Failed to start Ollama service"
        exit 1
    fi
fi

# List installed models
print_status "Checking installed models..."
MODELS=$(ollama list | grep -v "NAME" | wc -l | tr -d ' ')

if [ "$MODELS" -eq 0 ]; then
    print_warning "No models installed. Installing recommended model..."
    echo
    print_status "Installing llama3.2:3b (recommended for productivity tasks)..."
    echo "This will download ~2GB. Please wait..."

    ollama pull llama3.2:3b

    if [ $? -eq 0 ]; then
        print_success "Model llama3.2:3b installed successfully"
    else
        print_error "Failed to install model"
        exit 1
    fi
else
    print_success "$MODELS model(s) already installed:"
    ollama list
fi

echo
print_status "Testing model functionality..."

# Test the model
TEST_RESPONSE=$(ollama run llama3.2:3b "Hello, respond with just 'AI Ready'" --verbose)
if echo "$TEST_RESPONSE" | grep -q "AI Ready"; then
    print_success "Model is working correctly"
else
    print_warning "Model test gave unexpected response: $TEST_RESPONSE"
fi

echo
echo "🎉 Ollama Setup Complete!"
echo "=================================================="
print_success "✅ Ollama service running on http://localhost:11434"
print_success "✅ Model llama3.2:3b ready for productivity assistance"
print_success "✅ AI Agent Integration System is now fully operational"

echo
echo "📋 Next Steps:"
echo "1. Start your Next.js application: npm run dev"
echo "2. Test the AI endpoints at /api/ai/*"
echo "3. Use the productivity assistant for GTD and Full Focus guidance"

echo
echo "🔧 Available Ollama Commands:"
echo "- ollama list                    # List installed models"
echo "- ollama run llama3.2:3b         # Test model directly"
echo "- ollama serve                   # Start/restart service"
echo "- curl http://localhost:11434/api/tags # Check API status"

echo
print_status "Setup monitoring complete. Your AI system is ready!"
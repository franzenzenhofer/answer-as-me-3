#!/bin/bash
# Helper script to deploy from dist directory

cd /Users/franzenzenhofer/dev/answer-as-me-3/dist

# Create version
echo "Creating version..."
clasp version "Version 1.0.0 - Initial Hello World"

# Deploy
echo "Creating deployment..."
clasp deploy --description "v1.0.0 - Answer As Me 3 - Hello World"

# Show deployments
echo "Current deployments:"
clasp deployments
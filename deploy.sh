#!/bin/bash
# Legacy script - redirects to modern TypeScript deployment

echo "🚀 Redirecting to modern TypeScript deployment system..."
echo ""

# Pass all arguments to the TypeScript deploy script
exec tsx scripts/deploy.ts "$@"
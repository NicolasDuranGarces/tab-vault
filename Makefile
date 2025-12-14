# ============================================================================
# Tab Vault - Chrome Extension Makefile
# ============================================================================
# Powerful session management for Chrome
# https://github.com/NicolasDuranGarces/tab-vault
# ============================================================================

.PHONY: all install dev build clean lint lint-fix type-check test test-coverage help package

# Default target
all: install build

# ============================================================================
# Installation
# ============================================================================

## Install all dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed successfully!"

## Install production dependencies only
install-prod:
	@echo "📦 Installing production dependencies..."
	npm install --production
	@echo "✅ Production dependencies installed!"

# ============================================================================
# Development
# ============================================================================

## Start development mode with hot reload
dev:
	@echo "🔧 Starting development mode..."
	npm run dev

## Build for production
build:
	@echo "🏗️  Building for production..."
	npm run build
	@echo "✅ Build complete! Extension ready in ./dist"

## Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	npm run clean
	rm -rf node_modules/.cache
	@echo "✅ Clean complete!"

## Deep clean (removes node_modules)
clean-all: clean
	@echo "🧹 Removing node_modules..."
	rm -rf node_modules
	@echo "✅ Deep clean complete!"

# ============================================================================
# Code Quality
# ============================================================================

## Run ESLint
lint:
	@echo "🔍 Running ESLint..."
	npm run lint

## Run ESLint with auto-fix
lint-fix:
	@echo "🔧 Running ESLint with auto-fix..."
	npm run lint:fix

## Run TypeScript type checking
type-check:
	@echo "📝 Running TypeScript type check..."
	npm run type-check

## Run all code quality checks
check: lint type-check
	@echo "✅ All checks passed!"

# ============================================================================
# Testing
# ============================================================================

## Run tests
test:
	@echo "🧪 Running tests..."
	npm run test

## Run tests with coverage
test-coverage:
	@echo "🧪 Running tests with coverage..."
	npm run test:coverage

# ============================================================================
# Packaging
# ============================================================================

## Create a packaged extension (zip file)
package: build
	@echo "📦 Creating extension package..."
	@mkdir -p releases
	@cd dist && zip -r ../releases/tab-vault-$(shell node -p "require('./package.json').version").zip .
	@echo "✅ Package created: releases/tab-vault-$(shell node -p "require('./package.json').version").zip"

# ============================================================================
# Development Utilities
# ============================================================================

## Watch for changes and rebuild
watch: dev

## Full rebuild from scratch
rebuild: clean-all install build

## Quick development setup
setup: install dev

# ============================================================================
# Information
# ============================================================================

## Show current version
version:
	@node -p "require('./package.json').version"

## Show project info
info:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Tab Vault - Chrome Extension"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Version:     $(shell node -p "require('./package.json').version")"
	@echo "  Description: $(shell node -p "require('./package.json').description")"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

## Display help
help:
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Tab Vault - Available Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "  📦 INSTALLATION"
	@echo "     make install        Install all dependencies"
	@echo "     make install-prod   Install production dependencies only"
	@echo ""
	@echo "  🔧 DEVELOPMENT"
	@echo "     make dev            Start development mode with hot reload"
	@echo "     make build          Build for production"
	@echo "     make watch          Alias for dev (watch mode)"
	@echo "     make setup          Quick development setup"
	@echo ""
	@echo "  🧹 CLEANING"
	@echo "     make clean          Clean build artifacts"
	@echo "     make clean-all      Deep clean (removes node_modules)"
	@echo "     make rebuild        Full rebuild from scratch"
	@echo ""
	@echo "  🔍 CODE QUALITY"
	@echo "     make lint           Run ESLint"
	@echo "     make lint-fix       Run ESLint with auto-fix"
	@echo "     make type-check     Run TypeScript type checking"
	@echo "     make check          Run all code quality checks"
	@echo ""
	@echo "  🧪 TESTING"
	@echo "     make test           Run tests"
	@echo "     make test-coverage  Run tests with coverage"
	@echo ""
	@echo "  📦 PACKAGING"
	@echo "     make package        Create packaged extension (zip)"
	@echo ""
	@echo "  ℹ️  INFORMATION"
	@echo "     make version        Show current version"
	@echo "     make info           Show project info"
	@echo "     make help           Display this help message"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""

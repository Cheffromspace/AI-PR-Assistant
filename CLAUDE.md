# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Setup: `npm ci`
- Lint: `npm run lint`
- Test: `npm test`

## Code Style Guidelines
- Use consistent indentation (2 spaces)
- Prefer explicit error handling with try/catch blocks
- Follow Node.js async/await patterns for asynchronous operations
- Variable names: camelCase for variables, PascalCase for classes
- Use descriptive variable names that reflect their purpose
- Maintain proper JSDoc comments for functions
- When accessing GitHub API, use proper error handling and authentication
- When processing webhooks, validate inputs before processing
- Prefer TypeScript interfaces for structured data
- Format JSON responses with proper indentation
- For PR reviews, focus on security, performance, and maintainability
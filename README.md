# PR Review Webhook

A GitHub Actions workflow that uses Claude AI for automated pull request reviews.

## What This Does

This workflow:
1. Runs your standard CI pipeline (tests, linting, etc.)
2. Collects detailed information about the pull request
3. Uses Anthropic's Claude via MCP to perform an automated review
4. Posts review comments back to GitHub

## Setup Instructions

### 1. Add the Workflow File

Copy the example workflow file to your repository:

```
.github/workflows/ci-pipeline-mcp.yml
```

### 2. Configure Secrets

You'll need to add the following to your repository:

#### Repository Secrets
- `ANTHROPIC_API_KEY`: Your Anthropic API key for accessing Claude

### 3. Install Dependencies

The MCP server requires these Node.js dependencies:
- @anthropic/mcp-server
- @anthropic/sdk
- @octokit/rest

These are defined in the `src/package.json` file.

### 4. Customize the Workflow (Optional)

You can modify the example workflow to:
- Change the trigger branches
- Add additional CI steps specific to your project
- Adjust the Node.js versions used

## How It Works

The system consists of two main components:

1. **MCP Server (`src/mcp-server.js`)**: Provides tools for Claude to interact with GitHub
   - Allows fetching files from the repository
   - Enables adding comments to PRs
   - Supports approving PRs or requesting changes

2. **MCP Client (`src/mcp-client.js`)**: Manages Claude API calls
   - Configures the Claude session with appropriate tools
   - Handles authentication and API interactions
   - Processes responses from Claude

The workflow:
1. A new pull request is created or updated in your GitHub repository
2. The GitHub Actions workflow is triggered
3. The workflow runs your CI pipeline (tests, linting, etc.)
4. The workflow collects PR data and passes it to the MCP system
5. Claude reviews the code and provides feedback
6. The MCP system posts the feedback back to GitHub as comments or review decisions

## MCP Integration

This project uses Anthropic's Model Control Protocol (MCP) to enable Claude to:
1. Access file contents from your repository
2. Post comments directly to GitHub
3. Make review decisions (approve or request changes)

The MCP server runs entirely within GitHub Actions, eliminating the need for external services like n8n.

## PR Review Process

When a PR is submitted, Claude will:
1. Review the changed files and their diffs
2. Consider any existing comments or context
3. Provide feedback on:
   - Code quality and best practices
   - Potential bugs or logic errors
   - Security considerations
   - Style and readability
4. Post comments and/or make review decisions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
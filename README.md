# PR Review Webhook

A GitHub Actions workflow that sends pull request data to a webhook for automated review and analysis.

## What This Does

This workflow:
1. Runs your standard CI pipeline (tests, linting, etc.)
2. Collects detailed information about the pull request
3. Sends this data to a configured webhook
4. Works with any programming language or tech stack

## Setup Instructions

### 1. Add the Workflow File

Copy the example workflow file to your repository:

```
.github/workflows/ci-pipeline.yml
```

### 2. Configure Secrets and Variables

You'll need to add the following to your repository:

#### Repository Secrets
- `WEBHOOK_USERNAME`: The username for webhook authentication
- `WEBHOOK_AUTH_TOKEN`: The authentication token for your webhook

#### Repository Variables
- `WEBHOOK_URL`: The URL endpoint where PR data will be sent

To add these, go to:
1. Your repository → Settings → Secrets and variables → Actions
2. Add each secret and variable

### 3. Customize the Workflow (Optional)

You can modify the example workflow to:
- Change the trigger branches
- Add additional CI steps specific to your project
- Adjust the Node.js versions used

## Example Use Cases

- Automated code review using AI
- Integration with custom review systems
- Collecting PR metrics for dashboards
- Triggering additional quality checks

## Webhook Receiver with n8n

This repository includes an example n8n workflow that can receive and process the PR data. The workflow:

1. Receives PR data via a webhook endpoint
2. Processes the PR data to create a structured prompt
3. Uses Claude AI to perform an automated code review
4. Can approve PRs, request changes, or add comments based on AI review

To use the n8n workflow:
1. Import the `n8n-workflow.json` file into your n8n instance
2. Configure the required credentials:
   - **HTTP Basic Auth**: For webhook authentication (matching WEBHOOK_USERNAME/WEBHOOK_AUTH_TOKEN)
   - **GitHub API**: For interacting with GitHub repositories
   - **Anthropic API**: For Claude AI code reviews
3. Activate the webhook endpoint
4. Set your `WEBHOOK_URL` in GitHub to the generated n8n webhook URL

### Required n8n Credentials

The n8n workflow requires the following credentials to be configured:

1. **HTTP Basic Auth** (for the Webhook node)
   - Username: Should match WEBHOOK_USERNAME in GitHub
   - Password: Should match WEBHOOK_AUTH_TOKEN in GitHub

2. **GitHub API** (for GitHub Tool nodes)
   - Access Token: A GitHub Personal Access Token with repo permissions

3. **Anthropic API** (for Anthropic Chat Model node)
   - API Key: Your Anthropic API key for accessing Claude

## Complete Integration Flow

The complete integration between GitHub Actions and n8n works as follows:

1. A new pull request is created or updated in your GitHub repository
2. The GitHub Actions workflow is triggered
3. The workflow runs your CI pipeline (tests, linting, etc.)
4. The workflow collects PR data and sends it to your n8n webhook
5. n8n processes the PR data and generates a review prompt
6. Claude AI reviews the code and provides feedback
7. n8n sends the feedback back to GitHub as comments or review decisions

This creates a fully automated code review system that can be customized to your specific needs.

## Webhook Payload Structure

The GitHub Actions workflow sends a JSON payload to n8n with the following structure:

```json
{
  "id": "PR ID",
  "number": "PR Number",
  "title": "PR Title",
  "body": "PR Description",
  "state": "open/closed",
  "created_at": "Creation timestamp",
  "updated_at": "Last update timestamp",
  "repository": {
    "name": "repo-name",
    "owner": "owner-name"
  },
  "head": {
    "ref": "source branch",
    "sha": "head commit SHA"
  },
  "base": {
    "ref": "target branch",
    "sha": "base commit SHA"
  },
  "user": {
    "login": "username",
    "id": "user ID"
  },
  "changed_files": [
    {
      "filename": "path/to/file",
      "status": "added/modified/removed",
      "additions": 10,
      "deletions": 5,
      "changes": 15,
      "patch": "diff content"
    }
  ],
  "comments": [
    {
      "id": "comment ID",
      "body": "comment text",
      "user": "username",
      "created_at": "timestamp"
    }
  ],
  "review_comments": [
    {
      "id": "comment ID",
      "body": "comment text",
      "user": "username",
      "path": "file path",
      "position": "line position",
      "created_at": "timestamp"
    }
  ]
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

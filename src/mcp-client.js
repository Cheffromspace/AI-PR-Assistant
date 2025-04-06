// MCP client for calling Anthropic API
const Anthropic = require('@anthropic/sdk');
const { spawn } = require('child_process');
const path = require('path');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Function to run the MCP server and process PR data
async function runPRReview(prData) {
  try {
    console.log('Starting PR review process...');
    
    // Launch MCP server process
    const serverPath = path.join(__dirname, 'mcp-server.js');
    const serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN
      }
    });

    // Process PR data and generate system message
    const systemMessage = `You are Claude, an AI assistant acting as a professional code reviewer. Your goal is to provide helpful, constructive feedback on code changes in GitHub pull requests.

## Approach to Reviews
- Be thorough but balanced - focus on meaningful issues rather than minor stylistic preferences
- Provide specific, actionable feedback with clear explanations
- Balance pointing out problems with positive reinforcement
- When suggesting changes, explain why they improve the code
- Consider security, performance, maintainability, and readability

## Review Focus Areas
1. Potential security vulnerabilities (injection attacks, authentication issues, etc.)
2. Logic bugs or edge cases
3. Performance issues (inefficient algorithms, unnecessary computations)
4. Code organization and maintainability
5. Error handling and edge cases
6. Test coverage and effectiveness
7. Documentation quality

## Response Format
- Begin with a brief summary of the PR and your overall assessment
- Group feedback by file, with clear headings
- Include specific line references when applicable
- For each issue identified:
  * Clearly describe the problem
  * Explain why it's an issue
  * Suggest a concrete improvement
- End with a conclusion summarizing key points and next steps

Maintain a professional, constructive tone throughout your review. Your goal is to help improve the code quality while respecting the developer's work.`;

    // Call Anthropic API with MCP
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      system: systemMessage,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prData.prompt || "Please review this PR and provide feedback."
            }
          ]
        }
      ],
      tools: [
        {
          name: "get_file",
          description: "Get full contents of a file from GitHub repository",
          input_schema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Full path to file"
              },
              repo: {
                type: "string",
                description: "Repository name"
              },
              owner: {
                type: "string", 
                description: "Repository owner"
              },
              ref: {
                type: "string",
                description: "Git reference (branch, tag, or commit SHA)"
              }
            },
            required: ["path", "repo", "owner", "ref"]
          }
        },
        {
          name: "add_comment",
          description: "Leave a comment on the PR",
          input_schema: {
            type: "object",
            properties: {
              body: {
                type: "string",
                description: "Comment content"
              },
              repo: {
                type: "string",
                description: "Repository name"
              },
              owner: {
                type: "string",
                description: "Repository owner"
              },
              pull_number: {
                type: "number",
                description: "PR number"
              }
            },
            required: ["body", "repo", "owner", "pull_number"]
          }
        },
        {
          name: "approve",
          description: "Approve PR",
          input_schema: {
            type: "object",
            properties: {
              repo: {
                type: "string",
                description: "Repository name"
              },
              owner: {
                type: "string",
                description: "Repository owner"
              },
              pull_number: {
                type: "number",
                description: "PR number"
              }
            },
            required: ["repo", "owner", "pull_number"]
          }
        },
        {
          name: "request_change",
          description: "Request changes to the PR",
          input_schema: {
            type: "object",
            properties: {
              body: {
                type: "string",
                description: "Change request description"
              },
              repo: {
                type: "string",
                description: "Repository name"
              },
              owner: {
                type: "string",
                description: "Repository owner"
              },
              pull_number: {
                type: "number",
                description: "PR number"
              }
            },
            required: ["body", "repo", "owner", "pull_number"]
          }
        },
        {
          name: "get_issue",
          description: "Get the data of a single issue",
          input_schema: {
            type: "object",
            properties: {
              repo: {
                type: "string",
                description: "Repository name"
              },
              owner: {
                type: "string",
                description: "Repository owner"
              },
              issue_number: {
                type: "number",
                description: "Issue number"
              }
            },
            required: ["repo", "owner", "issue_number"]
          }
        }
      ],
      tool_choice: "auto"
    });

    // Process the response
    console.log('PR review completed');
    return response;

  } catch (error) {
    console.error('Error in PR review process:', error);
    throw error;
  }
}

// Export the client function
module.exports = {
  runPRReview
};
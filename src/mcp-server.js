// MCP server for PR review
const { createServer } = require('@anthropic/mcp-server');
const { Octokit } = require("@octokit/rest");

// Setup the MCP server
const server = createServer({
  // Define tools that mirror n8n functionality
  tools: {
    get_file: {
      description: "Get full contents of a file from GitHub repository",
      parameters: {
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
      handler: async (params, context) => {
        try {
          const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
          const response = await octokit.repos.getContent({
            owner: params.owner,
            repo: params.repo,
            path: params.path,
            ref: params.ref,
            mediaType: {
              format: "raw"
            }
          });
          return response.data;
        } catch (error) {
          console.error(`Error fetching file: ${error.message}`);
          return { error: error.message };
        }
      }
    },
    add_comment: {
      description: "Leave a comment on the PR",
      parameters: {
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
      handler: async (params, context) => {
        try {
          const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
          const response = await octokit.issues.createComment({
            owner: params.owner,
            repo: params.repo,
            issue_number: params.pull_number,
            body: params.body
          });
          return { success: true, comment_id: response.data.id };
        } catch (error) {
          console.error(`Error adding comment: ${error.message}`);
          return { error: error.message };
        }
      }
    },
    approve: {
      description: "Approve PR",
      parameters: {
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
      handler: async (params, context) => {
        try {
          const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
          await octokit.pulls.createReview({
            owner: params.owner,
            repo: params.repo,
            pull_number: params.pull_number,
            event: "APPROVE"
          });
          return { success: true };
        } catch (error) {
          console.error(`Error approving PR: ${error.message}`);
          return { error: error.message };
        }
      }
    },
    request_change: {
      description: "Request changes to the PR",
      parameters: {
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
      handler: async (params, context) => {
        try {
          const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
          await octokit.pulls.createReview({
            owner: params.owner,
            repo: params.repo,
            pull_number: params.pull_number,
            body: params.body,
            event: "REQUEST_CHANGES"
          });
          return { success: true };
        } catch (error) {
          console.error(`Error requesting changes: ${error.message}`);
          return { error: error.message };
        }
      }
    },
    get_issue: {
      description: "Get the data of a single issue",
      parameters: {
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
      handler: async (params, context) => {
        try {
          const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
          const response = await octokit.issues.get({
            owner: params.owner,
            repo: params.repo,
            issue_number: params.issue_number
          });
          return response.data;
        } catch (error) {
          console.error(`Error fetching issue: ${error.message}`);
          return { error: error.message };
        }
      }
    }
  }
});

// Process PR data and generate review prompt
function generatePRReviewPrompt(prData) {
  // Basic PR details section
  let prompt = `# GitHub PR Code Review\n\n## PR Details\n- Title: ${prData.title || 'N/A'}\n- Description: ${prData.body || 'N/A'}\n- Created by: ${prData.user?.login || 'N/A'}\n- Branch: ${prData.head?.ref || 'N/A'} → ${prData.base?.ref || 'N/A'}\n- PR Number: #${prData.number || 'N/A'}\n- Created: ${prData.created_at || 'N/A'}\n- Last Updated: ${prData.updated_at || 'N/A'}\n\n## Review Task\nPlease review the following code changes for style, potential vulnerabilities, and best practices. Focus on substantive issues rather than minor stylistic preferences.\n`;

  // Conditionally add PR Comments section
  if (prData.comments && prData.comments.length > 0) {
    prompt += `\n## PR Comments\n`;
    
    for (const comment of prData.comments) {
      prompt += `- From @${comment.user || 'Anonymous'} (${comment.created_at || 'N/A'}):\n  ${comment.body || 'No content'}\n`;
    }
  }

  // Conditionally add Review Comments section
  if (prData.review_comments && prData.review_comments.length > 0) {
    prompt += `\n## Review Comments\n`;
    
    for (const comment of prData.review_comments) {
      prompt += `- From @${comment.user || 'Anonymous'} (${comment.created_at || 'N/A'}) on \`${comment.path || 'unknown file'}\`:\n  ${comment.body || 'No content'}\n`;
    }
  }

  // Add Changed Files section
  prompt += `\n## Changed Files\n`;
  
  if (prData.changed_files && Array.isArray(prData.changed_files)) {
    for (const file of prData.changed_files) {
      prompt += `### ${file.filename || 'Unknown file'} (${file.status || 'modified'}, +${file.additions || 0}/-${file.deletions || 0})\n\`\`\`\n${file.patch || 'No patch available'}\n\`\`\`\n\n`;
    }
  } else {
    prompt += `No file information available.\n`;
  }

  // Add Review Guidelines
  prompt += `## Review Guidelines\n1. Identify potential security vulnerabilities or bugs\n2. Suggest improvements for code quality and maintainability\n3. Check for adherence to project style guidelines\n4. Look for performance issues in algorithms or data structures\n5. Verify appropriate error handling\n6. Ensure code is well-tested where applicable\n\nPlease format your response with constructive feedback that helps the developer improve their code. Include specific line references where applicable.`;

  return prompt;
}

// Start the server (use stdio transport for GitHub Actions)
server.listen({
  transport: "stdio"
});

// Export for testing
module.exports = {
  server,
  generatePRReviewPrompt
};
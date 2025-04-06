// Main entry point for the MCP PR review system
const { runPRReview } = require('./mcp-client');

// Process command line arguments (when used directly)
async function main() {
  try {
    // Parse PR data from stdin
    let inputData = '';
    process.stdin.on('data', chunk => {
      inputData += chunk;
    });

    process.stdin.on('end', async () => {
      try {
        // Parse JSON input
        const prData = JSON.parse(inputData);
        
        // Generate prompt from PR data
        if (!prData.prompt) {
          // Process the PR data to create prompt similar to n8n workflow
          prData.prompt = generatePRReviewPrompt(prData);
        }
        
        // Run PR review
        const response = await runPRReview(prData);
        console.log(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error processing PR data:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Generate review prompt from PR data (similar to n8n workflow)
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

// Export for module usage and run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runPRReview,
  generatePRReviewPrompt
};
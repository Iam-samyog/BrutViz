#!/usr/bin/env node

/**
 * AI-Powered Code Reviewer
 * 
 * Uses Gemini AI to review code and suggest improvements
 */

const fs = require('fs').promises;
const { execSync } = require('child_process');

class AICodeReviewer {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.suggestions = [];
  }

  async reviewCodebase() {
    if (!this.apiKey) {
      console.log('[AI Reviewer] ⚠ GEMINI_API_KEY not set, skipping AI review');
      return [];
    }

    console.log('[AI Reviewer] 🤖 Analyzing codebase with Gemini AI...');

    try {
      // Get list of recent changes
      const recentFiles = execSync(
        'git diff --name-only HEAD~1 HEAD 2>/dev/null || find . -type f \\( -name "*.tsx" -o -name "*.ts" \\) -not -path "./node_modules/*" -not -path "./.next/*" | head -5',
        { encoding: 'utf-8' }
      ).split('\n').filter(Boolean);

      for (const file of recentFiles.slice(0, 3)) { // Limit to 3 files to avoid API quota
        try {
          const content = await fs.readFile(file, 'utf-8');
          const analysis = await this.analyzeWithGemini(file, content);
          
          if (analysis && analysis.suggestions) {
            this.suggestions.push({
              file,
              suggestions: analysis.suggestions
            });
          }
        } catch (e) {
          console.log(`[AI Reviewer] Could not analyze ${file}: ${e.message}`);
        }
      }

      return this.suggestions;
    } catch (error) {
      console.log('[AI Reviewer] Error during AI review:', error.message);
      return [];
    }
  }

  async analyzeWithGemini(file, content) {
    // Prepare the prompt for Gemini
    const prompt = `You are an expert code reviewer for a Next.js/React/TypeScript project.

Analyze this file and provide 2-3 specific, actionable improvements focusing on:
1. Performance optimizations
2. Code quality and best practices
3. Potential bugs or edge cases
4. Security improvements

File: ${file}

Code:
\`\`\`typescript
${content.slice(0, 2000)} // Limited for API efficiency
\`\`\`

Respond in JSON format:
{
  "suggestions": [
    {"priority": "high|medium|low", "description": "specific suggestion"}
  ]
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
            }
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]) {
        const text = data.candidates[0].content.parts[0].text;
        // Extract JSON from markdown code block if present
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
      }
    } catch (error) {
      console.log(`[AI Reviewer] API error: ${error.message}`);
    }

    return null;
  }

  formatSuggestions() {
    if (this.suggestions.length === 0) {
      return 'No AI suggestions generated';
    }

    let output = '### 🤖 AI-Powered Code Review\n\n';
    
    for (const { file, suggestions } of this.suggestions) {
      output += `**${file}**\n`;
      for (const suggestion of suggestions) {
        const emoji = suggestion.priority === 'high' ? '🔴' : suggestion.priority === 'medium' ? '🟡' : '🟢';
        output += `${emoji} ${suggestion.description}\n`;
      }
      output += '\n';
    }

    return output;
  }
}

// Export for use in main agent
if (require.main === module) {
  const reviewer = new AICodeReviewer();
  reviewer.reviewCodebase().then(suggestions => {
    console.log(reviewer.formatSuggestions());
  });
} else {
  module.exports = AICodeReviewer;
}

# 🤖 Daily Improvement Agent

An intelligent automation system that continuously improves the BrutViz project every day.

## 🌟 Overview

The Daily Improvement Agent is an AI-powered automation system that runs every day to:

- 📦 **Keep dependencies up-to-date** - Automatically updates packages and security patches
- 🔒 **Maintain security** - Scans for vulnerabilities and applies fixes
- ✨ **Improve code quality** - Runs linters, formatters, and code analyzers
- ⚡ **Optimize performance** - Detects unused dependencies and optimization opportunities
- 📚 **Update documentation** - Keeps README and docs current
- 🤖 **AI-powered reviews** - Uses Gemini AI to suggest code improvements

## 🚀 How It Works

### Automated Daily Workflow

1. **Scheduled Execution**: Runs every day at 2:00 AM UTC
2. **Multi-Stage Analysis**: Performs 6 different types of improvements
3. **Smart Updates**: Auto-applies safe changes, flags others for review
4. **Pull Request Creation**: Creates a PR with all automated improvements
5. **Issue Tracking**: Creates issues for items requiring manual review

### Improvement Stages

#### 1. Dependency Updates 📦
- Scans for outdated packages
- Auto-updates patch versions
- Flags major version updates for manual review
- Updates `package-lock.json` safely

#### 2. Security Audits 🔒
- Runs `npm audit` to find vulnerabilities
- Automatically applies security fixes
- Creates high-priority issues for manual fixes
- Tracks vulnerability trends over time

#### 3. Code Quality ✨
- Runs ESLint with auto-fix
- Checks for common code patterns
- Detects console.log statements
- Identifies TODO comments
- Enforces TypeScript best practices

#### 4. Performance Optimization ⚡
- Analyzes bundle size
- Detects unused dependencies
- Suggests lazy loading opportunities
- Identifies performance bottlenecks

#### 5. Documentation Updates 📚
- Updates README with latest info
- Adds "Last Updated" timestamps
- Syncs package.json with documentation
- Checks for broken links

#### 6. AI Code Review 🤖
- Uses Gemini AI to analyze code
- Provides context-aware suggestions
- Identifies potential bugs
- Suggests best practices
- Prioritizes recommendations

## ⚙️ Configuration

### Required Secrets

Add these secrets to your GitHub repository settings:

1. **GITHUB_TOKEN** - Automatically provided by GitHub Actions
2. **GEMINI_API_KEY** - Your Google Gemini API key (optional, for AI features)

To add secrets:
1. Go to Repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add `GEMINI_API_KEY` with your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Agent Configuration

Edit `.github/agent-config.env` to customize the agent's behavior:

```env
# Enable/disable features
CHECK_DEPENDENCIES=true
RUN_SECURITY_AUDIT=true
AI_CODE_REVIEW=true

# Update policies
AUTO_UPDATE_PATCH=true
AUTO_UPDATE_MINOR=false
AUTO_UPDATE_MAJOR=false
```

## 🎯 Manual Triggers

You can manually trigger the agent from GitHub:

1. Go to **Actions** tab
2. Select **Daily Improvement Agent**
3. Click **Run workflow**
4. Choose the branch and click **Run**

## 📊 Understanding Reports

### Pull Request Structure

Each automated PR includes:

- **Summary**: High-level overview of changes
- **Automated Improvements**: List of changes applied
- **Manual Review Items**: Items flagged for human review
- **Review Checklist**: Steps to verify the changes

### Priority Levels

- 🔴 **High**: Security issues, breaking changes
- 🟡 **Medium**: Code quality, performance improvements
- 🟢 **Low**: Documentation, minor optimizations

## 🛠️ Advanced Usage

### Custom Improvement Rules

You can extend the agent by adding custom rules in `.github/scripts/improvement-agent.js`:

```javascript
async customCheck() {
  // Your custom improvement logic
  this.improvements.push('✓ Applied custom improvement');
  this.hasChanges = true;
}
```

### Integration with CI/CD

The agent integrates seamlessly with your existing CI/CD pipeline:

1. Agent creates PR
2. CI runs tests automatically
3. Reviews are requested
4. Merge when approved
5. Changes deploy automatically

## 📈 Benefits

- ⏰ **Saves Time**: Automates routine maintenance tasks
- 🔒 **Improves Security**: Catches vulnerabilities early
- 📊 **Better Code Quality**: Consistent standards enforcement
- 🚀 **Faster Development**: Reduces technical debt
- 🤖 **AI-Powered**: Intelligent suggestions for complex issues
- 📝 **Documentation**: Keeps docs up-to-date automatically

## 🔍 Monitoring

### GitHub Actions Dashboard

Monitor the agent's activity:
1. Go to **Actions** tab
2. View workflow runs and their status
3. Check logs for detailed information
4. Review generated PRs and issues

### Metrics Tracked

- Dependencies updated
- Security vulnerabilities fixed
- Code quality improvements
- Performance optimizations
- Documentation updates
- AI suggestions implemented

## 🚨 Troubleshooting

### Agent Not Running

1. Check workflow file is in `.github/workflows/`
2. Verify repository has Actions enabled
3. Check for syntax errors in YAML
4. Review workflow logs

### No Changes Generated

- All dependencies may be up-to-date
- No security issues found
- Code already follows best practices
- This is actually good news! ✅

### API Rate Limits

- Gemini AI has free tier limits
- Agent respects rate limits automatically
- Reduces file analysis when needed
- Prioritizes most important files

## 📝 Best Practices

1. **Review PRs Promptly**: Don't let automated PRs pile up
2. **Customize Configuration**: Adjust settings for your needs
3. **Monitor Trends**: Track improvements over time
4. **Provide Feedback**: Close or modify PRs that aren't helpful
5. **Keep Secrets Updated**: Rotate API keys periodically

## 🤝 Contributing

Improvements to the agent itself are welcome! Key files:

- `.github/workflows/daily-improvement-agent.yml` - Workflow configuration
- `.github/scripts/improvement-agent.js` - Main agent logic
- `.github/scripts/ai-code-reviewer.js` - AI review logic
- `.github/agent-config.env` - Configuration settings

## 📜 License

Same license as the main BrutViz project (MIT).

## 🙏 Credits

Built with:
- GitHub Actions
- Google Gemini AI
- Node.js
- npm audit
- ESLint

---

*Part of the BrutViz project - Transforming data visualization with AI* 🖼️

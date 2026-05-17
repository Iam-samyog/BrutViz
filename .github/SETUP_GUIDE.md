# 🚀 Quick Start Guide: Setting Up the Daily Improvement Agent

Follow these steps to activate the Daily Improvement Agent for your BrutViz project:

## Step 1: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Navigate to **Actions** → **General**
4. Under "Actions permissions", ensure actions are enabled
5. Under "Workflow permissions", select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
6. Click **Save**

## Step 2: Add Required Secrets (Optional but Recommended)

### For AI-Powered Features:

1. Get a Gemini API Key:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click **Create API Key**
   - Copy the generated key

2. Add to GitHub:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `GEMINI_API_KEY`
   - Value: Paste your API key
   - Click **Add secret**

> 💡 **Note**: The agent works without the API key but won't provide AI-powered code reviews.

## Step 3: Verify Installation

Check that these files exist in your repository:
```
.github/
├── workflows/
│   ├── daily-improvement-agent.yml
│   └── weekly-review.yml
├── scripts/
│   ├── improvement-agent.js
│   └── ai-code-reviewer.js
├── agent-config.env
└── AGENT_README.md
```

## Step 4: Test the Agent

### Manual Trigger:

1. Go to **Actions** tab in your repository
2. Select **Daily Improvement Agent** workflow
3. Click **Run workflow** button
4. Select branch (usually `main` or `master`)
5. Click **Run workflow**
6. Wait 2-3 minutes for completion

### Check Results:

1. **Pull Requests Tab**: Look for a new PR titled "🤖 Daily Improvements - [date]"
2. **Issues Tab**: Check for any "Manual Review Required" issues
3. **Actions Tab**: View detailed logs of what the agent did

## Step 5: Review and Merge

1. Open the automated PR created by the agent
2. Review the changes:
   - ✅ Dependency updates
   - ✅ Security fixes
   - ✅ Code quality improvements
   - ✅ AI suggestions
3. Run checks (CI will run automatically if configured)
4. Approve and merge when ready

## Configuration Options

Edit `.github/agent-config.env` to customize behavior:

```env
# Quick toggles
CHECK_DEPENDENCIES=true      # Keep dependencies updated
RUN_SECURITY_AUDIT=true     # Run security scans
AI_CODE_REVIEW=true         # Use AI for code review
AUTO_UPDATE_PATCH=true      # Auto-update patch versions
```

## Scheduling

The agent runs automatically:
- **Daily Agent**: Every day at 2:00 AM UTC
- **Weekly Review**: Every Monday at 9:00 AM UTC

To change the schedule, edit the `cron` expression in the workflow files.

## Troubleshooting

### "Workflow not running"
- Check that Actions are enabled in Settings
- Verify workflow file syntax with [YAML Validator](https://www.yamllint.com/)
- Check repository permissions

### "No changes detected"
- This means your project is already in great shape! ✅
- The agent will still run and report status

### "API rate limit exceeded"
- Gemini free tier has usage limits
- Agent automatically reduces API calls when needed
- Consider upgrading API plan for unlimited reviews

## Success Indicators

You'll know the agent is working when:
- ✅ Daily PRs appear automatically
- ✅ Dependencies stay up-to-date
- ✅ Security issues are caught early
- ✅ Code quality improves over time
- ✅ Documentation stays current

## Next Steps

- [📖 Read the full Agent documentation](.github/AGENT_README.md)
- 🔔 Configure GitHub notifications for agent PRs
- 📊 Monitor weekly health reports
- 🤝 Customize the agent for your workflow

## Need Help?

- Check [AGENT_README.md](.github/AGENT_README.md) for detailed docs
- Review workflow logs in the Actions tab
- Open an issue if you encounter problems

---

**You're all set!** The Daily Improvement Agent will now continuously improve your BrutViz project. 🚀

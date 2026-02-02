#!/usr/bin/env node

/**
 * Daily Improvement Agent
 * 
 * This agent automatically improves the BrutViz project by:
 * - Checking for dependency updates
 * - Running security audits
 * - Optimizing code quality
 * - Suggesting improvements using AI
 * - Auto-fixing common issues
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ImprovementAgent {
  constructor() {
    this.improvements = [];
    this.manualItems = [];
    this.hasChanges = false;
    this.date = new Date().toISOString().split('T')[0];
  }

  log(message) {
    console.log(`[Improvement Agent] ${message}`);
  }

  async run() {
    this.log('🚀 Starting Daily Improvement Agent...');

    try {
      await this.checkDependencies();
      await this.runSecurityAudit();
      await this.improveCodeQuality();
      await this.optimizePerformance();
      await this.updateDocumentation();
      await this.generateReport();
    } catch (error) {
      console.error('Error running improvement agent:', error);
      process.exit(1);
    }

    this.log('✅ Improvement Agent completed!');
  }

  async checkDependencies() {
    this.log('📦 Checking for dependency updates...');

    try {
      // Check for outdated packages
      const outdated = execSync('npm outdated --json || true', { encoding: 'utf-8' });
      
      if (outdated) {
        const packages = JSON.parse(outdated);
        const updateable = Object.keys(packages).filter(pkg => {
          const current = packages[pkg].current;
          const wanted = packages[pkg].wanted;
          return current !== wanted;
        });

        if (updateable.length > 0) {
          this.improvements.push(`Found ${updateable.length} packages that can be updated`);
          
          // Auto-update patch versions
          for (const pkg of updateable) {
            const info = packages[pkg];
            const currentMajor = info.current.split('.')[0];
            const wantedMajor = info.wanted.split('.')[0];
            
            // Only auto-update if major version hasn't changed
            if (currentMajor === wantedMajor) {
              try {
                execSync(`npm install ${pkg}@${info.wanted}`, { stdio: 'inherit' });
                this.improvements.push(`✓ Updated ${pkg} from ${info.current} to ${info.wanted}`);
                this.hasChanges = true;
              } catch (e) {
                this.manualItems.push(`⚠ ${pkg} update failed: ${e.message}`);
              }
            } else {
              this.manualItems.push(`🔍 Major update available for ${pkg}: ${info.current} → ${info.latest}`);
            }
          }
        } else {
          this.log('All dependencies are up to date!');
        }
      }
    } catch (error) {
      this.log(`Warning: Could not check dependencies: ${error.message}`);
    }
  }

  async runSecurityAudit() {
    this.log('🔒 Running security audit...');

    try {
      execSync('npm audit --json > /tmp/audit.json || true', { encoding: 'utf-8' });
      const auditData = await fs.readFile('/tmp/audit.json', 'utf-8');
      const audit = JSON.parse(auditData);

      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        const total = Object.values(vulns).reduce((sum, count) => sum + count, 0);

        if (total > 0) {
          this.improvements.push(`Found ${total} security vulnerabilities`);
          
          // Try to auto-fix
          try {
            execSync('npm audit fix --force', { stdio: 'inherit' });
            this.improvements.push('✓ Applied security fixes automatically');
            this.hasChanges = true;
          } catch (e) {
            this.manualItems.push('⚠ Some security issues require manual review');
          }
        } else {
          this.log('No security vulnerabilities found!');
        }
      }
    } catch (error) {
      this.log(`Warning: Could not run security audit: ${error.message}`);
    }
  }

  async improveCodeQuality() {
    this.log('✨ Improving code quality...');

    try {
      // Run linter with auto-fix
      try {
        execSync('npm run lint -- --fix', { stdio: 'inherit' });
        this.improvements.push('✓ Applied ESLint auto-fixes');
        this.hasChanges = true;
      } catch (e) {
        this.log('Linting completed with warnings');
      }

      // Check for common patterns that can be improved
      await this.checkCodePatterns();
    } catch (error) {
      this.log(`Warning: Could not improve code quality: ${error.message}`);
    }
  }

  async checkCodePatterns() {
    this.log('🔍 Checking for code improvement patterns...');

    try {
      const files = execSync('find . -type f \\( -name "*.tsx" -o -name "*.ts" \\) -not -path "./node_modules/*" -not -path "./.next/*"', 
        { encoding: 'utf-8' }).split('\n').filter(Boolean);

      let issuesFound = 0;

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Check for console.log statements (except in scripts)
        if (!file.includes('/scripts/') && content.includes('console.log')) {
          this.manualItems.push(`🔍 Found console.log in ${file} - consider removing`);
          issuesFound++;
        }

        // Check for TODO comments
        const todoMatches = content.match(/\/\/ TODO:/g);
        if (todoMatches && todoMatches.length > 0) {
          this.manualItems.push(`📝 Found ${todoMatches.length} TODO(s) in ${file}`);
          issuesFound++;
        }
      }

      if (issuesFound === 0) {
        this.log('No common code pattern issues found!');
      }
    } catch (error) {
      this.log(`Warning: Could not check code patterns: ${error.message}`);
    }
  }

  async optimizePerformance() {
    this.log('⚡ Checking for performance optimizations...');

    try {
      // Check bundle size
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      
      this.improvements.push(`Current dependencies: ${depCount} packages`);

      // Look for unused dependencies
      try {
        const result = execSync('npx depcheck --json || true', { encoding: 'utf-8' });
        if (result) {
          const depcheck = JSON.parse(result);
          if (depcheck.dependencies && depcheck.dependencies.length > 0) {
            this.manualItems.push(`🔍 Potentially unused dependencies: ${depcheck.dependencies.join(', ')}`);
          }
        }
      } catch (e) {
        this.log('Depcheck not available, skipping');
      }
    } catch (error) {
      this.log(`Warning: Could not check performance: ${error.message}`);
    }
  }

  async updateDocumentation() {
    this.log('📚 Checking documentation...');

    try {
      // Check if README needs updating
      const readme = await fs.readFile('README.md', 'utf-8');
      
      // Update badges with latest info
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      const dependencies = packageJson.dependencies || {};
      
      // Add a note about last updated
      if (!readme.includes('Last Updated:')) {
        const today = new Date().toISOString().split('T')[0];
        const updatedReadme = readme + `\n\n---\n\n*Last Updated: ${today}*\n`;
        await fs.writeFile('README.md', updatedReadme);
        this.improvements.push('✓ Updated README with last updated date');
        this.hasChanges = true;
      }
    } catch (error) {
      this.log(`Warning: Could not update documentation: ${error.message}`);
    }
  }

  async generateReport() {
    this.log('📊 Generating improvement report...');

    // Set GitHub Actions outputs
    const setOutput = (name, value) => {
      console.log(`::set-output name=${name}::${value}`);
    };

    setOutput('has_changes', this.hasChanges);
    setOutput('date', this.date);
    setOutput('has_manual_items', this.manualItems.length > 0);

    const summary = this.improvements.length > 0 
      ? this.improvements.join('\n- ')
      : 'No automated improvements needed';

    setOutput('improvement_summary', summary);

    const details = [
      '### Automated Improvements',
      this.improvements.length > 0 ? this.improvements.map(i => `- ${i}`).join('\n') : '- No changes needed',
      '',
      '### Manual Review Items',
      this.manualItems.length > 0 ? this.manualItems.map(i => `- ${i}`).join('\n') : '- None',
    ].join('\n');

    setOutput('changes_detail', details);
    setOutput('manual_items', this.manualItems.join('\n'));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('IMPROVEMENT REPORT');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(summary);
    console.log('\n📋 Details:');
    console.log(details);
    console.log('\n' + '='.repeat(60));
  }
}

// Run the agent
const agent = new ImprovementAgent();
agent.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

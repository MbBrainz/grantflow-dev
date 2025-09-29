---
name: analyze-usage
description: >-
  Analyze TailwindCSS utility usage patterns, identify optimization
  opportunities, and generate usage reports
---

# Analyze TailwindCSS Usage

This command analyzes your TailwindCSS usage patterns across your codebase to identify optimization opportunities, unused utilities, and usage statistics.

## What This Command Does

1. **Usage Pattern Analysis**
   - Scans all template files for TailwindCSS class usage
   - Identifies most and least used utility patterns
   - Generates usage frequency reports
   - Detects potential optimization opportunities

2. **Bundle Size Analysis**
   - Analyzes generated CSS bundle size
   - Identifies largest utility categories
   - Compares before/after optimization results
   - Tracks bundle size over time

3. **Code Quality Insights**
   - Identifies overly complex utility combinations
   - Suggests component extraction opportunities
   - Detects inconsistent utility usage patterns
   - Highlights potential refactoring opportunities

4. **Performance Recommendations**
   - Suggests safelist optimizations
   - Identifies unused CSS that can be purged
   - Recommends content path improvements
   - Provides bundle optimization suggestions

## Usage Examples

### Basic Usage Analysis

```bash
# Analyze utility usage in all template files
grep -r "class[Name]*=" src/ --include="*.jsx" --include="*.tsx" --include="*.vue" --include="*.html" | \
sed -E 's/.*class[Name]*=["'\''`]([^"'\''`]*)["'\''`].*/\1/' | \
tr ' ' '\n' | \
sort | uniq -c | sort -nr > tailwind-usage-report.txt

# View top 20 most used utilities
head -20 tailwind-usage-report.txt

# View least used utilities
tail -20 tailwind-usage-report.txt
```

### Advanced Pattern Analysis

```bash
# Find all TailwindCSS classes in codebase
find src -name "*.{js,jsx,ts,tsx,vue,html}" -exec grep -l "class" {} \; | \
xargs grep -o "class[Name]*=['\"][^'\"]*['\"]" | \
sed -E 's/.*class[Name]*=["'\''`]([^"'\''`]*)["'\''`].*/\1/' | \
tr ' ' '\n' | \
grep -E '^[a-zA-Z]' | \
sort | uniq -c | sort -nr
```

### Component Complexity Analysis

```bash
# Find components with many utility classes (potential extraction candidates)
find src/components -name "*.{jsx,tsx}" -exec sh -c '
  for file do
    count=$(grep -o "class[Name]*=['\"][^'\"]*['\"]" "$file" | \
            sed -E "s/.*class[Name]*=[\"\'\`]([^\"\'\`]*)[\"\'\`].*/\1/" | \
            tr " " "\n" | wc -l)
    echo "$count $file"
  done
' sh {} + | sort -nr | head -10
```

## Analysis Scripts

### Comprehensive Usage Analyzer

```javascript
// scripts/analyze-tailwind-usage.js
const fs = require('fs')
const path = require('path')
const glob = require('glob')

class TailwindUsageAnalyzer {
  constructor(options = {}) {
    this.srcPaths = options.srcPaths || ['src/**/*.{js,jsx,ts,tsx,vue,html}']
    this.outputPath = options.outputPath || './tailwind-analysis.json'
    this.classPattern =
      /(?:class|className)(?:Name)?[`:=]\s*[`"']([^`"']*)[`"']/g
  }

  async analyze() {
    const files = this.getTemplateFiles()
    const results = {
      totalFiles: files.length,
      totalClasses: 0,
      utilityStats: {},
      fileStats: {},
      categoryStats: {},
      complexityStats: {},
      timestamp: new Date().toISOString(),
    }

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      const fileClasses = this.extractClasses(content)

      results.fileStats[file] = {
        classCount: fileClasses.length,
        uniqueClasses: [...new Set(fileClasses)].length,
        complexity: this.calculateComplexity(fileClasses),
      }

      // Update utility stats
      fileClasses.forEach(className => {
        results.utilityStats[className] =
          (results.utilityStats[className] || 0) + 1
        results.totalClasses++

        // Categorize utility
        const category = this.categorizeUtility(className)
        results.categoryStats[category] =
          (results.categoryStats[category] || 0) + 1
      })
    }

    // Calculate additional insights
    results.insights = this.generateInsights(results)
    results.recommendations = this.generateRecommendations(results)

    // Save results
    fs.writeFileSync(this.outputPath, JSON.stringify(results, null, 2))

    return results
  }

  getTemplateFiles() {
    const files = []
    this.srcPaths.forEach(pattern => {
      files.push(...glob.sync(pattern))
    })
    return files
  }

  extractClasses(content) {
    const classes = []
    let match

    while ((match = this.classPattern.exec(content)) !== null) {
      const classString = match[1]
      const classList = classString.split(/\s+/).filter(cls => cls.length > 0)
      classes.push(...classList)
    }

    return classes
  }

  categorizeUtility(className) {
    const categories = {
      layout: /^(block|inline|flex|grid|table|hidden|container)/,
      spacing: /^(p|m|space)[trblxy]?-/,
      sizing: /^(w|h|max-w|max-h|min-w|min-h)-/,
      typography: /^(text|font|leading|tracking|whitespace)/,
      colors:
        /^(bg|text|border|ring)-.+-(50|100|200|300|400|500|600|700|800|900|950)$/,
      borders: /^(border|rounded|ring|divide)/,
      effects: /^(shadow|opacity|blur)/,
      filters: /^(filter|backdrop|brightness|contrast|grayscale)/,
      animation: /^(animate|transition|duration|ease|delay)/,
      transforms: /^(transform|scale|rotate|translate|skew)/,
      interactivity: /^(cursor|select|resize|outline|appearance)/,
      responsive: /^(sm|md|lg|xl|2xl):/,
      state: /^(hover|focus|active|disabled|group|peer):/,
    }

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(className)) {
        return category
      }
    }

    return 'other'
  }

  calculateComplexity(classes) {
    const uniqueClasses = new Set(classes)
    const responsiveClasses = classes.filter(c => /^(sm|md|lg|xl|2xl):/.test(c))
    const stateClasses = classes.filter(c =>
      /^(hover|focus|active|group|peer):/.test(c)
    )

    return {
      total: classes.length,
      unique: uniqueClasses.size,
      responsive: responsiveClasses.length,
      interactive: stateClasses.length,
      ratio: classes.length / uniqueClasses.size,
    }
  }

  generateInsights(results) {
    const sortedUtilities = Object.entries(results.utilityStats).sort(
      ([, a], [, b]) => b - a
    )

    const sortedCategories = Object.entries(results.categoryStats).sort(
      ([, a], [, b]) => b - a
    )

    const complexFiles = Object.entries(results.fileStats)
      .sort(([, a], [, b]) => b.complexity.total - a.complexity.total)
      .slice(0, 10)

    return {
      mostUsedUtilities: sortedUtilities.slice(0, 20),
      leastUsedUtilities: sortedUtilities.slice(-20),
      topCategories: sortedCategories,
      mostComplexFiles: complexFiles,
      averageClassesPerFile: results.totalClasses / results.totalFiles,
      uniqueUtilityCount: Object.keys(results.utilityStats).length,
    }
  }

  generateRecommendations(results) {
    const recommendations = []

    // Check for overused utilities
    const overusedUtilities = results.insights.mostUsedUtilities.filter(
      ([, count]) => count > results.totalFiles * 0.8
    )

    if (overusedUtilities.length > 0) {
      recommendations.push({
        type: 'component-extraction',
        message:
          'Consider extracting components for frequently used utility combinations',
        utilities: overusedUtilities.slice(0, 5).map(([name]) => name),
      })
    }

    // Check for complex files
    const complexFiles = results.insights.mostComplexFiles.filter(
      ([, stats]) => stats.complexity.total > 50
    )

    if (complexFiles.length > 0) {
      recommendations.push({
        type: 'complexity-reduction',
        message:
          'These files have high utility complexity and may benefit from refactoring',
        files: complexFiles.slice(0, 5).map(([file]) => file),
      })
    }

    // Check for unused categories
    const lowUsageCategories = Object.entries(results.categoryStats).filter(
      ([, count]) => count < results.totalClasses * 0.01
    )

    if (lowUsageCategories.length > 0) {
      recommendations.push({
        type: 'config-optimization',
        message: 'Consider removing unused utility categories from your build',
        categories: lowUsageCategories.map(([name]) => name),
      })
    }

    return recommendations
  }
}

// Usage
const analyzer = new TailwindUsageAnalyzer({
  srcPaths: ['src/**/*.{jsx,tsx}', 'pages/**/*.{jsx,tsx}'],
  outputPath: './reports/tailwind-usage.json',
})

analyzer.analyze().then(results => {
  console.log('TailwindCSS Usage Analysis Complete!')
  console.log(`Analyzed ${results.totalFiles} files`)
  console.log(`Found ${results.totalClasses} utility class usages`)
  console.log(`${results.insights.uniqueUtilityCount} unique utilities`)
  console.log(
    `Average ${results.insights.averageClassesPerFile.toFixed(1)} classes per file`
  )

  console.log('\nTop 10 Most Used Utilities:')
  results.insights.mostUsedUtilities.slice(0, 10).forEach(([name, count]) => {
    console.log(`  ${name}: ${count} usages`)
  })

  console.log('\nRecommendations:')
  results.recommendations.forEach(rec => {
    console.log(`  ${rec.type}: ${rec.message}`)
  })
})
```

### Bundle Size Analyzer

```javascript
// scripts/analyze-bundle-size.js
const fs = require('fs')
const gzipSize = require('gzip-size')
const brotliSize = require('brotli-size')

async function analyzeBundleSize(cssFilePath) {
  const css = fs.readFileSync(cssFilePath, 'utf8')
  const originalSize = Buffer.byteLength(css, 'utf8')

  const gzipped = await gzipSize(css)
  const brotlied = await brotliSize(css)

  // Extract utility classes
  const utilities =
    css.match(
      /\.[a-zA-Z][a-zA-Z0-9_-]*(?::[\w-]+)*(?:,\s*\.[a-zA-Z][a-zA-Z0-9_-]*(?::[\w-]+)*)*\s*{[^}]+}/g
    ) || []

  // Categorize utilities
  const categories = {
    layout: 0,
    spacing: 0,
    typography: 0,
    colors: 0,
    borders: 0,
    effects: 0,
    animations: 0,
    responsive: 0,
  }

  let categorySize = { ...categories }

  utilities.forEach(rule => {
    const size = Buffer.byteLength(rule, 'utf8')

    if (/\.(flex|grid|block|inline)/.test(rule)) {
      categorySize.layout += size
    } else if (/\.(p|m|space)-/.test(rule)) {
      categorySize.spacing += size
    } else if (/\.(text|font)-/.test(rule)) {
      categorySize.typography += size
    } else if (
      /\.(bg|text|border)-.+-(50|100|200|300|400|500|600|700|800|900)/.test(
        rule
      )
    ) {
      categorySize.colors += size
    } else if (/\.(border|rounded|ring)/.test(rule)) {
      categorySize.borders += size
    } else if (/\.(shadow|opacity|blur)/.test(rule)) {
      categorySize.effects += size
    } else if (/\.(animate|transition)/.test(rule)) {
      categorySize.animations += size
    } else if (/@media/.test(rule)) {
      categorySize.responsive += size
    }
  })

  return {
    original: originalSize,
    gzipped,
    brotlied,
    utilityCount: utilities.length,
    categoryBreakdown: categorySize,
    compressionRatio: {
      gzip: (originalSize / gzipped).toFixed(2),
      brotli: (originalSize / brotlied).toFixed(2),
    },
  }
}

// Generate size report
async function generateSizeReport(cssPath) {
  const analysis = await analyzeBundleSize(cssPath)

  console.log('CSS Bundle Size Analysis')
  console.log('========================')
  console.log(`Original size: ${(analysis.original / 1024).toFixed(2)} KB`)
  console.log(
    `Gzipped size: ${(analysis.gzipped / 1024).toFixed(2)} KB (${analysis.compressionRatio.gzip}x compression)`
  )
  console.log(
    `Brotli size: ${(analysis.brotlied / 1024).toFixed(2)} KB (${analysis.compressionRatio.brotli}x compression)`
  )
  console.log(`Utility rules: ${analysis.utilityCount}`)

  console.log('\nSize by Category:')
  Object.entries(analysis.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, size]) => {
      const percentage = ((size / analysis.original) * 100).toFixed(1)
      console.log(
        `  ${category}: ${(size / 1024).toFixed(2)} KB (${percentage}%)`
      )
    })
}

// Usage: node scripts/analyze-bundle-size.js dist/styles.css
generateSizeReport(process.argv[2])
```

## Usage Reports

### HTML Report Generator

```javascript
// scripts/generate-usage-report.js
function generateHTMLReport(analysisData) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>TailwindCSS Usage Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    .card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .stat { display: inline-block; margin: 0.5rem 1rem 0.5rem 0; }
    .chart { width: 100%; height: 300px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.5rem; border: 1px solid #ddd; text-align: left; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>TailwindCSS Usage Analysis Report</h1>
  <p>Generated on: ${analysisData.timestamp}</p>
  
  <div class="card">
    <h2>Overview</h2>
    <div class="stat"><strong>${analysisData.totalFiles}</strong> files analyzed</div>
    <div class="stat"><strong>${analysisData.totalClasses}</strong> utility usages</div>
    <div class="stat"><strong>${analysisData.insights.uniqueUtilityCount}</strong> unique utilities</div>
    <div class="stat"><strong>${analysisData.insights.averageClassesPerFile.toFixed(1)}</strong> avg classes/file</div>
  </div>
  
  <div class="card">
    <h2>Top Utility Categories</h2>
    <table>
      <tr><th>Category</th><th>Usage Count</th><th>Percentage</th></tr>
      ${analysisData.insights.topCategories
        .slice(0, 10)
        .map(
          ([cat, count]) => `
        <tr>
          <td>${cat}</td>
          <td>${count}</td>
          <td>${((count / analysisData.totalClasses) * 100).toFixed(1)}%</td>
        </tr>
      `
        )
        .join('')}
    </table>
  </div>
  
  <div class="card">
    <h2>Most Used Utilities</h2>
    <table>
      <tr><th>Utility</th><th>Usage Count</th><th>Files</th></tr>
      ${analysisData.insights.mostUsedUtilities
        .slice(0, 20)
        .map(
          ([util, count]) => `
        <tr>
          <td><code>${util}</code></td>
          <td>${count}</td>
          <td>${Math.round((count / analysisData.totalFiles) * 100)}%</td>
        </tr>
      `
        )
        .join('')}
    </table>
  </div>
  
  <div class="card">
    <h2>Most Complex Files</h2>
    <table>
      <tr><th>File</th><th>Total Classes</th><th>Unique Classes</th><th>Complexity Ratio</th></tr>
      ${analysisData.insights.mostComplexFiles
        .slice(0, 10)
        .map(
          ([file, stats]) => `
        <tr>
          <td><code>${file}</code></td>
          <td>${stats.complexity.total}</td>
          <td>${stats.complexity.unique}</td>
          <td>${stats.complexity.ratio.toFixed(2)}</td>
        </tr>
      `
        )
        .join('')}
    </table>
  </div>
  
  <div class="card">
    <h2>Recommendations</h2>
    <ul>
      ${analysisData.recommendations
        .map(
          rec => `
        <li>
          <strong>${rec.type.replace('-', ' ')}:</strong> ${rec.message}
          ${rec.utilities ? `<br><small>Utilities: ${rec.utilities.join(', ')}</small>` : ''}
          ${rec.files ? `<br><small>Files: ${rec.files.slice(0, 3).join(', ')}</small>` : ''}
          ${rec.categories ? `<br><small>Categories: ${rec.categories.join(', ')}</small>` : ''}
        </li>
      `
        )
        .join('')}
    </ul>
  </div>
</body>
</html>
`

  fs.writeFileSync('./reports/tailwind-usage-report.html', html)
  console.log('HTML report generated: ./reports/tailwind-usage-report.html')
}
```

## Automation and Monitoring

### CI/CD Integration

```yaml
# .github/workflows/tailwind-analysis.yml
name: TailwindCSS Usage Analysis

on:
  pull_request:
    paths:
      - 'src/**/*.{js,jsx,ts,tsx}'
      - 'tailwind.config.js'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TailwindCSS usage analysis
        run: node scripts/analyze-tailwind-usage.js

      - name: Generate size analysis
        run: |
          npm run build:css
          node scripts/analyze-bundle-size.js dist/styles.css > bundle-size-report.txt

      - name: Comment PR with analysis
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const analysis = JSON.parse(fs.readFileSync('./reports/tailwind-usage.json', 'utf8'));
            const sizeReport = fs.readFileSync('bundle-size-report.txt', 'utf8');

            const body = `## 📊 TailwindCSS Analysis

            **Usage Statistics:**
            - Files analyzed: ${analysis.totalFiles}
            - Total utility usages: ${analysis.totalClasses}
            - Unique utilities: ${analysis.insights.uniqueUtilityCount}
            - Average classes per file: ${analysis.insights.averageClassesPerFile.toFixed(1)}

            **Bundle Size:**
            \`\`\`
            ${sizeReport}
            \`\`\`

            **Top Recommendations:**
            ${analysis.recommendations.slice(0, 3).map(rec => `- ${rec.message}`).join('\n')}
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

Remember: **Regular analysis helps maintain optimal TailwindCSS usage and identifies optimization opportunities early!**

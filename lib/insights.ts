import _ from 'lodash';

export interface Insight {
    type: 'summary' | 'correlation' | 'outlier' | 'trend' | 'driver';
    title: string;
    description: string;
    score?: number;
}

export function generateInsights(data: any[]): Insight[] {
    if (!data || data.length === 0) return [];

    const insights: Insight[] = [];
    const headers = Object.keys(data[0]);
    const rowCount = data.length;

    // 1. Basic Summary
    insights.push({
        type: 'summary',
        title: 'Dataset Overview',
        description: `Contains ${rowCount} rows and ${headers.length} columns.`,
        score: 10
    });

    // Identify numeric and categorical columns
    const numericColumns = headers.filter(header => {
        return data.some(row => typeof row[header] === 'number' || !isNaN(Number(row[header])));
    });
    const categoricalColumns = headers.filter(h => !numericColumns.includes(h));

    // 2. NEW: Contribution Analysis (Top Drivers)
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
        categoricalColumns.forEach(catKey => {
            numericColumns.forEach(numKey => {
                const contributionAnalysis = analyzeContributions(data, catKey, numKey);
                if (contributionAnalysis && contributionAnalysis.topContributor.percentage > 40) {
                    const top = contributionAnalysis.topContributor;
                    insights.push({
                        type: 'driver',
                        title: `${catKey} Driver Analysis`,
                        description: `**${top.category}** drives **${top.percentage.toFixed(0)}%** of total ${numKey} (${top.value.toLocaleString()} out of ${contributionAnalysis.total.toLocaleString()}).`,
                        score: top.percentage > 60 ? 9 : 7
                    });
                }
            });
        });
    }

    // 3. Correlations
    if (numericColumns.length >= 2) {
        for (let i = 0; i < numericColumns.length; i++) {
            for (let j = i + 1; j < numericColumns.length; j++) {
                const colA = numericColumns[i];
                const colB = numericColumns[j];

                const valuesA = data.map(r => Number(r[colA]));
                const valuesB = data.map(r => Number(r[colB]));

                const correlation = calculateCorrelation(valuesA, valuesB);

                if (Math.abs(correlation) > 0.7) {
                    const direction = correlation > 0 ? 'positive' : 'negative';
                    insights.push({
                        type: 'correlation',
                        title: `Strong ${direction} correlation`,
                        description: `**${colA}** and **${colB}** are strongly correlated (${correlation.toFixed(2)}).`,
                        score: 8
                    });
                }
            }
        }
    }

    // 4. Outliers with Causality
    numericColumns.slice(0, 3).forEach(col => {
        const values = data.map(r => Number(r[col])).filter(v => !isNaN(v)).sort((a, b) => a - b);
        if (values.length < 10) return;

        const q1 = values[Math.floor((values.length / 4))];
        const q3 = values[Math.ceil((values.length * (3 / 4)))];
        const iqr = q3 - q1;
        const lowerBound = q1 - (1.5 * iqr);
        const upperBound = q3 + (1.5 * iqr);

        const outlierIndices: number[] = [];
        data.forEach((row, idx) => {
            const val = Number(row[col]);
            if (val < lowerBound || val > upperBound) {
                outlierIndices.push(idx);
            }
        });

        if (outlierIndices.length > 0 && outlierIndices.length < data.length * 0.1) {
            const cause = findOutlierCauses(data, col, outlierIndices, categoricalColumns, numericColumns);
            insights.push({
                type: 'outlier',
                title: `Outliers detected in ${col}`,
                description: `Found ${outlierIndices.length} potential outliers in **${col}**. ${cause || ''}`,
                score: 6
            });
        }
    });

    return insights.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8);
}

// NEW: Contribution Analysis
function analyzeContributions(data: any[], categoryKey: string, valueKey: string) {
    const contributionMap: { [key: string]: number } = {};
    let total = 0;

    data.forEach(row => {
        const category = String(row[categoryKey] || 'Unknown');
        const value = Number(row[valueKey]) || 0;
        contributionMap[category] = (contributionMap[category] || 0) + value;
        total += value;
    });

    if (total === 0) return null;

    const contributions = Object.entries(contributionMap)
        .map(([category, value]) => ({
            category,
            value,
            percentage: (value / total) * 100
        }))
        .sort((a, b) => b.value - a.value);

    return {
        topContributor: contributions[0],
        allContributions: contributions,
        total
    };
}

// NEW: Find WHY outliers exist
function findOutlierCauses(
    data: any[],
    outlierKey: string,
    outlierIndices: number[],
    categoricalKeys: string[],
    numericKeys: string[]
): string | null {
    const outlierRows = outlierIndices.map(idx => data[idx]);

    // Check categorical dominance
    for (const catKey of categoricalKeys) {
        const outlierCategories = outlierRows.map(r => r[catKey]);
        const counts: any = {};
        outlierCategories.forEach(cat => {
            counts[cat] = (counts[cat] || 0) + 1;
        });

        const dominant = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0];
        if (dominant && (dominant[1] as number) / outlierIndices.length > 0.6) {
            return `Primarily from **${catKey}**: **${dominant[0]}**.`;
        }
    }

    // Check if driven by another numeric variable
    for (const numKey of numericKeys) {
        if (numKey === outlierKey) continue;

        const outlierAvg = outlierRows.reduce((sum, r) => sum + (Number(r[numKey]) || 0), 0) / outlierRows.length;
        const overallAvg = data.reduce((sum, r) => sum + (Number(r[numKey]) || 0), 0) / data.length;

        if (Math.abs(outlierAvg - overallAvg) / overallAvg > 0.5) {
            const direction = outlierAvg > overallAvg ? 'high' : 'low';
            return `Driven by **${direction} ${numKey}** (${outlierAvg.toFixed(1)} vs ${overallAvg.toFixed(1)}).`;
        }
    }

    return null;
}

function calculateCorrelation(arrA: number[], arrB: number[]): number {
    const n = arrA.length;
    if (n === 0) return 0;

    const meanA = arrA.reduce((a, b) => a + b, 0) / n;
    const meanB = arrB.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomA = 0;
    let denomB = 0;

    for (let i = 0; i < n; i++) {
        const diffA = arrA[i] - meanA;
        const diffB = arrB[i] - meanB;
        numerator += diffA * diffB;
        denomA += diffA ** 2;
        denomB += diffB ** 2;
    }

    if (denomA === 0 || denomB === 0) return 0;
    return numerator / Math.sqrt(denomA * denomB);
}

// Get detailed statistics for each numeric column
export function getDetailedStats(data: any[]) {
    const headers = Object.keys(data[0] || {});
    const stats = headers
        .filter(key => data.some(row => typeof row[key] === 'number' || (!isNaN(Number(row[key])) && row[key] !== '')))
        .map(column => {
            const values = data.map(row => Number(row[column])).filter(v => !isNaN(v));
            const sorted = values.sort((a, b) => a - b);

            return {
                column,
                min: Math.min(...values),
                max: Math.max(...values),
                mean: values.reduce((a, b) => a + b, 0) / values.length,
                median: sorted[Math.floor(sorted.length / 2)],
                count: values.length
            };
        });

    return stats;
}

// Get category distributions
export function getCategoryDistributions(data: any[]) {
    const headers = Object.keys(data[0] || {});
    const rowCount = data.length;

    // Filter for categorical headers with smart heuristics
    const categoricalHeaders = headers.filter(key => {
        // Not numeric
        const isNumeric = data.some(row => typeof row[key] === 'number' || (!isNaN(Number(row[key])) && row[key] !== ''));
        if (isNumeric) return false;

        // Calculate unique values
        const uniqueValues = new Set(data.map(row => String(row[key] || ''))).size;

        // HEURISTIC: 
        // 1. Must have more than 1 value
        // 2. If it has > 20 values AND unique count is > 20% of rows, it's likely an ID/Noise
        if (uniqueValues < 2) return false;
        if (uniqueValues > 20 && uniqueValues > rowCount * 0.2) return false;

        return true;
    });

    return categoricalHeaders.map(column => {
        const valueCounts: { [key: string]: number } = {};
        data.forEach(row => {
            const val = String(row[column] || 'Unknown');
            valueCounts[val] = (valueCounts[val] || 0) + 1;
        });

        const topValues = Object.entries(valueCounts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15); // Show more values for optimization

        return {
            column,
            uniqueCount: Object.keys(valueCounts).length,
            topValues
        };
    }).sort((a, b) => a.uniqueCount - b.uniqueCount); // Prioritize simpler categories
}

/**
 * Generates a forecast using Holt's Linear Trend (Double Exponential Smoothing).
 * Includes pre-processing for data order and basic outlier dampening.
 */
export function generateForecast(data: any[], xAxisKey: string, yAxisKey: string, periods: number = 6) {
    if (!data || data.length < 3) return [];

    // 1. Pre-process and Sort: If the X-axis looks like a date or number, sort it to ensure logical sequence
    const sortedData = [...data].sort((a, b) => {
        const valA = a[xAxisKey];
        const valB = b[xAxisKey];

        // Try date parsing
        const dateA = Date.parse(valA);
        const dateB = Date.parse(valB);
        if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;

        // Try numeric sorting
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

        return 0; // Keep original order for categorical
    });

    const values = sortedData.map(r => Number(r[yAxisKey])).filter(v => !isNaN(v));
    const n = values.length;
    if (n < 3) return [];

    // 2. Outlier Dampening (Simple Winzorization)
    // Reduce the impact of extreme points on the smoothing algorithm
    const sortedValues = [...values].sort((a, b) => a - b);
    const q1 = sortedValues[Math.floor(n * 0.25)];
    const q3 = sortedValues[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const ceiling = q3 + iqr * 2;
    const floor = q1 - iqr * 2;

    const dampenedValues = values.map(v => Math.max(floor, Math.min(ceiling, v)));

    // 3. Holt's Linear Trend (Double Exponential Smoothing)
    const alpha = 0.5; // Slightly higher alpha for better responsiveness to recent changes
    const beta = 0.3;

    // Initialization: level (l) and trend (b)
    let l = dampenedValues[0];
    let b = dampenedValues[1] - dampenedValues[0];

    // Smoothing loop
    for (let i = 1; i < n; i++) {
        const lastL = l;
        l = alpha * dampenedValues[i] + (1 - alpha) * (l + b);
        b = beta * (l - lastL) + (1 - beta) * b;
    }

    // 4. Uncertainty Estimation (Standard Error of Residuals)
    let sumSquaredResiduals = 0;
    let prevLevel = dampenedValues[0];
    let prevTrend = dampenedValues[1] - dampenedValues[0];

    for (let i = 1; i < n; i++) {
        const prediction = prevLevel + prevTrend;
        sumSquaredResiduals += (dampenedValues[i] - prediction) ** 2;

        const nextLevel = alpha * dampenedValues[i] + (1 - alpha) * (prevLevel + prevTrend);
        prevTrend = beta * (nextLevel - prevLevel) + (1 - beta) * prevTrend;
        prevLevel = nextLevel;
    }
    const stdError = Math.sqrt(sumSquaredResiduals / (n - 1));

    const forecast = [];
    for (let i = 1; i <= periods; i++) {
        const prediction = l + (i * b);
        // Dynamic uncertainty: grows over time
        const uncertainty = stdError * (1 + Math.sqrt(i) * 0.6);

        forecast.push({
            [xAxisKey]: `Forecast ${i}`,
            [yAxisKey]: prediction,
            isForecast: true,
            upperBound: prediction + uncertainty,
            lowerBound: Math.max(0, prediction - uncertainty)
        });
    }

    return forecast;
}

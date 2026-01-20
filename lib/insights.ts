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
    const categoricalHeaders = headers.filter(key =>
        !data.some(row => typeof row[key] === 'number' || (!isNaN(Number(row[key])) && row[key] !== ''))
    );

    return categoricalHeaders.map(column => {
        const valueCounts: { [key: string]: number } = {};
        data.forEach(row => {
            const val = String(row[column] || 'Unknown');
            valueCounts[val] = (valueCounts[val] || 0) + 1;
        });

        const topValues = Object.entries(valueCounts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            column,
            uniqueCount: Object.keys(valueCounts).length,
            topValues
        };
    });
}

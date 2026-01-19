import _ from 'lodash';

export interface Insight {
    type: 'summary' | 'correlation' | 'outlier' | 'trend';
    title: string;
    description: string;
    score?: number; // Relevance score
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

    // Identify numeric columns
    const numericColumns = headers.filter(header => {
        return data.some(row => typeof row[header] === 'number' || !isNaN(Number(row[header])));
    });

    // 2. Correlations (Simple Pearson-like or trend check)
    if (numericColumns.length >= 2) {
        for (let i = 0; i < numericColumns.length; i++) {
            for (let j = i + 1; j < numericColumns.length; j++) {
                const colA = numericColumns[i];
                const colB = numericColumns[j];

                // Calculate simple correlation
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

    // 3. Outliers (IQR Method) for first few numeric columns
    numericColumns.slice(0, 3).forEach(col => {
        const values = data.map(r => Number(r[col])).filter(v => !isNaN(v)).sort((a, b) => a - b);
        if (values.length < 10) return;

        const q1 = values[Math.floor((values.length / 4))];
        const q3 = values[Math.ceil((values.length * (3 / 4)))];
        const iqr = q3 - q1;
        const lowerBound = q1 - (1.5 * iqr);
        const upperBound = q3 + (1.5 * iqr);

        const outliers = values.filter(v => v < lowerBound || v > upperBound);

        if (outliers.length > 0) {
            insights.push({
                type: 'outlier',
                title: `Outliers detected in ${col}`,
                description: `Found ${outliers.length} potential outliers in **${col}**.`,
                score: 6
            });
        }
    });

    return insights.sort((a, b) => (b.score || 0) - (a.score || 0));
}

function calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;
    const sumX = _.sum(x);
    const sumY = _.sum(y);
    const sumXY = _.sum(x.map((xi, i) => xi * y[i]));
    const sumX2 = _.sum(x.map(xi => xi * xi));
    const sumY2 = _.sum(y.map(yi => yi * yi));

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

    if (denominator === 0) return 0;
    return numerator / denominator;
}

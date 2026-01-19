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

export interface ColumnStats {
    column: string;
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    count: number;
    maxRow?: any; // The full row containing the max value
    minRow?: any; // The full row containing the min value
}

export function getDetailedStats(data: any[]): ColumnStats[] {
    if (!data || data.length === 0) return [];
    const headers = Object.keys(data[0]);
    const numericColumns = headers.filter(header => {
        return data.some(row => typeof row[header] === 'number' || !isNaN(Number(row[header])));
    });

    return numericColumns.map(col => {
        const validRows = data.filter(r => !isNaN(Number(r[col]))).sort((a, b) => Number(a[col]) - Number(b[col]));
        const values = validRows.map(r => Number(r[col]));
        const count = values.length;

        if (count === 0) return { column: col, mean: 0, median: 0, min: 0, max: 0, stdDev: 0, count: 0 };

        const sum = _.sum(values);
        const mean = sum / count;
        const median = values[Math.floor(count / 2)];
        const min = values[0];
        const max = values[count - 1];
        const sqDiffs = values.map(v => Math.pow(v - mean, 2));
        const stdDev = Math.sqrt(_.sum(sqDiffs) / count);

        // Find the full rows for context
        const maxRow = validRows[count - 1];
        const minRow = validRows[0];

        return { column: col, mean, median, min, max, stdDev, count, maxRow, minRow };
    });
}

export interface CategoryDistribution {
    column: string;
    topValues: { value: string, count: number }[];
}

export function getCategoryDistributions(data: any[]): CategoryDistribution[] {
    if (!data || data.length === 0) return [];
    const headers = Object.keys(data[0]);

    // Identify categorical columns (strings that aren't dates and have < 50% unique values)
    const categoricalColumns = headers.filter(header => {
        const values = data.map(r => String(r[header]));
        const uniqueCount = new Set(values).size;
        const isNumeric = data.some(row => typeof row[header] === 'number' || !isNaN(Number(row[header])));
        return !isNumeric && uniqueCount > 1 && uniqueCount < data.length * 0.8;
    });

    return categoricalColumns.map(col => {
        const counts = _.countBy(data, col);
        const topValues = Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return { column: col, topValues };
    });
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

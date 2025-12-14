// ============================
// Chart Module
// ============================

import { getFilteredWeights } from './weights.js';

let chart = null;

export function updateChart(canvas, emptyState) {
    const filtered = getFilteredWeights();
    const ctx = canvas.getContext('2d');

    if (filtered.length === 0) {
        if (chart) {
            chart.destroy();
            chart = null;
        }
        emptyState.style.display = 'block';
        canvas.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    canvas.style.display = 'block';

    const chartData = filtered.map(w => ({
        x: new Date(w.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        y: w.weight
    }));

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Gewicht',
                data: chartData,
                borderColor: '#30d158',
                backgroundColor: 'rgba(48, 209, 88, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#30d158',
                pointRadius: 4,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            parsing: {
                xAxisKey: 'x',
                yAxisKey: 'y'
            },
            scales: {
                x: {
                    grid: {
                        color: '#333'
                    },
                    ticks: {
                        color: '#888',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        color: '#333'
                    },
                    ticks: {
                        color: '#888',
                        font: {
                            size: 11
                        }
                    },
                    suggestedMin: Math.min(...filtered.map(w => w.weight)) - 2,
                    suggestedMax: Math.max(...filtered.map(w => w.weight)) + 2
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#2c2c2e',
                    titleColor: '#888',
                    bodyColor: '#fff',
                    borderColor: '#444',
                    borderWidth: 1
                }
            }
        }
    });
}

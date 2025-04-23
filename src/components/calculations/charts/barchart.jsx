import { Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";

import HoverInfo from "../../shared/hoverinfo";

function BarChart({ chartData, title, info, label, sourceLink, percentage, highlightMin, style }) {
    const { i18n } = useTranslation();

    var shortCode = "en";
    if (i18n.resolvedLanguage) {
        shortCode = i18n.resolvedLanguage.split('-')[0];
    }

    function getMinValue(ctx) {
        let min = 9999999999;
        const dataset = ctx.chart.data.datasets[0];
        for (const el of dataset.data) {
            min = Math.min(min, el);
        }

        return min;
    }

    const data = {
        labels: chartData.map((e) => e.name),
        datasets: [
            {
                label: label,
                fill: true,
                backgroundColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;

                    if (!chartArea) {
                        return;
                    }

                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);

                    let color = "#000000";
                    if (highlightMin && getMinValue(context) == context.dataset.data[context.dataIndex]) {
                        color = "#f1cb58";
                    }

                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, "#f1cb58");

                    return gradient;
                },
                borderColor: '#f1cb58',
                borderWidth: 1.5,
                data: chartData.map((e) => e.value)
            }
        ]
    };

    const textColor = "rgba(255, 255, 255, 0.87)";

    return (
        <div className="chart-container bar" style={{ ...style }}>
            <div className="chart-title">
                <span>{title}</span>
                <HoverInfo text={info} />
                <HoverInfo text="View calculation code 🔗" icon="code-icon.svg" link={sourceLink} />
            </div>

            <Bar
                data={data}
                options={{
                    responsive: true,
                    interaction: {
                        intersect: false
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function (val) {
                                    if (percentage) {
                                        return val.toFixed(5) + "%";
                                    }
                                    
                                    return val;
                                },
                                color: "#f1cb58",
                                font: {
                                    family: "Noto Sans",
                                    weight: 100
                                },
                                maxTicksLimit: 5
                            },
                            grid: {
                                display: true,
                                color: "#f1cb5850",
                                drawTicks: false
                            }
                        },
                        x: {
                            ticks: {
                                color: "#f1cb58",
                                font: {
                                    family: "Noto Sans",
                                    weight: 100
                                }
                            }
                        }
                    },
                    plugins: {
                        datalabels: {
                            color: "#f6cc4d",
                            align: "bottom",
                            anchor: "end",
                            font: {
                                family: "Noto Sans",
                                weight: 500,
                                size: 14
                            },
                            textStrokeColor: "#00000099",
                            textStrokeWidth: 3,
                            formatter: function (value, context) {
                                if (value <= 0) {
                                    return "";
                                }

                                if (percentage) {
                                    return value.toFixed(5) + "%";
                                }

                                return value;
                            },
                            clamp: true
                        },
                        tooltip: {
                            backgroundColor: "rgba(0,0,0,0.95)",
                            borderWidth: 2,
                            borderColor: "#f6cc4d",
                            caretSize: 0,
                            cornerRadius: 3,
                            displayColors: false,
                            titleColor: textColor,
                            titleFont: {
                                family: "Noto Sans",
                                weight: 500
                            },
                            bodyColor: textColor,
                            bodyFont: {
                                family: "Noto Sans",
                                weight: 400
                            },
                            callbacks: {
                                label: (ctx) => {
                                    const value = ctx.dataset.data[ctx.dataIndex];
                                    let label = ctx.dataset.label || '';

                                    if (percentage) {
                                        return `${value.toFixed(value > 0 ? 5 : 1)}% ${label}`;
                                    }

                                    return `${value} ${label}`
                                }
                            }
                        }
                    }
                }}
            />
        </div>
    );
}

export default BarChart;
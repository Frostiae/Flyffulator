import { Line } from "react-chartjs-2";
import HoverInfo from "./hoverinfo";

function LineChart({ chartData, title, info, label, sourceLink }) {
    const data = {
        labels: chartData.map((_, i) => `Attack #${i + 1}`),
        datasets: [
            {
                label: label,
                fill: true,
                lineTension: 0.5,
                backgroundColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;

                    if (!chartArea) {
                        return;
                    }

                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, "#00000000");
                    gradient.addColorStop(0.5, "#f1cb5850");
                    gradient.addColorStop(1, "#f1cb58");

                    return gradient;
                },
                borderColor: '#f1cb58',
                borderWidth: 1.5,
                data: chartData.map((e) => e.damage)
            }
        ]
    }

    const textColor = "rgba(255, 255, 255, 0.87)";

    function getMaxValue(ctx) {
        let max = 0;
        const dataset = ctx.chart.data.datasets[0];
        for (const el of dataset.data) {
            max = Math.max(max, el);
        }

        return max;
    }

    function getAverageValue(ctx) {
        const values = ctx.chart.data.datasets[0].data;
        return Math.floor(values.reduce((a, b) => a + b, 0) / values.length);
    }

    return (
        <div className="chart-container">
            <div className="chart-title">
                <span>{title}</span>
                <HoverInfo text={info} />
                <HoverInfo text="View calculation code 🔗" icon="code-icon.svg" link={sourceLink} />
            </div>

            <Line
                data={data}
                options={{
                    responsive: true,
                    interaction: {
                        intersect: false
                    },
                    elements: {
                        point: {
                            radius: 0
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
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
                                beforeBody: (ctx) => {
                                    const data = chartData[ctx[0].dataIndex];
                                    let out = "";
                                    if (data.block) {
                                        out += "(Blocked)\n";
                                    }
                                    
                                    if (data.critical) {
                                        out += "(Critical)\n";
                                    }

                                    if (data.miss) {
                                        out += "(Missed)\n";
                                    }

                                    if (data.parry) {
                                        out += "(Parried)\n";
                                    }

                                    if (data.double) {
                                        out += "(Double)\n"
                                    }

                                    if (data.trigger) {
                                        out += "(Triggered skill)\n";
                                    }

                                    return out.slice(0, -1);
                                }
                            }
                        },
                        annotation: {
                            annotations: {
                                test: {
                                    type: "line",
                                    borderColor: "#f1cb5850",
                                    borderWidth: 2,
                                    label: {
                                        display: true,
                                        content: (ctx) => `Average: ${getAverageValue(ctx)}`,
                                        position: "center",
                                        color: textColor,
                                        backgroundColor: "black",
                                        borderRadius: 0,
                                        borderWidth: 1,
                                        borderColor: "#f1cb5850",
                                        shadowOffsetY: 1,
                                        shadowBlur: 2,
                                        backgroundShadowColor: "black"
                                    },
                                    scaleID: "y",
                                    value: (ctx) => getAverageValue(ctx),
                                    shadowOffsetY: 1,
                                    shadowBlur: 2,
                                    borderShadowColor: "black"
                                },
                                maxLabel: {
                                    type: "point",
                                    backgroundColor: textColor,
                                    borderColor: "#f1cb5850",
                                    shadowOffsetY: 1,
                                    shadowBlur: 3,
                                    backgroundShadowColor: "black",
                                    radius: 3,
                                    yValue: (ctx) => getMaxValue(ctx),
                                    xValue: (ctx) => {
                                        const max = getMaxValue(ctx);
                                        const dataset = ctx.chart.data.datasets[0];
                                        const maxIndex = dataset.data.indexOf(max);
                                        return ctx.chart.data.labels[maxIndex];
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            ticks: {
                                maxTicksLimit: 2,
                                color: "#f1cb58",
                                font: {
                                    family: "Noto Sans",
                                    weight: 100
                                }
                            },
                            grid: {
                                display: true,
                                color: "#f1cb5850",
                                drawTicks: false
                            }
                        }
                    }
                }}
            />
        </div>
    );
}

export default LineChart;
<script setup>
import { onBeforeMount, watch } from "vue";
import { Utils } from "../calc/utils";
import VueApexCharts from "vue3-apexcharts";

const props = defineProps(["character", "focusMonsters"]);

var chartOptions = {
    chart: {
        animations: {
            enabled: false,
        },
        toolbar: {
            show: false,
        },
        zoom: {
            enabled: false,
        },
        dropShadow: {
            enabled: true,
            top: 8,
            left: 0,
            blur: 5,
            color: "#1F2342",
            opacity: 0.85,
        },
    },
    stroke: {
        show: true,
        width: 1.3,
        curve: "straight",
    },
    annotations: {
        yaxis: [
            {
                y: 30,
                strokeDashArray: 6,
                label: {
                    text: "Average",
                },
            },
        ],
    },
    markers: {
        size: 1,
        colors: "#008ffb",
    },
    title: {
        text: "EXP:HP Ratio",
        align: "left",
        margin: 10,
        offsetX: 30,
        offsetY: 60,
        floating: false,
        style: {
            fontSize: "21px",
            fontWeight: "500",
            fontFamily: "Roboto",
            color: "rgba(235, 235, 235, 0.945)",
        },
    },
    tooltip: {
        style: {
            color: "#000000",
        },
    },
    fill: {
        opacity: 0.85,
        type: ["gradient"],
        gradient: {
            shade: "dark",
            type: "vertical",
            shadeIntensity: 0.5,
            opacityFrom: 0.55,
            opacityTo: 0,
            stops: [0, 90, 100],
        },
    },
    grid: {
        show: false,
    },
    dataLabels: {
        enabled: false,
    },
    xaxis: {
        type: "categories",
        labels: {
            show: false,
        },
        axisTicks: {
            show: false,
        },
        axisBorder: {
            show: false,
        },
        categories: ["70", "80", "90", "100", "110", "120"],
    },
    yaxis: {
        labels: {
            show: false,
        },
    },
};

const series = [
    {
        name: "Exp:HP Ratio",
        data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43],
    },
];

onBeforeMount(() => updateChart());

watch(
    () => props.focusMonsters,
    () => {
        // current version of vue3-apexcharts has a bug where re-rendering too quick after mounting will cause double
        // render of the chart, resize event will fix it
        updateChart();
        setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
        }, 10);
    }
);

function updateChart() {
    let expPerHP = [];
    let names = [];

    for (let monster of props.focusMonsters) {
        if (monster.experience > 0) {
            const expReward = Utils.getExpReward(monster, props.character.level);
            if (expReward > 0) {
                expPerHP = [...expPerHP, parseFloat((expReward / monster.hp) * 100000 || 0).toFixed(3)];
                names = [...names, "Level " + monster.level + ": " + monster.name.en];
            }
        }
    }

    // Average exp per hp for each monster
    const expHPSum = expPerHP.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
    const expHPAvg = (expHPSum / expPerHP.length).toFixed(3) || 0;

    series[0].data = expPerHP;

    let opts = { ...chartOptions };
    opts.xaxis.categories = names;
    opts.annotations.yaxis[0].y = expHPAvg;
    opts.annotations.yaxis[0].label.text = "Average: " + expHPAvg;
    chartOptions = opts;
}
</script>

<template>
    <div class="box basicchart">
        <VueApexCharts height="230" width="331" type="area" :options="chartOptions" :series="series" />
    </div>
</template>

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
            show: true,
            offsetY: 12,
            tools: {
                download: false,
                selection: false,
                zoom: true,
                zoomin: false,
                zoomout: false,
                pan: false,
                reset: true,
            },
        },
        zoom: {
            enabled: true,
            type: "x",
            autoScaleYaxis: true,
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
    markers: {
        size: 1,
        colors: "#008ffb",
    },
    title: {
        text: "Hits per level",
        align: "left",
        margin: 10,
        offsetX: 30,
        offsetY: 20,
        floating: false,
        style: {
            fontSize: "21px",
            fontWeight: "500",
            fontFamily: "Roboto",
            color: "#F2F2F2",
        },
    },
    tooltip: {
        shared: false,
        followCursor: true,
        x: {
            formatter: (val) => {
                return val;
            },
        },
    },
    grid: {
        show: false,
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
    dataLabels: {
        enabled: true,
        offsetY: -5,
        style: {
            color: "#1F2342",
        },
        background: {
            borderRadius: 0,
            borderColor: "#1F2342",
        },
    },
    xaxis: {
        type: "categories",
        labels: {
            formatter: (val) => {
                if (val) return val.split(" ")[1].slice(0, -1);
            },
            show: true,
            style: {
                colors: "#F2F2F2",
            },
        },
        axisTicks: {
            show: false,
        },
        axisBorder: {
            show: false,
        },
    },
    yaxis: {
        labels: {
            show: false,
        },
    },
};

const series = [
    {
        name: "Hits per Level",
        data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43, 43, 43, 43, 43, 43, 43],
    },
];

onBeforeMount(() => {
    updateChart();
});
watch(
    () => props.focusMonsters,
    () => {
        updateChart();
        // current version of vue3-apexcharts has a bug where re-rendering too quick after mounting will cause double
        // render of the chart, resize event will fix it
        setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
        }, 10);
    }
);

function updateChart() {
    let hitreq = [];
    let names = [];

    for (let monster of props.focusMonsters) {
        const expReward = Utils.getExpReward(monster, props.character.level);
        if (expReward > 0 && monster.hp > 0) {
            let hitsPerKill = monster.hp / monster.playerDamage;
            hitsPerKill = Math.max(hitsPerKill, 1);

            const killsPerLevel = Math.ceil(parseFloat(100 / expReward));

            hitreq = [...hitreq, (hitsPerKill * killsPerLevel).toFixed(0)];
            names = [...names, "level " + monster.level + ": " + monster.name.en];
        }
    }

    series[0].data = hitreq;
    let opts = { ...chartOptions };
    opts.title.text =
        "Hits per Level (" +
        (props.character.focusSkill == -1 ? "Auto Attack" : props.character.focusSkill.name.en) +
        ")";
    opts.xaxis.categories = names;
    opts.tooltip.x.formatter = (val) => {
        return names[val - 1];
    };

    chartOptions = opts;
}
</script>

<template>
    <div class="box bigchart">
        <VueApexCharts height="300" width="800" type="area" :options="chartOptions" :series="series" />
    </div>
</template>

<style scoped lang="scss">
.vue-apexcharts {
    margin-left: -30px;
    margin-right: -20px;
}
</style>

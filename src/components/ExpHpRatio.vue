<template>
  <div class="extensivechart">
      <p id="info">A showcase of the EXP:Health ratio of the monsters around your level.</p>
      <img class="info-tooltip" src='../assets/images/Icons/info.png'>

      <apexchart
      height="230"
      width="331"
      type="area"
      :options="chartOptions"
      :series="series"
    ></apexchart>
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts"

export default {
  name: 'ExpHpRatio',
  components: {
      apexchart: VueApexCharts
  },
  watch: {
    '$root.monsters'() {
      this.update()
    }
  },
  created() { this.update() },
  methods: {
    update() {
      this.monsters = this.$root.monsters
      this.character = this.$root.character.ref
      let expPerHP = []
      let names = []

      this.monsters.forEach(monster => {
        if (monster.experience > 0) {
          const expReward = this.$root.getExpReward(monster, this.character.level)
          if (expReward > 0) {
            expPerHP = [...expPerHP, parseFloat((expReward / monster.hp) * 100000 || 0).toFixed(3)]
            names = [...names, 'Level ' + monster.level + ': ' + monster.name.en]
          }
        }
      })

      // Average exp per hp for each monster
      const expHPSum = expPerHP.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
      const expHPAvg = (expHPSum / expPerHP.length).toFixed(3) || 0;

      this.series[0].data = expPerHP
      this.chartOptions.xaxis.categories = names
      this.chartOptions.annotations.yaxis[0].y = expHPAvg
      this.chartOptions.annotations.yaxis[0].label.text = 'Average: ' + expHPAvg
    }
  },
  data() {
    return {
      character: this.$root.character.ref,
      chartOptions: {
        chart: {
          offsetX: -21,
          offsetY: -45,
          toolbar: {
            show: false
          },
          dropShadow: {
            enabled: true,
            top: 10,
            left: 0,
            blur: 5,
            color: '#1F2342',
            opacity: 0.25
          },
        },
        stroke: {
          show: true,
          width: 3,
          curve: 'smooth',
        },
        annotations: {
          yaxis: [{
          y: 30,
          label: {
              text: 'Average'
          }
          }]
        },
        plotOptions: {
          radar: {
            size: 115,
            polygons: {
              strokeColors: '#7279AA',
              strokeWidth: 0.5,
              connectorColors: '#7279AA'
            }
          }
        },
        markers: {
          colors: '#008ffb'
        },
        title: {
          text: "EXP:Health Ratio",
          align: 'left',
          margin: 10,
          offsetX: 30,
          offsetY: 60,
          floating: false,
          style: {
            fontSize:  '21px',
            fontWeight:  '500',
            fontFamily:  "Roboto",
            color:  '#7279AA'
          }
        },
        tooltip: {
          followCursor: true
        },
        fill: {
          opacity: 0.85,
          type: ['gradient'],
          gradient: {
              shade: 'dark',
              type: "vertical",
              shadeIntensity: 0.5,
              opacityFrom: 1,
              opacityTo: 0,
              stops: [0, 90, 100]
          }
        },
        grid: {
          show: false
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          type: 'categories',
          labels: {
            show: false
          },
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false
          },
          categories: ["70", "80", "90", "100", "110", "120"]
        },
        yaxis: {
          labels: {
            show: false,
          }
        },
      },
      series: [
        {
          name: "exp:hp Ratio",
          data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43],
        },
      ],
    }
  }
}
</script>

<style scoped lang='scss'>

</style>

<template>
  <div class="extensivechart" id="big">
      <p id="info">How many hits (auto-attack or skill, if applicable) it would take to gain one level at each of these monsters at your current level and power.<br>
        The damage used in this calculation takes into consideration your hit rate, critical chance, and more to give an accurate result.</p>
      <img class="info-tooltip" src='../assets/images/Icons/info.png' style="margin-right: 90px; margin-top: 12px">

      <apexchart
      height="400"
      width="800"
      type="line"
      :options="chartOptions"
      :series="series"
    ></apexchart>
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts"

export default {
  name: 'HitsPerLevel',
  components: {
      apexchart: VueApexCharts,
  },
  watch: {
    '$root.monsters'() { this.update() },
    '$root.darkMode'() { this.updateTheme() }
  },
  created() { this.update() },
  methods: {
    updateTheme() {
      let opts = {... this.chartOptions}
      opts.title.style.color = this.$root.hcolor
      // opts.yaxis is undefined when you change the theme back twice? why...?
      // opts.yaxis.labels.style.colors = this.$root.hcolor
      opts.xaxis.labels.style.colors = this.$root.hcolor
      opts.grid.borderColor = this.$root.mainbg
      this.chartOptions = opts
    },
    update() {
      this.monsters = this.$root.monsters
      this.character = this.$root.character.ref
      
      let hitreq = []
      let names = []

      this.monsters.forEach(monster => {
        const expReward = this.$root.getExpReward(monster, this.character.level)
        if (expReward > 0 && monster.hp > 0) {
          let hitsPerKill = monster.hp / monster.playerDamage
          hitsPerKill = hitsPerKill < 1 ? 1 : hitsPerKill
          const killsPerLevel = Math.ceil(parseFloat(100 / expReward))

          hitreq = [...hitreq, (hitsPerKill * killsPerLevel).toFixed(0)]
          names = [...names, 'level ' + monster.level + ': ' + monster.name.en]
        }
      })

      this.series[0].data = hitreq
      this.chartOptions.xaxis.categories = names
      this.chartOptions.tooltip.x.formatter = (val) => {
        return names[val - 1]
      }
    }
  },
  data() {
    return {
      monsters: this.$root.monsters,
      character: this.$root.character.ref,
      chartOptions: {
        chart: {
          animations: {
            enabled: true
          },
          offsetX: 0,
          offsetY: -15,
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
                reset: true
              }
          },
          zoom: {
            enabled: true,
            type: 'x',
            autoScaleYaxis: true
          },
          dropShadow: {
            enabled: true,
            top: 20,
            left: 0,
            blur: 7,
            color: '#1F2342',
            opacity: 0.25
          },
        },
        stroke: {
          show: true,
          width: 4,
          colors: '#008ffb',
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
          text: "Hits per level",
          align: 'left',
          margin: 10,
          offsetX: 30,
          offsetY: 20,
          floating: false,
          style: {
            fontSize:  '21px',
            fontWeight:  '500',
            fontFamily:  "Roboto",
            color:  '#F2F2F2'
          }
        },
        tooltip: {
          shared: false,
          followCursor: true,
          x: {
            formatter: (val) => {
              return val
            }
          }
        },
        grid: {
          show: true,
          borderColor: this.$root.mainbg,
          opacity: 0.5
        },
        dataLabels: {
          enabled: true
        },
        xaxis: {
          type: 'categories',
          labels: {
            formatter: (val) => {
              if (val) return val.split(' ')[1].slice(0, -1)
            },
            show: true,
            style: {
              colors: '#F2F2F2'
            }
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
            show: true,
            style: {
              colors: '#F2F2F2'
            }
          }
        },
      },
      series: [
        {
          name: "Hits per level",
          data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43, 43, 43, 43, 43, 43, 43],
        },
      ],
    }
  }
}
</script>

<style scoped lang='scss'>

</style>

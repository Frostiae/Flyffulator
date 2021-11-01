<template>
  <div class="generalstats">
      <apexchart
      height="300"
      width="400"
      type="radar"
      :options="chartOptions"
      :series="series"
    ></apexchart>
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts"

export default {
  name: 'TopStats',
  components: {
      apexchart: VueApexCharts
  },
  created() { this.update() },
  watch: {
    '$root.character.ref.str'() {
      this.update()
    },
    '$root.character.ref.sta'() {
      this.update()
    },
    '$root.character.ref.dex'() {
      this.update()
    },
    '$root.character.ref.int'() {
      this.update()
    }
  },
  methods: {
    update() {
      this.character = this.$root.character.ref

      this.series[0].data[3] = this.character.sta * 2 < 100 ? this.character.sta * 2 : 100                                                    // Defense
      this.series[0].data[0] = (this.character.str * this.character.dex) / 10 < 100 ? (this.character.str * this.character.dex) / 10 : 100;   // Auto attack
      this.series[0].data[2] = (this.character.str * this.character.int) / 10 < 100 ? (this.character.str * this.character.int) / 10 : 100;   // Skill
    }
  },
  data() {
    return {
      character: this.$root.character,
      chartOptions: {
        chart: {
          animations: {
            enabled: false
          },
          toolbar: {
            show: false
          },
          dropShadow: {
            enabled: true,
            top: 10,
            left: 0,
            blur: 5,
            color: '#000',
            opacity: 0.25
          },
        },
        stroke: {
          show: true,
          width: 3,
          colors: [],
          dashArray: 0
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
          size: 4,
          hover: {
            sizeOffset: 5
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
              shade: 'dark',
              type: "horizontal",
              shadeIntensity: 0.5,
              opacityFrom: 0.8,
              opacityTo: 0.8,
              stops: [0, 90, 100]
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: ['Auto Attack', 'Support', 'Skill', 'Defense', 'Leveling'],
          labels: {
            show: true,
            style: {
              colors: ['#7279AA', '#7279AA', '#7279AA', '#7279AA', '#7279AA', '#7279AA'],
              fontFamily: 'Roboto',
              fontSize: '12px',
              fontWeight: '700'
            }
          }
        },
        yaxis: {
          show: false
        }
      },
      series: [
        {
          name: "ability",
          data: [80, 10, 30, 40, 74],
        },
      ],
    }
  }
}
</script>

<style scoped lang='scss'>

</style>

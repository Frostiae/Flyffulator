<template>
  <div>
    <div class="big-chart-disclaimer">
      <h5>Your screen size is too small to view large charts.</h5>
    </div>
    <div class="extensivechart" id="big">
      <div class="infoblock" id="chart">
          <apexchart
          height="320"
          width="640"
          type="area"
          :options="chartOptions"
          :series="series"
          ></apexchart>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AutoRatio',
  data() {
    return {
      character: this.$root.character.ref,
      monsters: this.$root.monsters,
      chartOptions: {
        chart: {
          animations: {
            enabled: false
          },
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
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
          points: [{
              x: 20,
              y: 20,
              marker: {
                  size: 8,
                  radius: 2,
                  fillColor: '#0485E6',
                  strokeColor: this.$root.hcolor
              },
              label: {
                  style: {
                      color: '#fff',
                      background: '#0485E6',
                  },
                  text: 'Point'
              }
          }],
          yaxis: [{
              y: 20,
              width: '0%',
              label: {
                  text: 'more DEX',
                  textAnchor: 'start',
                  borderWidth: 0,
                  position: 'left',
                  offsetX: 10,
                  style: {
                      background: '#ffffff00',
                      color: '#fff'
                  }
              }
          },
          {
              y: 20,
              width: '0%',
              label: {
                  borderWidth: 0,
                  text: 'more STR',
                  textAnchor: 'end',
                  position: 'right',
                  offsetX: -10,
                  style: {
                      background: '#ffffff00',
                      color: '#fff'
                  }
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
          text: "STR:DEX Auto Attack DPS",
          align: 'left',
          margin: 10,
          offsetX: 30,
          offsetY: 20,
          floating: false,
          style: {
            fontSize:  '21px',
            fontWeight:  '500',
            fontFamily:  "Roboto",
            color:  this.$root.hcolor
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
          tickAmount: 6,
          min: 0,
          forceNiceScale: true,
          labels: {
            show: true,
            style: {
                colors: this.$root.hcolor
            }
          },
          title: {
              show: true,
              text: "DPS",
              style: {
                  color: this.$root.hcolor
              }
          }
        },
      },
      series: [
        {
          name: "DPS",
          data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43],
        },
      ],
    }
  },
  mounted() {
    this.getTheoreticalAADPS();
  },
  watch: {
    '$root.monsters'() { this.monsters = this.$root.monsters; },
    '$root.darkMode'() { this.updateTheme() },
    '$root.character.ref.level'() { this.getTheoreticalAADPS(); },
    '$root.character.ref.assistBuffs'() { this.getTheoreticalAADPS(); },
    '$root.character.ref.selfBuffs'() { this.getTheoreticalAADPS(); },
    '$root.character.ref.weapon'() { this.getTheoreticalAADPS(); },
    '$root.character.ref.armor'() { this.getTheoreticalAADPS(); }
  },
  methods: {
    updateTheme() {
      let opts = { ...this.chartOptions }
      opts.title.style.color = this.$root.hcolor
      this.chartOptions = opts
    },
    getTheoreticalAADPS() {
        this.character = this.$root.character.ref;
        // This is apparently the easiest and best way to clone an instance of a class...
        let clone = Object.assign(Object.create(Object.getPrototypeOf(this.character)), this.character);

        let focus = this.$root.focusMonster;
        if (!focus) return;

        const result = clone.getOptimalAutoRatio(focus);

        // Updating the chart
        this.series[0].data = result.dpsValues;

        let opts = {...this.chartOptions};
        opts.xaxis.categories = result.ratios;
        opts.annotations.points[0].y = result.maxDPS;
        opts.annotations.points[0].x = result.maxRatio;
        opts.annotations.points[0].label.text = result.ratios[result.maxRatio - 1]
        this.chartOptions = opts;
    }
  }
}
</script>

<style scoped lang='scss'>
.extensivechart#big {
    height: 350px !important;
    width: 630px !important;
}
</style>

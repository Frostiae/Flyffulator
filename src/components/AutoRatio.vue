<template>
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
        clone.level = clone.level < 15 ? 15 : clone.level;

        //let focus = this.monsters.find(monster => monster.level >= clone.level) || this.monsters.slice(-1)[0];
        let focus = this.$root.focusMonster;
        if (!focus) return;

        const extraBuffSTR = clone.getExtraBuffParam('str');
        const extraBuffSTA = clone.getExtraBuffParam('sta');
        const extraBuffDEX = clone.getExtraBuffParam('dex');
        const extraBuffINT = clone.getExtraBuffParam('int');

        const extraGearSTR = clone.getExtraGearParam('str');
        const extraGearDEX = clone.getExtraGearParam('dex');

        const baseSTR = 15 + extraGearSTR;
        const baseDEX = 15 + extraGearDEX;

        clone.str = baseSTR + extraBuffSTR;
        clone.dex = baseDEX + extraBuffDEX;
        clone.sta = 15 + extraBuffSTA;  // We don't even use these in this calculation
        clone.int = 15 + extraBuffINT;

        let res = [];
        let ratios = [];

        // Find DPS values for 10 different ratios of dex:str
        let maxDPS = -1;
        let maxRatio = -1;
        for (let i = 0; i < 10; i++) {
            // get str:dex ratio
            // Need to get remaining points explicitly here since it doesn't update till update().
            const points = clone.getRemainingPoints();
            
            // Add Equipment base stats
            clone.str = baseSTR + extraBuffSTR;
            clone.dex = baseDEX + extraBuffDEX;

            let str = Math.floor(points * (i / 10));
            let dex = points - str;

            // Minimum is 15 stats, don't go below that
            clone.str += str < 15 ? 15 : str;
            clone.dex += dex < 15 ? 15 : dex;

            // Update all the stats and information
            clone.update();

            let dps = parseInt(clone.getDPS(focus).toFixed(0));
            let ratio = `Allocate ${str} STR: ${dex} DEX`;
            res = [...res, dps];
            ratios = [...ratios, ratio]

            if (dps > maxDPS || maxDPS == -1) {
                maxDPS = dps;
                maxRatio = i + 1;
            }

            // Reset the stats back so remainingPoints() returns default values again
            clone.str = 15 + extraBuffSTR;
            clone.dex = 15 + extraBuffDEX;
        }

        // Updating the chart
        this.series[0].data = res;

        let opts = {...this.chartOptions};
        opts.xaxis.categories = ratios;
        opts.annotations.points[0].y = maxDPS;
        opts.annotations.points[0].x = maxRatio;
        opts.annotations.points[0].label.text = ratios[maxRatio - 1]
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

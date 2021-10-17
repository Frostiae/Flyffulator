var expoptions = {
  series: [{
    name: 'Kills Required',
    data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43]
  }],
    chart: {
      height: 230,
      width: 331,
      zoom: {
          enabled: false
        },
      type: 'area',
      toolbar: {
          show: false
      },
      dropShadow: {
        enabled: true,
        top: 10,
        left: 0,
        blur: 5,
        color: '#1F2342',
        opacity: 0.15
      },
      stacked: false
  },
  annotations: {
    yaxis: [{
      y: 30,
      label: {
        text: 'Average'
      }
    }]
  },
  stroke: {
    width: 3,
    curve: 'smooth',
  },
  markers: {
    colors: '#008ffb'
  },
  title: {
    text: "Kills/level",
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
  legend: {
    show: false
  }
};

var exphpoptions = {
  series: [{
    name: 'exp:hp Ratio',
    data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43]
  }],
    chart: {
      height: 230,
      width: 331,
      zoom: {
          enabled: false
        },
      type: 'area',
      toolbar: {
          show: false
      },
      dropShadow: {
        enabled: true,
        top: 10,
        left: 0,
        blur: 5,
        color: '#1F2342',
        opacity: 0.15
      },
      stacked: false
  },
  annotations: {
    yaxis: [{
      y: 30,
      label: {
        text: 'Average'
      }
    }]
  },
  stroke: {
    width: 3,
    curve: 'smooth',
  },
  markers: {
    colors: '#008ffb'
  },
  tooltip: {
    followCursor: true
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
      minWidth: 10
    }
  },
  legend: {
    show: false
  }
};

var hitperleveloptions = {
  series: [{
    name: 'Hits per level',
    data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43]
  }],
    chart: {
      height: 400,
      width: 800,
      zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true
        },
      type: 'line',
      toolbar: {
          show: true,
          offsetY: 20,
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
      dropShadow: {
        enabled: true,
        top: 30,
        left: 0,
        blur: 7,
        color: '#1F2342',
        opacity: 0.15
      },
      stacked: false
  },
  stroke: {
    width: 4,
    colors: '#008ffb'
  },
  markers: {
    colors: '#008ffb'
  },
  dataLabels: {
    enabled:true
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
      color:  '#7279AA'
    }
  },
  grid: {
    show: true,
    borderColor: '#1F2342',
  },
  xaxis: {
    type: 'categories',
    labels: {
      show: true,
      style: {
        colors: '#7279AA'
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
        colors: '#7279AA'
      }
    }
  },
  tooltip: {
    shared: false,
    followCursor: true,
    x: {}
  },
  legend: {
    show: false
  }
};

var radaroptions = {
  series: [{
  name: 'Ability',
  data: [80, 10, 30, 40, 74],
  }],
  chart: {
  height: 300,
  type: 'radar',
  toolbar: {
    show: false
  },
  dropShadow: {
    enabled: true,
    top: 10,
    left: 0,
    blur: 3,
    color: '#000',
    opacity: 0.25
  }
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
  title: {
    show: false
  },
  dataLabels: {
    enabled: false,
    background: {
      enabled: true,
      borderRadius: 3
    }
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
};

var exphpchart = new ApexCharts(document.querySelector("#exphpchart"), exphpoptions);
var expchart = new ApexCharts(document.querySelector("#chart"), expoptions);
var hitsperlevelchart = new ApexCharts(document.querySelector("#hitsperlevelchart"), hitperleveloptions);
var radarchart = new ApexCharts(document.querySelector("#radarchart"), radaroptions);

radarchart.render();
expchart.render();
exphpchart.render();
hitsperlevelchart.render();

export { expchart, exphpchart, radarchart, hitsperlevelchart }
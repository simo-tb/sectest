function checkForChartRendering() {
    var charts = document.querySelectorAll('[data-tb-apex-chart]');

    console.log("CHARTS:", charts);
    if (!charts || !charts.length) return;

    
    for (let idx = 0, l = charts.length; idx < l; idx++) {
        let el = charts[idx];
        console.log("CHECK_EL:", el);
        let chart= el.dataset.tbApexChart;

        let parsed_data = JSON.parse(chart).chart;

        console.log("PARSED_DATA:", parsed_data);

        if (_.get(parsed_data, "error_message")) {
            console.log(parsed_data.error_message);
            el.innerHTML = "<h2 class='m-5' style='white-space: pre-wrap; line-height: 1.5'>" + _.get(parsed_data, "error_message") + "</h2>";
            return;
        }

        if (parsed_data.type === "bar" || parsed_data.type === "line") {
            renderChart(parsed_data, el);
        }
        else if (parsed_data.type === "pie") {
            renderPieChart(parsed_data, el);
        }
    }
}

function renderPieChart(data, el) {
  console.log("CHECK_PIE_DATA:", data);
  
  let dataset = _.get(data, "data.datasets");

  let dataset_arr = dataset[0];
    
  if (dataset_arr == null) { 
    el.innerHTML = "<h1 class='text-center m-5'>No results - chart cannot be displayed</h1>";
    return;
  } 
  
  let options = {
    title: {
        text: _.get(data, "chart_name"),
        align: 'center',
        margin: 100,
        style: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'gray'
        },
    },
    series: _.get(dataset_arr, "data") || [],
    chart: {
      width: '100%',
      height: 700,
      type: "pie",
      events: {
        legendClick: function(chartContext, seriesIndex, config) {
//          alert(chartContext.w.globals.series[seriesIndex]);
        }
      }
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
      }
    },
    theme: {
      mode: document.body.classList.contains('tinyapp-dark') ? 'dark' : 'light',
    },
    labels: _.get(data, "data.labels"),
    legend: {
      show: true,
      showForSingleSeries: true,
      position: 'bottom',
      onItemHover: {
          highlightDataSeries: true
      },
      onItemClick: {
          toggleDataSeries: true
      },
    },
    tooltip: { 
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        return (
          '<div class="charts_tooltip_box">' +
          "<span>" +
          series[seriesIndex] +
          " " +
          data.axis_options.scales.yAxes[0].id +
          "</span>" +
          "</div>"
        );
      },
      onDatasetHover: {
          highlightDataSeries: false,
      },
      shared: true,
      intersect: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: "bottom"
          }
        }
      }
    ]
  };

  console.log("CHECK_PIE_CHART_OPTIONS:", options);

  el.classList.add(`tb-chart-${data.type}`);

  var chart = new ApexCharts(el, options);

  chart.render();

  window.addEventListener('change_theme', () => {
    chart.updateOptions({
      theme: {
         mode: document.body.classList.contains('tinyapp-dark') ? 'dark' : 'light',
      }
    });
  });
}

function renderChart(data, el) {
  let formatted_datasets = [];
  let formatted_yaxes = [];

  data.data.datasets.forEach(dataset => {
    let dataset_obj = {
      name: dataset.label,
      data: dataset.data
    };

    formatted_datasets.push(dataset_obj);
  });

  console.log("FORMATTED_DATASETS:", formatted_datasets);
  if (formatted_datasets.length == 0) {
    el.innerHTML = "<h1 class='text-center m-5'>No results - chart cannot be displayed</h1>";
    return;
  }

  let yaxis_counter = 0;

  data.axis_options.scales.yAxes.forEach(yAxis => {
    yaxis_counter++;
    let label_font_size = _.get(yAxis, "scaleLabel.fontSize");
    let render_axis_at_right_side = yaxis_counter % 2 == 0;
    let label_x_offset = render_axis_at_right_side ? 10 : -10;

    let yaxis_obj = {
      show: true,
      showForNullSeries: false,
      showAlways: false,
      opposite: yaxis_counter % 2 == 0,
      seriesName: yAxis.id,
      min: _.get(yAxis, "ticks.min"),
      max: _.get(yAxis, "ticks.max"),
      labels: {
        show: _.get(yAxis, "scaleLabel.display"),
        style: {
          colors: [_.get(yAxis, "scaleLabel.fontColor")],
          fontSize: `12px`
        },
      },
      axisTicks: {
        show: true,
        color: _.get(yAxis, "ticks.fontColor")
      },
      title: {
        text: _.get(yAxis, "scaleLabel.labelString") || yAxis.id,
        rotate: -90,
        offsetX: label_x_offset,
        style: {
          fontSize: `${label_font_size}px`,
          color: _.get(yAxis, "scaleLabel.fontColor"),
          fontFamily: 'Helvetica, Arial, sans-serif',
          cssClass: 'apexcharts-yaxis-title'
        },
      },
    };

    formatted_yaxes.push(yaxis_obj);
  });

  console.log("FORMATTED_Y_AXIS:", formatted_yaxes);

  var options = {
    title: {
        text: _.get(data, "chart_name"),
        align: 'center',
        margin: 10,
        style: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'gray'
        },
    },
    chart: {
      height: 750,
      type: data.type,
      stacked: false
    },
    theme: {
      mode: document.body.classList.contains('tinyapp-dark') ? 'dark' : 'light',
    },
    dataLabels: {
      enabled: false
    },
    colors: ["#00FF55", "#FF1654", "#247BA0", "#FF00FF", "#0dc54d", "#c3be3a"],
    labels: _.get(data, "data.labels"),
    legend: {
      show: true,
      showForSingleSeries: true,
      position: 'bottom',
      onItemHover: {
          highlightDataSeries: true
      },
      tooltipHoverFormatter: function(seriesName, opts) {
        return seriesName + ' - <strong>' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + '</strong>'
      },
    },
    series: formatted_datasets,
    stroke: {
      show: true,	
      width: [4, 4]
    },
    plotOptions: {
      bar: {
        columnWidth: "100%"
      }
    },
    xaxis: {
      categories: _.get(data, "data.labels"),
    },
    yaxis: formatted_yaxes,
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        show: false
      }
    },
  };

  el.classList.add(`tb-chart-${data.type}`);

  var chart = new ApexCharts(el, options);

  chart.render();

  window.addEventListener('change_theme', () => {
    chart.updateOptions({
      theme: {
         mode: document.body.classList.contains('tinyapp-dark') ? 'dark' : 'light',
      }
    });
  });
}

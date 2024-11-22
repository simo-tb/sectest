/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc Telebid's charting library
 * @module TB
 * @memberOf TB
 */
(function(root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = root.TB = factory(
      require('lodash'),
      require('chartjs'),
      require('tb.xerrors'),
    );
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'chartjs', 'tb.xerrors'], function() {
      return (root.TB.ChartJs = factory(root._, root.Chart, root.TB));
    });
  } else {
    root.TB.ChartJs = factory(root._, root.Chart, root.TB);
  }
})(this, function(_, Chart, TB) {
  var DEFAULTS_OPTIONS = {
    scales: {},
  };
  var DEFAULT_AXIS = {
    ticks: {
      beginAtZero: true,
    },
  };
  var DEFAULTS_DATASETS_ANY = {};

  var DEFAULTS_DATASETS_LINE = {
    type: 'line',
    borderWidth: 2,
    fill: false,
  };

  var DEFAULTS_DATASETS_AREA = {
    type: 'line',
    borderWidth: 2,
    fill: true,
  };

  var DEFAULTS_DATASETS_BAR = {
    type: 'bar',
    borderWidth: 1,
    fill: true,
  };

  var DEFAULTS_DATASETS_PIE = {
    type: 'pie',
    $$eachValueDifferentColor: true,
  };

  var DEFAULTS_DATASETS = {
   // line: _.defaults({}, DEFAULTS_DATASETS_LINE, DEFAULTS_DATASETS_ANY),
    bar: _.defaults({}, DEFAULTS_DATASETS_BAR, DEFAULTS_DATASETS_ANY),
   // area: _.defaults({}, DEFAULTS_DATASETS_AREA, DEFAULTS_DATASETS_ANY),
    pie: _.defaults({}, DEFAULTS_DATASETS_PIE, DEFAULTS_DATASETS_ANY)
  };

  function TbChart(el, settings) {
    this.el = el;
    this.s = settings;
    this.s.bgAlpha = 0.5;
    this.s.borderAlpha = 0.75;
    this.s.axisBeginAtZero = 0.75;
    this.chartType = this.s.chart.type;
    this._init();
    this._render();
  }

  /**
   * Initialize
   */
  TbChart.prototype._init = function() {
    TB.ASSERT(_.isObject(this.s), {
      code: 'TBJS/ChartJs/10001',
      msg: '`s` must be an object',
      msgParams: { SETTINGS: this.s },
    });
    TB.ASSERT(_.isObject(this.s.chart), {
      code: 'TBJS/ChartJs/10002',
      msg: '`s.chart` must be an object',
      msgParams: { CHART: this.s.chart },
    });
    TB.ASSERT(_.isString(this.s.chart.type), {
      code: 'TBJS/ChartJs/100012',
      msg: '`s.chart.type` must be a string',
      msgParams: { DATA: this.s.chart.type },
    });

    this._initOptions();
    this._initData();
  };

  TbChart.prototype._initOptions = function() {
    this.s.chart.options = _.defaults(this.s.chart.options, DEFAULTS_OPTIONS);

    var options = this.s.chart.options;

    TB.ASSERT(_.isNil(options) || _.isObject(options), {
      code: 'TBJS/ChartJS/12000',
      msg: '`options` must be an object, but $VAL$',
      msgParams: { VAL: options },
    });
    TB.ASSERT(_.isNil(options.scales) || _.isObject(options.scales), {
      code: 'TBJS/ChartJS/12001',
      msg: '`options.scales` must be an object, but $VAL$',
      msgParams: { VAL: options.scales },
    });
    TB.ASSERT(
      _.isNil(options.scales.yAxes) || _.isArray(options.scales.yAxes),
      {
        code: 'TBJS/ChartJS/12002',
        msg: '`options.scales.yAxes` must be an object, but $VAL$',
        msgParams: { VAL: options.scales.yAxes },
      },
    );

    if (!_.isArray(options.scales.yAxes)) {
      options.scales.yAxes = [_.cloneDeep(DEFAULT_AXIS)];
    }

    for (var idx = 0, l = options.scales.yAxes.length; idx < l; idx++) {
      var axis = options.scales.yAxes[idx];

      axis = _.defaults(axis, DEFAULT_AXIS);

      TB.ASSERT(_.isNil(axis) || _.isObject(axis), {
        code: 'TBJS/ChartJS/12003',
        msg: '`axis` must be an object, but $VAL$',
        msgParams: { VAL: axis },
      });
      TB.ASSERT(_.isNil(axis.ticks) || _.isObject(axis.ticks), {
        code: 'TBJS/ChartJS/12004',
        msg: '`axis.ticks` must be an object, but $VAL$',
        msgParams: { VAL: axis.ticks },
      });
      TB.ASSERT(
        _.isNil(axis.ticks.beginAtZero) || _.isBoolean(axis.ticks.beginAtZero),
        {
          code: 'TBJS/ChartJS/12005',
          msg: '`axis.ticks.beginAtZero` must be an object, but $VAL$',
          msgParams: { VAL: axis.ticks.beginAtZero },
        },
      );
    }
  };

  TbChart.prototype._initData = function() {
    var data = this.s.chart.data;

    TB.ASSERT(_.isObject(data), {
      code: 'TBJS/ChartJs/100011',
      msg: '`data` must be an object',
      msgParams: { DATA: data },
    });
    TB.ASSERT(_.isArray(data.datasets), {
      code: 'TBJS/ChartJs/10003',
      msg: '`data.datasets` must be an array',
      msgParams: { DATASETS: data.datasets },
    });
    TB.ASSERT(_.isArray(data.labels), {
      code: 'TBJS/ChartJs/10010',
      msg: '`data.labels` must be an array',
    });

    TB.ASSERT(_.includes(Object.keys(DEFAULTS_DATASETS), this.s.chart.type), {
      code: 'TBJS/ChartJs/10011',
      msg: '`type` must be a string and one of $TYPES$, but given `$TYPE$`',
      msgParams: {
        TYPES: Object.keys(DEFAULTS_DATASETS),
        TYPE: this.s.chart.type,
      },
    });

    this.s.chart.type = DEFAULTS_DATASETS[this.s.chart.type].type;

    for (var idx = 0, l = data.datasets.length; idx < l; idx++) {
      var dataset = this.s.chart.data.datasets[idx];

      TB.ASSERT(_.includes(Object.keys(DEFAULTS_DATASETS), dataset.type), {
        code: 'TBJS/ChartJs/10007',
        msg:
          '`dataset.type` must be a string and one of $TYPES$, but given `$TYPE$`',
        msgParams: {
          TYPES: Object.keys(DEFAULTS_DATASETS),
          TYPE: dataset.type,
        },
      });

      dataset = _.defaults(dataset, DEFAULTS_DATASETS[dataset.type]);
      // dataset.type = DEFAULTS_DATASETS[dataset.type].type;

      TB.ASSERT(_.isArray(dataset.data), {
        code: 'TBJS/ChartJs/10004',
        msg: '`dataset.data` must be an array',
      });
      TB.ASSERT(
        _.isNil(dataset.borderColor) ||
          _.isArray(dataset.borderColor) ||
          _.isString(dataset.borderColor),
        {
          code: 'TBJS/ChartJs/10005',
          msg: '`dataset.borderColor` must be either array, string or nil',
        },
      );
      TB.ASSERT(
        _.isNil(dataset.backgroundColor) ||
          _.isArray(dataset.backgroundColor) ||
          _.isString(dataset.backgroundColor),
        {
          code: 'TBJS/ChartJs/10006',
          msg: '`dataset.backgroundColor` must be either array, string or nil',
        },
      );
      TB.ASSERT(_.isString(dataset.label), {
        code: 'TBJS/ChartJs/10008',
        msg: '`dataset.label` must be a string',
      });

      delete dataset.type;
    }

    var foo = {
      // options: { responsive: true },
      // `
    };

    this.s.chart.options = foo.options;
  };

  TbChart.prototype._getChartJSPlugins = function() {
    return [this._getRandomColorPlugin()];
  };

  TbChart.prototype._getRandomColorPlugin = function() {
    var s = this.s;

    return {
      beforeUpdate: function(chart) {
        for (
          var idx = 0, l = chart.config.data.datasets.length;
          idx < l;
          idx++
        ) {
          var dataset = chart.config.data.datasets[idx];
          var bgColors = [];
          var borderColors = [];
          var color;

          if (s.eachValueDifferentColor || dataset.$$eachValueDifferentColor) {
            for (
              var dataIdx = 0, dataL = dataset.data.length;
              dataIdx < dataL;
              dataIdx++
            ) {
              // if you want it truly unique, change one of the `dataIdx` below with `idx`
              var uniqueHash = Math.pow(2, dataIdx) * Math.pow(3, dataIdx);

              color = Chart.helpers.color('#' + TB.generateColor(uniqueHash));

              bgColors.push(color.alpha(s.bgAlpha).rgbString());
              borderColors.push(color.alpha(s.borderAlpha).rgbString());
            }
          } else {
            color = Chart.helpers.color(
              '#' + TB.generateColor(Math.tan(idx + 2)),
            );

            bgColors = color.alpha(s.bgAlpha).rgbString();
            borderColors = color.alpha(s.borderAlpha).rgbString();
          }

          // TODO optimize this by not runnings the above code
          chart.config.data.datasets[idx].backgroundColor =
            chart.config.data.datasets[idx].backgroundColor || bgColors;
          chart.config.data.datasets[idx].borderColor =
            chart.config.data.datasets[idx].borderColor || borderColors;
        }
      },
    };
  };

  TbChart.prototype._setBackgroundColorPlugin = function(opts) {
    var isDark = document.getElementsByTagName('html')[0].classList.contains('dark');
    
    opts = _.defaults(
      opts,
      { color: isDark ? 'rgb(40, 40, 40)' : 'white' },
    ); 

    return {
      beforeDraw: function(chartInstance) {
        var ctx = chartInstance.chart.ctx;
        ctx.fillStyle = opts.color;
        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    
        Chart.defaults.global.defaultFontColor = isDark ? 'white' : '#666';

        if (chartInstance.config.type !== 'pie') {
          let gridColor = isDark ? 'rgb(70,70,70)' : 'rgba(0, 0, 0, 0.1)';

          chartInstance.scales['x-axis-0'].options.gridLines.color = gridColor;
//          chartInstance.scales['y-axis-0'].options.gridLines.color = gridColor;
        }
      },
    }; 
  };

  TbChart.prototype._render = function() {
    // this works on 2.5.0 and later
    this.s.chart.plugins = this._getChartJSPlugins();
    Chart.pluginService.register(this._getRandomColorPlugin());
    Chart.pluginService.register(this._setBackgroundColorPlugin());

    var el = this.el;

    if (this.el.nodeName.toLowerCase() !== 'canvas') {
      this.el.innerHTML = [
        '<div style="margin: auto; position: relative; width: 80%; height: 80%">',
        '<div style="display: block; position: relative; float: right;' +
          'margin-right: 25px; margin-top: 5px; font-size: 25px;">',
        '<i class="fa fa-bar-chart make-bar" aria-hidden="true"' +
          'style="cursor: pointer; margin: 5px;" title="Bar Chart"></i>',
    //    '<i class="fa fa-line-chart make-line" aria-hidden="true"' +
    //     'style="cursor: pointer; margin: 5px;" title="Line Chart"></i>',
    //     '<i class="fa fa-area-chart make-area" aria-hidden="true"' +
    //      'style="cursor: pointer; margin: 5px;" title="Area Chart"></i>',
        '<i class="fa fa-pie-chart make-pie" aria-hidden="true"' +
          'style="cursor: pointer; margin: 5px;" title="Pie Chart"></i>',
        '</div>',
        '<canvas>',
        '</canvas>',
        '</div>',
      ].join('');

      var self = this;

      var makeLines = this.el.getElementsByClassName('make-line');
      for(var i = 0; i < makeLines.length; i++) {
        makeLines[i].addEventListener('click', function () { self.setChartType('line'); });
      }

      var makeBars = this.el.getElementsByClassName('make-bar');
      for(var i = 0; i < makeBars.length; i++) {
        makeBars[i].addEventListener('click', function () { self.setChartType('bar'); });
      }

      var makeAreas = this.el.getElementsByClassName('make-area');
      for(var i = 0; i < makeAreas.length; i++) {
        makeAreas[i].addEventListener('click', function () { self.setChartType('area'); });
      }

      var makePies = this.el.getElementsByClassName('make-pie');
      for(var i = 0; i < makePies.length; i++) {
        makePies[i].addEventListener('click', function () { self.setChartType('pie'); });
      }

      el = this.el.querySelector('canvas');
    }

    ASSERT(el, { code: 'TBJS/ChartJS/13000', msg: 'Failed to insert canvas!' });
    
    if(this.s.chart.type != "pie")
    {
        this.s.chart.options = this.s.chart.axis_options;
    }

    this.chart = new Chart(el, this.s.chart);
  };

  /**
   * Although in the chartJS documentation is written that you can use the update()
   * method to change the chart.data object, changing the chart type and calling
   * update() causes the chart to not function properly (e.g., the pie chart isn't
   * being rendered at all, the other charts don't fill the specified canvas dimensions).
   * That's why the whole chart must be recreated with the newly specified chartType.
   * @param {String} chartType possible values: bar|line|area|pie
   */
  TbChart.prototype.setChartType = function (chartType) {
    TB.ASSERT(DEFAULTS_DATASETS[ chartType ], {
      code: 'TBJS/ChartJs/130000',
      msg: '`chartType` must be a string and one of $TYPES$, but given `$TYPE$`',
      msgParams: {
        TYPES: Object.keys(DEFAULTS_DATASETS),
        TYPE: chartType
      }
    });

    var chart = this.s.chart;
    var chartDataset;

    chartDataset = DEFAULTS_DATASETS[ this.chartType ];

    for (var idx = 0, l = chart.data.datasets.length; idx < l; idx++) {
      //var dataset = _.cloneDeep(chart.data.datasets[ idx ]);
      var dataset = chart.data.datasets[ idx ];

      Object.keys(chartDataset).forEach(function (key) {
        delete dataset[ key ];
      });

      // The new chart preserves the colors of the previous chart.
      // This makes the pie chart to be with the same background and border color
      // if the previous chart wasn't a pie chart, the reverse situation is also true.
      delete dataset.backgroundColor;
      delete dataset.borderColor;

      dataset.type = chartType;

      //chart.data.datasets[ idx ] = dataset;
    }

    var currentLegend = this.chart.legend.legendItems;
    var defaultLegend = chart.data.datasets;

    if (this.chartType !== 'pie') {
      for (var idx = 0, l = defaultLegend.length; idx < l; idx++) {
         defaultLegend[ idx ].hidden = currentLegend[ idx ].hidden;
      }
    }

    chart.type = chartType;
    this.chartType = chartType;

    this.chart.destroy();
    this._initData();
    this._render();
  };

  TbChart.autodetect = function() {
    var charts = document.querySelectorAll('[data-tb-chart]');

    if (!charts || !charts.length) return;

    for (var idx = 0, l = charts.length; idx < l; idx++) {
      var el = charts[idx];
      var chart;

      try {
        chart = JSON.parse(el.dataset.tbChart);
      } catch (e) {
        // forEach does not break the loop and it should stay this way!
        TB.THROW_CONFIG({
          code: 'TBHS/ChartJS/11000',
          msg: 'Not a valid JSON was given, $ERR$',
          msgParams: { ERR: e },
        });
      }
      chart = new TbChart(el, chart);
    }
  };

  return TbChart;
});

if(typeof window.TB == 'undefined' || typeof window.TB.IS_DBR_JS_LOADED == 'undefined' || window.TB.IS_DBR_JS_LOADED == false) {
    var overlay = document.getElementById("dbreports-overlay");

    var overlayShowTimeout = setTimeout(function() {
        overlay.style.display = '';
    }, 300);

    var overlayTimeout = setTimeout(function(){
        overlay.style.display = '';
    }, 2000);

    window.TB.addEventListener({
      eventType: TB.MENUTYPE.DBR,
      ctx: window,
      evt: 'tb_libs_loaded',
      cb: (event) => {
        clearTimeout(overlayShowTimeout);
        clearTimeout(overlayTimeout);
        $("#dbreports-overlay").hide();
        setTimeout(function() {
            $("#dbr-main-cont").show();
            stickIt(true);
            jQuery('.table-responsive').floatingScroll('update');
        }, 50);
      }
    });
}
else
{
    console.log("ADDING_THIS_2:");
  console.log("CHECK_WINDOW_TB:", window.TB);

    window.TB.addEventListener({
      eventType: TB.MENUTYPE.DBR,
      ctx: window,
      evt: 'tb_libs_loaded',
      cb: (event) => {
        var dbrMainCont = document.getElementById("dbr-main-cont");
        dbrMainCont.style.display = '';

        jQuery('.table-responsive').floatingScroll('update');
      }
    });
}

window.TB.addEventListener({
    eventType: window.TB.MENUTYPE.DBR,
    ctx: window,            
    evt: 'tb_libs_loaded',
    cb: (event) => {
        //isRepEmbedded = '$is_rep_embedded';
        //uiHideFiltersTable = '$ui_hide_filters_table';
        var dbrReadyEvent = new Event('tb_dbr_ready');
        window.dispatchEvent(dbrReadyEvent);
                
        //vajno e da e s timeout ot 1ms za da se izpulni pri sledvashtiq tick na JS event loop-a
        setTimeout(function() {
            var dbrEmbReadyEvent = new Event('tb_dbr_emb_ready');
            window.dispatchEvent(dbrEmbReadyEvent);
            var dbrReportReady = new Event('tb_dbr_report_ready');
            window.dispatchEvent(dbrReportReady);
        },1);   
    },      
});     
    
window.TB.addEventListener({
    eventType: window.TB.MENUTYPE.DBR,
    ctx: window,
    evt: 'tb_libs_loaded',
    cb: (event) => {
        $(".dropdown-toggle").dropdown();
    },          
});

function isScrolledPastTableHeader(element) {
  var viewportTop = $(window).scrollTop();
  var elementTop = element.offset().top;
  var elementBottom = elementTop + element.height();

  return elementBottom >= viewportTop;
}

window.stickIt = function(isOnLoad) {
  if ($('#tb_subscription').length == 1) {
	return;
  }

  $('.original').each(function() {
	var orgElementPos = $(this).offset();

	if (typeof orgElementPos == 'undefined') {
	  return;
	}

	orgElementTop = orgElementPos.top;

	var scrollposX = localStorage.getItem('scrollposX') || 0;
	//console.log("XX", orgElementPos.left, orgElementPos.right, scrollposX);

	if (scrollposX > 0 && isOnLoad) {
	  //ScrollX
	  var contId = $(this).parent().attr("id");

	  if ($('#' + contId).length > 0 && $('#' + contId).parent().length > 0) {
		$('#' + contId).parent('div').get(0).scrollTo(scrollposX, 0)
	  }

	  if ($('#' + contId).length > 0 && $('#' + contId).parent().children(".fl-scrolls").length > 0) {
		$('#' + contId).parent().children(".fl-scrolls")[0].scrollTo(scrollposX, 0);
	  }
	  //ScrollX
	}

	if (isScrolledPastTableHeader($(this))) {
	  $(this).siblings('.cloned').hide();
	  $(this).css('visibility', 'visible');
	} else {
	  orgElement = $(this);
	  heightOrgElement = orgElement.height();
	  coordsOrgElement = orgElement.offset();
	  widthOrgElement = orgElement.css('width');
	  leftOrgElement = coordsOrgElement.left;

	  $(this).css('visibility', 'hidden');

	  if (isOnLoad) {
		var y = $(window).scrollTop();
		console.log("Scr", y, $(this).height());
		//$(window).scrollTop((y - $(this).height() ) );
		var scrollposY = localStorage.getItem('scrollposY');
		if (scrollposY) {
		  //console.log("scrl", $(this).height(), scrollposY);
		  window.scrollTo(0, scrollposY);
		  // bring this back if vertical scroll doesn't work as expected in embedded screens :) 
		  //window.scrollTo(0, scrollposY - $(this).height() );
		}
	  }

	  $(this).siblings('.cloned')
		.css({
		  'transform': 'translateY(' + ($(window).scrollTop() - orgElementPos.top - heightOrgElement - 1) + 'px)',
		  'transition': 'transform',
		  'width': widthOrgElement
		})
		.show();

	  //localStorage.setItem('scrollpos', window.scrollY);
	}
  });
}


function getStateId(state) {
  return window.location.href.split('#')[1] || state.pathKey;
}

function getRepId() {
  return $('[name="sid"]').val();
}

function getStoredStates() {
  const storedStates = localStorage.getItem('dbrStates');
  return storedStates ? JSON.parse(storedStates) : undefined;
}

function isValidState(currentState, repId) {
  return currentState && currentState.repChecksum === hashString(repId);
}

function restoreState(currentState) {
  fillPreferenceFields(currentState.filterVals);

  if(currentState.filtersChecksum !== hashString(JSON.stringify(getPreferenceFields()))) {
	location.reload();
	return;
  }

  //ASSERT(currentState.filtersChecksum === hashString(JSON.stringify(getPreferenceFields())), "Error while restoring filter values for state");
  setActiveTab(currentState.activeTab);
  saveActiveTab();
}

function initializeState(state) {
  fillPreferenceFields(state.filterVals);
  setActiveTab(state.activeTab || 'primary-filters-tab');
  saveActiveTab();
}


window.TB.addEventListener({
  eventType: TB.MENUTYPE.DBR,
  ctx: window,
  evt: 'popstate',
  cb: async function(event) {
    if (location.hash === '#' || location.href.endsWith('#')) {
      return;
    }

    const state = event.state;
    const stateId = getStateId(state);
    const repId = getRepId();

    const storedStates = getStoredStates();
    const currentState = storedStates ? storedStates[stateId] : undefined;

    if (isValidState(currentState, repId)) {
      restoreState(currentState);
    } else if (state && state.init) {
      initializeState(state);
    }
  }
});

window.TB.addEventListener({
  eventType: TB.MENUTYPE.DBR,
  ctx: window,
  evt: 'tb_libs_loaded',
  cb: (event) => {
    $.fn.isInViewport = function() {
      let $this = $(this);
      let $window = $(window);
      if ($this.length == 0) {
        return;
      }

      if ($this.offset() != null) {
        var elementTop = $this.offset().top;
      }

      var elementBottom = elementTop + $this.outerHeight();

      var viewportTop = $window.scrollTop();
      var viewportBottom = viewportTop + $window.height();

      return elementBottom > viewportTop && elementTop < viewportBottom;
    };

    window.onscroll = function() {
      stickIt();
      localStorage.setItem('scrollposY', window.scrollY);
      moveDisplayReportBtn();
    };

    jQuery('.table-responsive').floatingScroll();
    $(".fl-scrolls").on("scroll", function() {
      var cont = $(this);
      var coordsX = cont.get(0).scrollLeft;

      localStorage.setItem('scrollposX', coordsX);
    });

    $(".table-responsive").on("scroll", function() {
      var cont = $(this);
      var coordsX = cont.get(0).scrollLeft;

      localStorage.setItem('scrollposX', coordsX);
    });

    var intrCount = 0;

    var tblIntrv = setInterval(function() {
      intrCount++;

      if (intrCount > 100) {
        clearInterval(tblIntrv);
      }

      if ($('.report-tables thead').length > 0) {
        $('.customization-settings-tables thead, .report-tables thead').each(function() {
          if ($(this).parents('table').find('thead.cloned').length === 0) {
            $(this).addClass('original').clone(1).insertAfter(this).addClass('cloned').removeClass('original').hide();
          }
        });

        //trqbva da sa dve izvikvaniq za da scrolva do pravilnata poziciq
        stickIt();
        stickIt(true);

        clearInterval(tblIntrv);
      }
    }, 5);

    function isScrolledPastTableHeader(element) {
      var viewportTop = $(window).scrollTop();
      var elementTop = element.offset().top;
      var elementBottom = elementTop + element.height();

      return elementBottom >= viewportTop;
    }
  }
});

function GetCustomizationFields(selector) {
  var inputs = $(selector).find('input.tb-checksum-elements, select.tb-checksum-elements, textarea.tb-checksum-elements');

  var reportParams2 = {};
  inputs.each(function(index) {
    var input = $(this);
    if (input.attr('type') == 'checkbox') {
      if (typeof reportParams2[input.attr('name')] === 'undefined') {
        reportParams2[input.attr("name")] = input.prop('checked');
      } else if (Array.isArray(reportParams2[input.attr('name')])) {
        reportParams2[input.attr("name")].push(input.prop('checked'));
      } else if (!Array.isArray(reportParams2[input.attr('name')])) {
        var onlyVal = reportParams2[input.attr("name")];
        reportParams2[input.attr("name")] = [];
        reportParams2[input.attr("name")].push(onlyVal);
        reportParams2[input.attr("name")].push(input.prop('checked'));
      }
    } else if (input.is('textarea')) {
      reportParams2[input.attr("name")] = toBinary(input.val());
    } else if (input.attr('type') == 'radio') {
      if (input.prop('checked')) {
        reportParams2[input.attr("name")] = toBinary(input.val());
      }
    } else {
			console.log("GOT_INPUT_VAL:", input.val());
			console.log("INPUT_IS:", input);
      reportParams2[input.attr("name")] = toBinary(input.val());
    }
  });

  return reportParams2;
}
/*
function renderChart(data, el) {
  let formatted_datasets = [];
  let formatted_yaxes = [];

  console.log("CHECK_DATA:", data);

  data.data.datasets.forEach(dataset => {
    let dataset_obj = {
      name: dataset.label,
      data: dataset.data
    };

    formatted_datasets.push(dataset_obj);
  });

  console.log("FORMATTED_DATASETS:", formatted_datasets);
  if (formatted_datasets.length == 0) {
    el.innerHTML = "<h1 class='text-center'>No Results</h1>";
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
    colors: ["#FF1654", "#247BA0"],
    series: formatted_datasets,	
    stroke: {
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
      shared: false,
      intersect: true,
      x: {
        show: false
      }
    },
    legend: {
      horizontalAlign: "left",
      offsetX: 40
    }
  };

  console.log("FINAL_OPTIONS_ARE:", options);

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

function renderPieChart(data, el) {
  console.log("CHECK_PIE_DATA:", data);

  let dataset = _.get(data, "data.datasets");

  let dataset_arr = dataset[0];

  if (dataset_arr == null) {
    el.innerHTML = "<h1 class='text-center'>No Results</h1>";
    return;
  }

  let options = {
    series: _.get(dataset_arr, "data") || [],
    chart: {
      width: '100%',
      height: 700,
      type: "pie"
    },
    theme: {
      mode: document.body.classList.contains('tinyapp-dark') ? 'dark' : 'light',
    },
    labels: _.get(data, "data.labels"),
    legend: {
      position: 'bottom',
      onItemHover: {
          highlightDataSeries: true
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
      }
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

function renderLineChart(data, el) {
  var options = {
    chart: {
          height: 350,
          type: data.type,
          stacked: false
        },
        theme: {
          mode: document.body.classList.contains('tinyapp-dark') ? 'dark' : 'light',
        },
        dataLabels: {
          enabled: false
        },
        colors: ["#FF1654", "#247BA0"],
        series: [
        {
          name: "Series A",
          data: [1.4, 2, 2.5, 1.5, 2.5, 2.8, 3.8, 4.6]
        },
        {
          name: "Series B",
          data: [20, 29, 37, 36, 44, 45, 50, 58]
        }
        ],
        stroke: {
          width: [4, 4]
        },
        plotOptions: {
          bar: {
            columnWidth: "20%"
          }
        },
        xaxis: {
          categories: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016]
        },
        yaxis: [
          {
            axisTicks: {
              show: true
            },
            axisBorder: {
              show: true,
              color: "#FF1654"
            },
            labels: {
              style: {
                colors: "#FF1654"
              }
            },
            title: {
              text: "Series A",
              style: {
                color: "#FF1654"
              }
            }
          },
          {
            opposite: true,
            axisTicks: {
              show: true
            },
            axisBorder: {
              show: true,
              color: "#247BA0"
            },
            labels: {
              style: {
                colors: "#247BA0"
              }
            },
            title: {
              text: "Series B",
              style: {
                color: "#247BA0"
              }
            }
          }
    ],
    tooltip: {
    shared: false,
    intersect: true,
    x: {
      show: false
    }
    },
    legend: {
    horizontalAlign: "left",
    offsetX: 40
    }
  };

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
*/
function setLocaleFormat() {
  const thousandsSeparator = $('[name="thousands_separator"]').val() || ' ';
  const decimalSeparator = $('[name="decimal_separator"]').val() || '.';
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let reportingDatesLocale = $('[name="reporting_dates_locale"]').val();
  let reportingDigitsLocale = $('[name="reporting_digits_locale"]').val();

  if (!reportingDatesLocale && !reportingDigitsLocale) {
    return;
  }

  reportingDatesLocale = reportingDatesLocale === 'Autodetect' ? navigator.language || navigator.userLanguage : reportingDatesLocale.replace("_", "-");
  reportingDigitsLocale = reportingDigitsLocale === 'Autodetect' ? 'en-US' : reportingDigitsLocale.replace("_", "-");

  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator).replace(/\./g, decimalSeparator);
  }

  function getDateType(dateString) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return 'date';
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?$/.test(dateString)) {
      return 'datetime';
    } else {
      return 'invalid';
    }
  }

  function formatDate(dateStr, locale, options) {
    const date = new Date(dateStr);
    const dateType = getDateType(dateStr);

    if(dateType == 'invalid') {
      return;
    }

    if (!isNaN(date)) {
      if (dateType == 'datetime') {
        options = {
          ...options,
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric'
        };
      }

      const formatter = new Intl.DateTimeFormat(locale, options);
      return formatter.format(date);
    }

    return dateStr;
  }

  $(".report-tables").each(function() {
    const table = $(this);

    processColumns(table, 'th[data-is-numeric="1"]:not(.tb-data-format)', formatNumber);
    processColumns(table, 'th[data-is-timestamp="1"]:not(.tb-data-format), th[data-is-date="1"]:not(.tb-data-format)', formatDate, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: userTimeZone
    });
  });

  function processColumns(table, selector, formatter, options) {
    table.find(selector).each(function() {
      const index = $(this).index();
      const firstCellText = table.find(`tbody tr:first td:eq(${index})`).text().trim();

      if (firstCellText === 'All (expand)' || firstCellText === 'All') return;

      table.find(`tbody tr td:nth-child(${index + 1})`).each(function() {
        let text = $(this).text().trim();
        if (options) {
          $(this).text(formatter(text, reportingDatesLocale, options));
        } else {
          $(this).text(formatter(text));
        }
      });
    });
  }
}

function getActiveTab() {
  let activeTab = $('.nav-item.active').find('a').attr('id');

  if (typeof activeTab === 'undefined') {
    activeTab = 'primary-filters-tab'
  }

  return activeTab;
}

function saveStateKey(key, val) {
  let states = localStorage.getItem('dbrStates');
  let currentStateId = window.location.href.split('#')[1] || 'init';

  if (states != null) {
    states = JSON.parse(states);
  } else {
    states = {};
  }

  if (currentStateId != null) {
    if (states[currentStateId] == null) {
      states[currentStateId] = {}
    }

    states[currentStateId][key] = val;
    localStorage.setItem('dbrStates', JSON.stringify(states));
  }
}

function saveActiveTab() {
  let activeTab = getActiveTab();
  saveStateKey('activeTab', activeTab);
}

function saveStateFilters() {
  let filterVals = JSON.stringify(getPreferenceFields());
  let rep_id = $('[name="sid"]').val();

  saveStateKey('filterVals', filterVals);
  saveStateKey('filtersChecksum', hashString(filterVals));
  saveStateKey('repChecksum', hashString(rep_id));

  return filterVals;
}

function setActiveTab(id) {
  $('#' + id).click();

  $('#' + id).parent().show();
}

function setDefaultActiveTab() {
  let hasActive = false;

  $('#tb-dbr-tabs-result li').each(function() {
    if ($(this).hasClass('active')) {
      hasActive = true;
    }
  });

  if (!hasActive) {
    let ele = $('#tb-dbr-tabs-result li')[0];
    if (ele != undefined && $(ele).is(":visible")) {
      let first_child = $(ele).children()[0];
      if (first_child != undefined && $(first_child).is(":visible")) {
        $(first_child).click();
      }
    }
  }
}

function moveDisplayReportBtn() {
  if ($('#tb_subscription').length == 1) {
    return;
  }

  let activeTab = $('#tb-dbr-tabs-result .nav-item.active > a');
  let activePanelId = activeTab.attr('href');
      
  let activePanel = $(activePanelId);

  let $displayButtonsDiv = $('#display-buttons-div');

  if (activePanel.length > 0) {
    if (activePanel[0].id === 'tb-dbr-tab-chart') {
      $('#display-buttons-div>#control-buttons-row').addClass('mx-auto');
      $('#display-buttons-div>#control-buttons-row').addClass('w-100');
      $('#display-buttons-div>#control-buttons-row').addClass('text-center');
    }
    else {
      //$('#display-buttons-div>#control-buttons-row').removeClass('mx-auto');
      //$('#display-buttons-div>#control-buttons-row').removeClass('w-100');
      // $('#display-buttons-div>#control-buttons-row').removeClass('text-center');
      let $el = $('#control-buttons-row');
      $el.removeClass('mx-auto');
      $el.removeClass('w-100');
      $el.removeClass('text-center');
    }
  }


  if (!($('#footer-anchor-element').isInViewport())) {
    if ( ! $displayButtonsDiv.hasClass('butt-width') ) {
      let activeTab = $('#tb-dbr-tabs-result .nav-item.active > a');
      let activePanelId = activeTab.attr('href');
      
      let activePanel = $(activePanelId);
   
      if (activePanel.length) {
        let panelWidth = activePanel.width();

        if(panelWidth > 0) {
          $displayButtonsDiv.width(panelWidth).addClass('butt-width');
        }
      }
 
    }

    if ( ! $displayButtonsDiv.hasClass('footer') ) {
      $displayButtonsDiv.addClass('footer');
    }

    if (!$('#tb-dbr-dropdown-export').hasClass('dropup')) {
      $('#tb-dbr-dropdown-export').addClass('dropup');
    }

    if (!$('.tb-toolbox-menu').hasClass('dropup')) { 
      $('.tb-toolbox-menu').addClass('dropup');
    }

    $('.rep-container').each(function() {
      let $this = $(this);

      let flScrollsElem = $this.children('.tb-report-result-table').children('.fl-scrolls');

      if ($this.isInViewport()) {
        if (!flScrollsElem.hasClass('fl-scrolls-bottom') && $('.tb-report-result-table').length > 0) {
          flScrollsElem.addClass('fl-scrolls-bottom');
        }
      } else {
        if (flScrollsElem.hasClass('fl-scrolls-bottom') && $('.tb-report-result-table').length > 0) {
          flScrollsElem.removeClass('fl-scrolls-bottom');
        }
      }

      if ($this.next().isInViewport()) {
        flScrollsElem.removeClass('fl-scrolls-bottom');
      };

    });
  } else {
    if ( $displayButtonsDiv.hasClass('footer') ) {
      $displayButtonsDiv.removeClass('footer');
    }

    if ($('#tb-dbr-dropdown-export').hasClass('dropup')) {
      $('#tb-dbr-dropdown-export').removeClass('dropup');
      $('.fl-scrolls').removeClass('fl-scrolls-bottom');
    }

  if ($('.tb-toolbox-menu').hasClass('dropup')) { 
    $('.tb-toolbox-menu').removeClass('dropup');
  }

    if ($displayButtonsDiv.hasClass('butt-width')) {
      $displayButtonsDiv.css({
        'width': ''
      });
      $displayButtonsDiv.removeClass('butt-width');
    }

    $('.tb-report-result-table').each(function() {
      let flScrollsElem = $(this).children('.fl-scrolls');

      if (!$(this).isInViewport()) {
        if (flScrollsElem.hasClass('fl-scrolls-bottom') && $('.tb-report-result-table').length > 0) {
          flScrollsElem.removeClass('fl-scrolls-bottom');
        }
      }
    });
  }
}

window.moveDisplayReportBtn = moveDisplayReportBtn;
window.setDefaultActiveTab = setDefaultActiveTab;

function fillPreferenceFields(savedValues) {
  if (savedValues == null) {
    return;
  }

  var inputs = $('.tb-preference-controls');
  savedValues = JSON.parse(savedValues);
  inputs.each(function(index) {
    var input = $(this);
    if (input.attr('type') == 'checkbox' && savedValues[input.attr('name')] != null) {
      if (input.prop('checked') != savedValues[input.attr('name')]) {
        input.click();
      }
    } else if (input.attr('type') == 'radio' && savedValues[input.attr('name')] != null) {
      $('[name="' + input.attr('name') + '"]' + '[value="' + savedValues[input.attr('name')] + '"]').click();
    } else if (savedValues[input.attr('name')] != null) {
      input.val(savedValues[input.attr('name')]);
      if (input.hasClass("selectized")) {
        input.tbselectize()[0].selectize.setValue(savedValues[input.attr('name')]);
      }
    }
  });
}

function getPreferenceFields() {
  var inputs = $('.tb-preference-controls');

  let reportParams = {};
  inputs.each(function(index) {
    var input = $(this);
    if (input.attr('name') == undefined) {
      return;
    }

    if (input.attr('type') == 'checkbox') {
      if (typeof reportParams[input.attr('name')] === 'undefined') {
        reportParams[input.attr("name")] = input.prop('checked');
      } else if (Array.isArray(reportParams[input.attr('name')])) {
        reportParams[input.attr("name")].push(input.prop('checked'));
      } else if (!Array.isArray(reportParams[input.attr('name')])) {
        var onlyVal = reportParams[input.attr("name")];
        reportParams[input.attr("name")] = [];
        reportParams[input.attr("name")].push(onlyVal);
        reportParams[input.attr("name")].push(input.prop('checked'));
      }
    } else if (input.is('textarea')) {
      reportParams[input.attr("name")] = input.val();
    } else if (input.attr('type') == 'radio') {
      if (input.prop('checked')) {
        reportParams[input.attr("name")] = input.val();
      }
    } else {
      reportParams[input.attr("name")] = input.val();
    }
  });

  return sortObjectKeys(reportParams);
}

function initSelectizeFields() {
  $('#tb-dbr-filters select:not([multiple]), #tb-dbr-save-query select:not([multiple]), .add_filters_tabpanels select:not([multiple]), #customization-mode-tab select:not([multiple]), #chart-customization-tab select:not([multiple]), .tb-selectize').each(function() {
    if ($(this).hasClass('tb-dont-selectize')) {
      return;
    }

    if ($(this).hasClass('tb-allow-delete')) {
      $(this).tbselectize({
        plugins: ['remove_button'],
      });
    } else {
      $(this).tbselectize({
        plugins: ['remove_button', 'stop_backspace_delete'],
      });
    }

    if (($(this).data("required") == 'not_required' || $(this).data("empty-value-included") == '1') && !$(this).attr('multiple')) {
      $(this).tbselectize()[0].selectize.addOption({
        text: "‎",
        value: " ",
        $order: "0"
      });
    }
  });

  $('#tb-dbr-filters select[multiple], #tb-dbr-save-query select[multiple], .add_filters_tabpanels select[multiple], #customization-mode-tab select[multiple], #chart-customization-tab select[multiple]').each(function() {
    let self = this;

    if ($(this).hasClass('tb-dont-selectize')) {
      return;
    }

    $(this).tbselectize({
      plugins: ['remove_button'],
    });
  });
}

window.TB.addEventListener({
  eventType: TB.MENUTYPE.DBR,
  ctx: window,
  evt: 'tb_dbr_report_ready',
  cb: () => {
    let len = $('.show-more-button').length;

    if (len > 0) {
      $('#show-all-hide-text')[0].disabled = false;
    }
  }
});

function toggleShowButtons(_this) {
  let show_more_buttons = $('.show-more-button').toArray();
  let show_more_hidden_text = $('.show-more-hidden-text').toArray();

  console.log(show_more_buttons);

  _this.innerText = _this.innerText === " Show All Long Cells" ? "Hide All Long Cells" : "Show All Long Cells";

  show_more_buttons.forEach(el => {
    el.classList.toggle("d-none");
  });

  show_more_hidden_text.forEach(el => {
    el.classList.toggle("d-none");
    el.classList.toggle("remove-pre");
  });

  $('.table-responsive').floatingScroll("update");
}

async function injectJSON(text) {
  $('#tb-dbr-json-notify')[0].innerText = '';
  $('#tb-dbr-json-container')[0].innerHTML = '';

  try {
    let parsed_text = JSON.parse(text);
    let modules = await TB.loadJSFile('../pub/jslibs/jsoneditor-5.22.0/jsoneditor.min.js?v=' + window.VERSION_FOR_JS);
    let JSONEditor = modules[0];

    let container = document.getElementById("tb-dbr-json-container");
    container.innerHTML = "";
    const editor = new JSONEditor(container, {
      mode: 'view'
    });
    editor.set(parsed_text);
  } catch (err) {
    console.log(err);
    $('#tb-dbr-json-notify')[0].innerText = 'The data cannot be displayed as JSON!';
  }
}

function showTextModal(obj) {
  let container = $('#tb-dbr-cell-text-container>pre')[0];
  let text = obj.previousSibling.innerText;
  container.innerText = text;
}

async function switchInputMode(element) {
  await TB.loadJSFile('tinymce-4');

  if ($(element).siblings('div.mce-tinymce.mce-container.mce-panel').length == 1) {
    tinymce.remove('#' + $(element).siblings('textarea').attr('id'));
    $(element).siblings('textarea').attr('data-is-raw', 'true');
  } else {
    let self = $(element).siblings('textarea');
    let subrep_id = $(self).attr('id');
    let pluginOptions = {
      "selector": '#' + subrep_id,
      "valid_children": "+body[style],+body[style]",
      "elementpath": false,
      "height": 150,
      "theme": "modern",
      "skin": "lightgray-gradient",
      "plugins": [
        "base64image",
        "code"
      ],
      "image_advtab": false,
      "resize": true,
      "paste_data_images": true,
      "max_image_count": 10,
      "max_image_size": 512000,
      "max_image_height": 1024,
      "max_image_width": 1024,
      "forced_root_block": "",
      "toolbar1": "undo redo | base64image styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | link image | forecolor backcolor | preview print code",
      "setup": function(editor) {
        editor.on('change', function(e) {
          $(self).val(editor.getContent());
        });
      }
    };
    tinymce.init(pluginOptions);
    self.attr('data-is-raw', 'false');
    console.log('init mce');
  }

}

function changeAllGroupByFields(mode) {
  $('.tb-filters-groupby, .tb-cols-groupby').each(function(idx, element) {
    const name = $(element).prop('name');
    const selectElement = $('[name="' + name + '"]').tbselectize()[0];

    if (selectElement && selectElement.selectize) {
      const selectizeInstance = selectElement.selectize;
      const optionWithValue = selectizeInstance.options[mode];

      if (mode == 1) {
        selectizeInstance.setValue('1');
      } else if (optionWithValue) {
        selectizeInstance.setValue(mode);
      } else {
        selectizeInstance.setValue('0');
      }
    }
  });
}

//api
function getParam(name) {
  var $elem = $(`[name="${name}"]`);
  if ($elem.length === 0) {
    return undefined;
  }

  if ($elem[0].multiple) {
    var values = $elem.map(function() {
      return this.value;
    }).get();
    return values.length > 0 ? values : undefined;
  }

  return $elem.val();
}

function reloadAPIParams() {
  var data = $('#tb-dbr-api-params-data').html();

  if (!data) {
    $('.tb-dbr-api-dropdown').text('API params could not be loaded');
    $('.tb-dbr-api-dropdown').addClass('tb-dbr-api-error');
    //ASSERT(0, 'API params could not be loaded');
    return;
  }

  data = JSON.parse(data);

  if (data.error) {
    $('.tb-dbr-api-dropdown').text(data.error);
    $('.tb-dbr-api-dropdown').addClass('tb-dbr-api-error');
  } else {

    $('.tb-dbr-api-query-params').text('payload_jsonrpc=<PAYLOAD_JSON>');

    $('.tb-dbr-api-headers').text('Authorization: Basic <USERNAME:PASSWORD>');

    var subrep_id = getParam('subrep_id');
    subreport_id = subrep_id && subrep_id != 'all' ? +subrep_id : 0;

    var params = {
      // checksum: data.checksum,
      rid: "<RID>",
      report_id: data.repid,
      subreport_id: data.subreports[subreport_id].api_name,
      send_redirect_headers: false,
      result_rows_limit: "<LIMIT>",
      export_format: data.export_format
    };

    //console.log("DATACR", data.is_custom_report, data.filters);

    if (!data.is_custom_report) {
      for (let filt in data.filters) {
        const filterData = data.filters[filt];
        const api_name = filterData.api_name;
        const prefix = 'f' + filt.toString().padStart(2, '0');
        const $rangeDateCheckbox = $(`#${prefix}_range_date`);
        const rangeDateChecked = $rangeDateCheckbox.prop('checked');
        const $ignoreYearCheckbox = $(`#${prefix}_ignore_year`);
        const ignoreYearChecked = $ignoreYearCheckbox.prop('checked');
        let suffixes = rangeDateChecked ? ['_start', '_end'] : ['', '_operation'];

        for (let suffix of suffixes) {
         let adjustedSuffix = suffix;
          if (rangeDateChecked && suffix === '') {
            adjustedSuffix = '_single_date';
          }

          const param = getParam(prefix + adjustedSuffix);
          if (param !== undefined && param !== '') {
            if (adjustedSuffix === "") {
               params[`filters__${api_name}_${adjustedSuffix}_value`] = param;
            }
            else {
              params[`filters__${api_name}_${adjustedSuffix}_value`] = param;
            }
          }
        }

        params[`filters__${api_name}__ignore_year_checkbox`] = ignoreYearChecked;

        params[`filters__${api_name}__range_date_checkbox`] = rangeDateChecked;

        const groupByParam = getParam(`${prefix}_groupby`);
        const groupByOption = filterData.group_by_names[groupByParam];
        if (groupByOption !== undefined && groupByOption !== 'hide') {
          params[`group_by__${api_name}__mode`] = `group_by_${groupByOption}`;
        }
      }

      params.report_columns = [];
      for (var col in data.col_filters[subreport_id]) {
        var {
          name,
          enc_name,
          group_by_names
        } = data.col_filters[subreport_id][col];
        var subreport_name = data.subreports[subreport_id].api_name;
        var api_prefix = `addit_filters__${subreport_name}__${name}__`;
        var cgi_prefix = `a_f_${subreport_id}_${enc_name}_`;

        var map = {
          v: 'value',
          s: 'start_value',
          f: 'end_value',
          o: 'operation',
          e: 'enabled',
          grp: 'groupby',
          agg: 'aggregate'
        };

        var cachedParams = {};

        var op = getParam(`${cgi_prefix}o`);

        for (var key in map) {
          let cgiKey = cgi_prefix + key;

          if (!(cgiKey in cachedParams)) {
            cachedParams[cgiKey] = getParam(cgiKey);
          }

          var param = cachedParams[cgiKey];

          if (key === 'e' && (param || !getParam('fc_available'))) {
            params.report_columns.push(name);
            continue;
          }

          if ((key === 'grp' || key === 'agg') && param !== undefined && param !== '') {
            params[api_prefix + map[key]] = key === 'grp' ? group_by_names[param] : param;
          } else if (param && op !== '' && op !== 'both') {
            params[api_prefix + map[key]] = param;
          }
        }
      }
    }

    var payload = {
      jsonrpc: '2.0',
      id: null,
      method: 'run_report',
      params
    };

    var payloadString = JSON.stringify(payload, null, 2);
    $('.tb-dbr-api-payload').text(payloadString);

    var encoded = '?payload_jsonrpc=' + encodeURIComponent(JSON.stringify(payload))
      .replace('%3CRID%3E', '<RID>')
      .replace('%3CLIMIT%3E', '<LIMIT>');

    $('.tb-dbr-api-url').text(encoded);

    $('.tb-dbr-api-curl').text(`curl -v -u <USERNAME>:<PASSWORD> -L --retry-delay 20 "<API_URL>/<API_KEY>${encoded}"`);
  }
};

//api

function removeFormulaColumn(col_name) {
  if (confirm("Are you sure that you want to delete the following formula column: " + col_name + "?")) {
    var $row = $(event.target).closest('tr');
    $row.hide();

    $('[name="tb_formula_cols_' + col_name + '"]').remove();
    $('[id="add_cols_group_wrapper_' + col_name + '_id"]').remove();
  }
}

function goToPage(page) {
  $('[name="current_page"]').val(page);
  $('#tb-dbr-export-as-btn').click();
}


function fromBinary(binary) {
  if (binary == null) {
    return null;
  } else if (typeof binary === "boolean") {
    return binary;
  }

  //console.log("TOB",binary);

  if (Array.isArray(binary)) {
    for (let i = 0; i < binary.length; i++) {
      if (binary[i] == null || binary[i] == '' || typeof binary[i] === "boolean") {
        continue;
      }
      const bytes = new Uint8Array(binary[i].length);
      for (let k = 0; k < bytes.length; k++) {
        bytes[k] = binary[i].charCodeAt(k);
      }
      binary[i] = String.fromCharCode(...new Uint16Array(bytes.buffer));
    }

  } else {
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    binary = String.fromCharCode(...new Uint16Array(bytes.buffer));
  }

  return binary;
}

function toBinary(string) {
  if (string == null) {
    return null;
  } else if (typeof string === "boolean") {
    return string;
  }

  if (Array.isArray(string)) {
    for (let i = 0; i < string.length; i++) {
      if (string[i] == null || string[i] == '' || typeof string[i] === "boolean") {
        continue;
      }

      const codeUnits = new Uint16Array(string[i].length);

      for (let k = 0; k < codeUnits.length; k++) {
        codeUnits[k] = string[i].charCodeAt(k);
      }

      string[i] = String.fromCharCode(...new Uint8Array(codeUnits.buffer));
    }
  } else {
    const codeUnits = new Uint16Array(string.length);

    for (let i = 0; i < codeUnits.length; i++) {
      codeUnits[i] = string.charCodeAt(i);
    }

    string = String.fromCharCode(...new Uint8Array(codeUnits.buffer));
  }

  return string;
}

function autoSubmit() {
  var remaining = $('[name="max_refreshes"]').val();
  if (remaining > 0) {
    $('[name="max_refreshes"]').val(remaining - 1);
    is_auto_refresh_enabled = true;
    $("[name=show_custom_fields]").val("0");
    $('.display-report-button').click();
  } else {
    $('#stop_timer_button').click();
  }
}

function getTooltipText(key, value) {
  return `${key}: ${JSON.stringify(value)}`;
}

function dbrResetButton($resetButton, $defaultInput) {
  $resetButton.on('click', function() {
    $defaultInput.trigger('click');
  });
}

function dbrButtonDropdown($dropdown) {
  var $defaultInput = $dropdown.find('input:checked');
  var $button = $dropdown.find('.tb-dbr-dropdown-btn');
  var initialText = $button.text();

  $button.html($defaultInput.parent().text());
  $dropdown.on('click', 'a', function(event) {
    var $this = $(this);
    var $list = $this.closest('ul');
    var $input = $this.find('input');

    $dropdown.trigger('change', {
      exportAs: $input.val(),
    });

    $input.prop('checked', true);

    $list.find('li.active').removeClass('active');
    $input.closest('li').addClass('active');
    //$button.html(initialText + $input.parent().text());
    $button.html($input.parent().text());
    $button.prop('disabled', false);
  });

  var $resetButton = $dropdown.parent().find('button[type=reset]');

  dbrResetButton($resetButton, $defaultInput);
}

function dbrTogglePdfSettings(shouldShow) {
  var defaultSize = 12;
  var $container = jQuery('.tb-dbr-pdf-settings');

  $container.find('input[name="export_pdf_s"]').val(defaultSize);
  $container.toggleClass('show', shouldShow);
  $container.find(':input').prop('disabled', !shouldShow);
};

function dbrToggleRawCustomSettings(shouldShow) {
  var $raw_settings_container = jQuery('.tb-dbr-raw-custom-settings');
  $raw_settings_container.toggleClass('show', shouldShow);
};

function startTimer(duration, display) {
  var timer = duration,
    hours, minutes, seconds;
  var timer2 = setInterval(function() {
    hours = parseInt(timer / (60 * 60), 10);
    minutes = parseInt((timer / 60) % 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    if (hours <= 24) {
      hours = hours < 10 ? "0" + hours : hours;
    } else {
      hours = parseInt(hours / 24, 10) < 10 ? "0" + parseInt(hours / 24, 10) + " days " + (hours % 24 != 0 ? (parseInt(hours % 24, 10) < 10 ? "0" : "") + parseInt(hours % 24, 10) : "00") : parseInt(hours / 24, 10) + " days " + (hours % 24 != 0 ? (parseInt(hours % 24, 10) < 10 ? "0" : "") + parseInt(hours % 24, 10) : "00");
    }

    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.textContent = hours + ":" + minutes + ":" + seconds;
    if (--timer < 0) {
      clearInterval(timer2);
      autoSubmit();
    }
  }, 1000);
  $('#stop_timer_button').on('click', function(e) {
    e.preventDefault();
    clearInterval(timer2);
  });
}

function toggleCustomizationMode() {
  var customizationModeEnabled = $('[name="customization-mode-enabled"]').val();

  if (customizationModeEnabled == 0) {
    $('[name="customization-mode-enabled"]').val(1);

    if ($('[name="is_rep_owner"]').val()) {
      $('.tb-lock-class[data-locked="locked"]').prop("disabled", false);
      $('select[data-locked="locked"').each(function(index) {
        $(this).tbselectize()[0].selectize.enable()
      });
    } else {
      $('[data-filter-locked="locked"]').children().hide();
      $('[data-filter-hidden="unchecked"]').hide();
    }

    $("[name=show_custom_fields]").val("1");
  } else {
    $('[name="customization-mode-enabled"]').val(0);

    $('[data-filter-locked="locked"]').children().show();
    $('[data-filter-hidden="unchecked"]').show();
    $('.tb-checkbox-hide[data-is-shown="unchecked"]').hide();
    $('.tb-addcheckbox-hide[data-is-shown="unchecked"]').hide();
    $('.tb-lock-class[data-locked="locked"]').prop("disabled", true);

    $("[name=show_custom_fields]").val("0");

    $('select[data-locked="locked"').each(function(index) {
      $(this).tbselectize()[0].selectize.disable()
    });
  }
}

function validateCustomFields() {
  if ($('#repeatable_curl_mode')[0] == null || !$('#repeatable_curl_mode')[0].checked) {
    return true;
  }

  let custom_field_labels = $('#custom_report_result_tab>label[for]');

  for (let i = 0; i < custom_field_labels.length; i++) {
    let label_id = custom_field_labels[i].getAttribute('for');
    if ($(`#${label_id}_ifr`).length > 0 && $(`input[data-textarea-id="${label_id}"]`).prop('checked')) {
      return true;
    }
  }

  let custom_field_textareas = $('#custom_report_result_tab>div>textarea');

  ASSERT(custom_field_labels.length == custom_field_textareas.length);
  ASSERT(custom_field_labels.length % 3 == 0);

  for (let i = 0; i < custom_field_labels.length / 3; i++) {
    let custom_field_concat_string = "";

    if ($(`input[name="header-html-enabled-${i}"]`) != null && $(`input[name="header-html-enabled-${i}"]`).val() === "true") {
      custom_field_concat_string += $(`#header-html-${i}`).val();
    };

    if ($(`input[name="body-html-enabled-${i}"]`) != null && $(`input[name="body-html-enabled-${i}"]`).val() === "true") {
      custom_field_concat_string += $(`#body-html-${i}`).val();
    };

    if ($(`input[name="footer-html-enabled-${i}"]`) != null && $(`input[name="footer-html-enabled-${i}"]`).val() === "true") {
      custom_field_concat_string += $(`#footer-html-${i}`).val();
    };

    if (custom_field_concat_string !== "") {
      if ($('div.selectize-input>div[data-value="application/json"]')[0] != null) {
        try {
          JSON.stringify(JSON.parse(custom_field_concat_string));
        } catch (err) {
          let subreport = $(`#hidden-subrep-name-${i}`)[0];
          ASSERT(subreport != null);

          let custom_fields_anchor = $('a[href="#custom_report_result_tab"]')[0];
          ASSERT(custom_fields_anchor != null);

          let JSON_error = custom_field_labels.length > 3 ? `Invalid JSON Format in "Customize Report Result" -> ${subreport.innerText}!\n Are you sure you want to proceed?` : `Invalid JSON Format! Are you sure you want to proceed?`;
          if (!confirm(JSON_error)) {
            return false;
          }
        }
      } else if ($('div.selectize-input>div[data-value="application/xml"]')[0] != null) {
        let XML_parser = new DOMParser();
        let XML_doc = XML_parser.parseFromString(custom_field_concat_string, "text/xml");
        if (XML_doc.getElementsByTagName('parsererror').length > 0) {
          let subreport = $(`#hidden-subrep-name-${i}`)[0];
          ASSERT(subreport != null);
          let custom_fields_anchor = $('a[href="#custom_report_result_tab"]')[0];
          ASSERT(custom_fields_anchor != null);

          let XML_error = XML_doc.querySelector('parsererror>div').innerText;
          let XML_error_prefix = custom_field_labels.length > 3 ? `XML Error in "Customize Report Result" -> ${subreport.innerText}!\n` : `XML Error!\n`;
          if (!confirm(XML_error_prefix + XML_error + "\n Are you sure you want to proceed?")) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

function toggleCustomReportModes(mode) {
  if (mode == "subscribe_by_email") {
    toggleRepeatableTargetGroup(false);
    toggleShellCmdFields(false);
    toggleCustomReportFields(false);
    toggleSubscriptionFields(true);
    //toggleReportFiltersOverride($('[name="inherit_custom_report"]')[0]);
  } else if (mode == "repeatable_curl") {
    toggleRepeatableTargetGroup(false);
    toggleSubscriptionFields(false);
    toggleCustomReportFields(false);
    toggleShellCmdFields(true);
  } else if (mode == "repeatable_target_group") {
    toggleShellCmdFields(false);
    toggleSubscriptionFields(false);
    toggleCustomReportFields(false);
    toggleRepeatableTargetGroup(true);
  } else {
    toggleSubscriptionFields(false);
    toggleShellCmdFields(false);
    toggleRepeatableTargetGroup(false);
    toggleCustomReportFields(true);
  }
}

function toggleSubscriptionFields(toggle) {
  $('#tb-dbr-save-query').find('.tb-dbr-subscription-field').toggleClass('show', toggle);
  $('#tb-dbr-save-query').find('.tb-dbr-repeatable-field').toggleClass('show', toggle);
}

function toggleShellCmdFields(toggle) {
  $('#tb-dbr-save-query').find('.tb-dbr-res-to-cmd-field').toggleClass('show', toggle);
  $('#tb-dbr-save-query').find('.tb-dbr-repeatable-field').toggleClass('show', toggle);
}

function toggleRepeatableTargetGroup(toggle) {
  $('#tb-dbr-save-query').find('.tb-dbr-repeatable-field').toggleClass('show', toggle);
}

function toggleCustomReportFields(toggle) {
  if (toggle == true) {
    $('#tb-dbr-save-query').find('.tb-dbr-custom-rep-field').show();
  } else {
    $('#tb-dbr-save-query').find('.tb-dbr-custom-rep-field').hide();
  }
}

function setupRangeDatePickers() {
  document.querySelectorAll('[data-single-date-name]').forEach(element => {
    let prefix = element.getAttribute('data-single-date-name');
    let type = element.getAttribute('data-type');

    if ($(`#${prefix}_single_date`).prop("checked") == true) {
      $(`#${prefix}_range_date`).prop("checked", false);
    } else {
      $(`#${prefix}_range_date`).prop("checked", true);
    }

    $(`#${prefix}_range_date`).change(function() {
      if (this.checked) {
        $(`#${prefix}-${type}-range-id`).show();
        $(`#${prefix}-${type}-single-date-id`).hide();
        $(`#${prefix}_single_date`).prop("checked", false);
      } else {
        $(`#${prefix}-${type}-range-id`).hide();
        $(`#${prefix}-${type}-single-date-id`).show();
        $(`#${prefix}_single_date`).prop("checked", true);
      }
    });

    if ($(`#${prefix}_single_date`).prop("checked") == true) {
      $(`#${prefix}-${type}-range-id`).hide();
      $(`#${prefix}-${type}-single-date-id`).show();
    } else {
      $(`#${prefix}-${type}-range-id`).show();
      $(`#${prefix}-${type}-single-date-id`).hide();
    }
  });
}

function changeChartSettingsTable(obj) {
  let chart_type = ['pie', 'bar', 'line'];

  chart_type.forEach(el => {
    if (obj.value === el) {
      $(`#${el}-chart-table`).removeClass('d-none');
    } else {
      $(`#${el}-chart-table`).addClass('d-none');
    }
  });
}

function displayChartCustomizationTable() {
  let chart_type_el = $('#tb-chart-type')[0];

  if (chart_type_el != null) {
    let chart_type = chart_type_el.value;
    $(`#${chart_type}-chart-table`).removeClass('d-none');
  }
}

var initialChecksum;
var addInitialChecksum;

window.TB.addEventListener({
  eventType: TB.MENUTYPE.DBR,
  ctx: window,
  evt: 'tb_libs_loaded',
  cb:  async (event) => {
    setInterval(moveDisplayReportBtn, 150);

    checkForChartRendering();
    displayChartCustomizationTable();

    window.TB = window.TB || {};
    window.TB.DBRepCore = (function DBRepCoreSingleton() {
      var instance = null;

      return function() {
        instance = instance ? instance : new DBRepCore();

        return instance;
      };
    })();

    function DBRepCore() {
      var self = this;

      TB.CONFIG = TB.CONFIG || {};
      TB.CONFIG.DATE_FORMAT = 'YYYY-MM-DD';
      TB.CONFIG.DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
      TB.CONFIG.DATE_REGEX = /(^[12]\d{3}[-/.](0[1-9]|1[0-2]|[1-9])[-/.](0[1-9]|[12]\d|3[01]|[1-9])$)|(^(0[1-9]|[12]\d|3[01]|[1-9])[-/.](0[1-9]|1[0-2]|[1-9])[-/.][12]\d{3}$)/;
      TB.CONFIG.DATETIME_REGEX = /(^([12]\d{3}[-/.](0[1-9]|1[0-2]|[1-9])[-/.](0[1-9]|[12]\d|3[01]|[1-9]))\s((0[0-9]|1[0-9]|2[0-3]|[0-9])(:(0[0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|[0-9])){2})$)|(^((0[1-9]|[12]\d|3[01]|[1-9])[-/.](0[1-9]|1[0-2]|[1-9])[-/.][12]\d{3})\s((0[0-9]|1[0-9]|2[0-3]|[0-9])(:(0[0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|[0-9])){2})$)/;
      TB.CONFIG.DATE_FORMATS = ["YYYY-MM-DD", "YYYY.MM.DD", "YYYY/MM/DD", "DD-MM-YYYY", "DD.MM.YYYY", "DD/MM/YYYY"];
      TB.CONFIG.DATETIME_FORMATS = ["YYYY-MM-DD HH:mm:ss", "YYYY.MM.DD HH:mm:ss", "YYYY/MM/DD HH:mm:ss", "DD-MM-YYYY HH:mm:ss", "DD.MM.YYYY HH:mm:ss", "DD/MM/YYYY HH:mm:ss"];
      TB.CONFIG.DATETIME_RANGES_TODAY = '';
      TB.CONFIG.DATETIMES_YESTERDAY = '';
      TB.CONFIG.DATETIMES_YESTERDAY = '';

      this.dbrInit();
    }

    var dbrp = {};

    DBRepCore.prototype = dbrp;
    dbrp.dbrInit = function() {
      var self = this;
      console.info("DBReports::INIT called!!!");

      // This should be dynamic for some reason :)

	  $('.tb-report-description-icon').on('click', function () {
		$('.tb-report-description').toggleClass('hide');
	  });  

      $(document).on('submit', '#tb-dbr-filters', async function(evt) {
        evt.preventDefault();
        if ($('#tb-dbr-export-as-btn').prop('disabled') == true) {
          return;
        }

        $('#tb-export-dropdown-icon').addClass('tb-loading-spinner fa fa-refresh');
        $('#tb-export-dropdown-icon').removeClass('caret');

        $('.tb-action-btns').find('button').prop('disabled', true);

        $("#control-buttons-wrapper-div").appendTo('#control-buttons-row');
        $('.tb-chart-y-vals').prop('disabled', true);

        let dbrPrefs = window.localStorage.getItem('dbreports-preferences');
        let currentUser = document.getElementById('dark-theme-username-info');
        if (currentUser != null) {
          currentUser = document.getElementById('dark-theme-username-info').innerText.trim();

          let rep_id = $('[name="sid"]').val();

          //console.log("REPID", rep_id);
          if (dbrPrefs !== null) {
            dbrPrefs = JSON.parse(dbrPrefs);

            if (dbrPrefs[currentUser] == null) {
              dbrPrefs[currentUser] = {};
            }

            if (dbrPrefs[currentUser][rep_id] == null) {
              dbrPrefs[currentUser][rep_id] = {};
            }

            dbrPrefs[currentUser][rep_id]['export_as'] = $('[name="export_as"]:checked').val();
            dbrPrefs[currentUser][rep_id]['filters_vals'] = JSON.stringify(getPreferenceFields());
          } else {
            dbrPrefs = {};

            if (dbrPrefs[currentUser] == null) {
              dbrPrefs[currentUser] = {};
            }

            if (dbrPrefs[currentUser][rep_id] == null) {
              dbrPrefs[currentUser][rep_id] = {};
            }

            dbrPrefs[currentUser][rep_id]['export_as'] = $('[name="export_as"]:checked').val();
            dbrPrefs[currentUser][rep_id]['filters_vals'] = JSON.stringify(getPreferenceFields());
          }

          window.localStorage.setItem('dbreports-preferences', JSON.stringify(dbrPrefs));

          var colspanState = [];

          $('.tb-colspan-controls').not('thead.table-header.cloned .tb-colspan-controls').each(function(index) {
            if ( $(this).is('.fa-caret-right, .fa-caret-down') ) {
              colspanState[index] = 'collapsed';
            } else {
              colspanState[index] = 'expanded';
            }
          });

          if( colspanState.length > 0 ) {
            let colspanStates = window.localStorage.getItem('colspan-states');

            if(colspanStates !== null) {
              colspanStates = JSON.parse(colspanStates);

              colspanStates[currentUser][rep_id] = colspanState;
            } else {
              colspanStates = {};

              if( colspanStates[currentUser] == null) {
                colspanStates[currentUser] = {};
              } 

              if( colspanStates[currentUser][rep_id] == null) {
                colspanStates[currentUser][rep_id] = {};
              }
            
              colspanStates[currentUser][rep_id] = colspanState;
            }

            window.localStorage.setItem('colspan-states', JSON.stringify(colspanStates));
          }
        }

        //hide all modals before request cause you can get stuck with an overlay you can't remove
        $('.modal').modal('hide');

        saveActiveTab();
        let filterVals = saveStateFilters();

        let params_object = appendDataToForm();

        await fetchData(window.location.href, params_object, filterVals);

        displayChartCustomizationTable();

        var token = new Date().getTime();
        var cookieName = 'fileDownloadToken';
        //$('.tb-lock-class[data-locked="locked"]').prop( "disabled", false );
        jQuery('#file_download_token').val(token);

        if (typeof fileDownloadCheckTimer !== 'undefined') {
          window.clearInterval(fileDownloadCheckTimer);
        }

        fileDownloadCheckTimer = window.setInterval(function() {
          var cookieValue = TB.getCookie(document.cookie, cookieName);

          if (cookieValue === token.toString()) {
            window.clearInterval(fileDownloadCheckTimer);
            self.dbrButtonDropdownEnable(jQuery('#tb-dbr-dropdown-export'));
          }
        }, 1000);
      });

      jQuery('.tb-dropdown-table th a').click(function(event) {
        event.preventDefault();
        return false;
      });

      jQuery('.tb-dbr-datetime-picker')
        .datetimepicker({
          format: 'YYYY-MM-DD HH:mm:ss',
          format: TB.CONFIG.DATETIME_FORMAT
        });

      jQuery('.tb-dbr-date-picker')
        .datetimepicker({
          format: TB.CONFIG.DATE_FORMAT
        });

      var $targetListForm = jQuery('#tb-dbr-target-list-form');

      jQuery('#tb-dbr-display-target-list').click(function(evt) {
        toggleCustomizationMode();
        showTargetListForm($targetListForm);
        $saveQueryForm.addClass("hide");
      });

      $targetListForm.submit(function(evt) {
        $targetListForm.find('input[name="report_params"]').remove();

        var reportParams = TB.Form.extractValues(document.querySelector('#tb-dbr-filters'));

        var colFilters = [...document.querySelectorAll('#tb-dbr-filters')]
          .map(function(form) {
            return TB.Form.extractValues(form);
          })
          .map(function(values) {
            return Object.keys(values)
              .filter((name) => /^cf_\d+_\d+_/.test(name))
              .reduce((dest, name) => ({
                ...dest,
                [name]: values[name],
              }), {});
          });

        for (var key in reportarams) {
          var el = reportParams[key];
          if (typeof el == 'undefined' || el == null || el == "") {
            delete reportParams[key];
          }
        }

        var i1 = document.createElement('input');

        i1.type = 'hidden';
        i1.name = 'report_params';
        i1.value = JSON.stringify(reportParams);

        $targetListForm.append(i1);

        var i2 = document.createElement('input');

        i2.type = 'hidden';
        i2.name = 'col_filters';
        i2.value = JSON.stringify(colFilters);

        $targetListForm.append(i2);
      });

      //post submit

      $targetListForm.on('reset', function(evt) {
        $targetListForm.addClass('hide');
        $('.import-export-buttons').addClass('hide');
      });

      var showTargetListForm = function($form, values) {
        $form.removeClass('hide');

        if (!values) return;

        TB.Form.populateValues($form[0], values, false);
        TB.Form.populateValues(jQuery('#tb-dbr-filters')[0], values.report_params, false);
      };

      var $saveQueryForm = jQuery('#tb-dbr-save-query');

      $targetListForm.find(".tb-dbr-is-refreshable-target-list").on('change', function(event) {
        toggleRefreshableTargetListFields(event.target.checked);
      });

      jQuery('#tb-dbr-dropdown-save-query .tb-dbr-saved-query-edit').click(function(evt) {
        evt.preventDefault();

        var values = jQuery(this).data('tbDbrValue');

        fillSaveQueryForm($saveQueryForm, values);
        showSaveQueryForm($saveQueryForm, values);

        $saveQueryForm.find('#tb-dbr-save-query-delete').toggle(values.can_delete);
      });

      $(document).on('submit', '#tb-dbr-save-query', function(evt) {
        let $saveQueryForm = $(this); 
        $saveQueryForm.find('input[name="report_params"]').remove();

        $('#tb-dbr-filters').append($('.add_filters_tabpanels'));
        var reportParams = TB.Form.extractValues(document.querySelector('#tb-dbr-filters'));

        var colFilters = [...document.querySelectorAll('#tb-dbr-filters')]
          .map(function(form) {
            return TB.Form.extractValues(form);
          })
          .map(function(values) {
            return Object.keys(values)
              .filter((name) => /^cf_\d+_\d+_/.test(name))
              .reduce((dest, name) => ({
                ...dest,
                [name]: values[name],
              }), {});
          });

        for (var key in reportParams) {
          var el = reportParams[key];
          if (typeof el == 'undefined' || el == null || el == "") {
            delete reportParams[key];
          }
        }

        var elements_to_iterate_arr = [
          '#show_as_select',
          '#report_display_type_id',
          '#default_rep_format',
          '#auto_run_report',
          '#show_cols_labels_id',
          '#hide_filters',
          '#auto_refresh_time_id',
          '#is_pagination_enabled',
          '#pagination_rows_limit',
          '#previous_page',
          '#save-query-note',
          '#shell_cmd_id',
          '[name="name"]',
          '#raw_export_mimetype_id',
          '#shell_cmd_uri_escape_id',
          '[name="custom_report_mode"]:checked',
          '[name="export_as"]:checked',
          '#recipient',
          '[name="hide_filters_table"]',
          '[name="hide_api_buttons"]',
          '[name="hide_tabpanel"]',
          '[name="hide_save_tab"]',
          '[name="hide_filter_tabs"]',
          '[name="template_report"]',
          '[name="template_report_settings"]',
      		'.transpose-result:not(:checked)',
          '#export_file_name_id',
					'[name="is_shared"]',
		      '[name="is_empty_report_enabled"]'
        ];

        elements_to_iterate_arr.forEach(function(item, index) {
          reportParams[$(item).attr('name')] = $(item).val();
        });

        var multiple_elements_to_iterate_arr = [
          '.raw-export-body-delimiters',
          '.tinymce-textareas',
  //        '.tb-chart-type',
  //        '.tb-chart-x-axis',
  //        '.tb-chart-y-axes-select',
  //        '.tb-chart-grid-color-select',
  //        '.tb-chart-y-vals',
  //        '.tb-y-axes-labels',
  //        '.tb-y-axes-min-ranges',
  //        '.tb-y-axes-max-ranges',
          '.tb-include-empty-value-filters:not(:checked)',
          '.tb-add-show-columns:not(:checked)',
          '.tb-add-subsum-filters:not(:checked)',
          '.tb-add-lock-filters:not(:checked)',
          '.tb-add-check-filters:not(:checked)',
          '.tb-required-filters:not(:checked)',
          '.add-required-filters:not(:checked)',
          '.custom-html-checkboxes',
          '[name="is_custom_html_enabled"]',
          '.tb-lock-filters:not(:checked)',
          '.tb-hide-filters:not(:checked)',
          '.result-rows-limit'
        ];

        multiple_elements_to_iterate_arr.forEach(function(item, index) {
          $(item).each(function() {
            reportParams[$(this).attr('name')] = $(this).val();

            if (item == '.tinymce-textareas') {
              reportParams[$(this).attr('name') + '-is-raw'] = $(this).attr('data-is-raw');
            }
          });
        });

        let chartType = $('#tb-chart-type')[0].value;

        $(`#customization-mode-tab, #${chartType}-chart-table`).each(function() {
          var inputs = $(this).find('input, select, textarea');
          inputs.each(function(index) {
            var current_input = $(this);
            var paramName = current_input.attr("name");
            var paramValue = current_input.val();

            if (paramName && paramValue !== undefined && paramValue != "") {
              if (!reportParams.hasOwnProperty(paramName)) {
                reportParams[paramName] = paramValue;
              }
            }
          });
        });

        var i1 = document.createElement('input');

        i1.type = 'hidden';
        i1.name = 'report_params';
        i1.value = JSON.stringify(reportParams);

        $saveQueryForm.append(i1);

        var i2 = document.createElement('input');

        i2.type = 'hidden';
        i2.name = 'col_filters';
        i2.value = JSON.stringify(colFilters);

        $saveQueryForm.append(i2);
      });

      //post-submit-func
      jQuery('#tb-dbr-subscription-repeat-period-input').on('change', function(e) {
        var isRepeatDaysHidden = e.target.value !== 'month';

        jQuery('#tb-dbr-subscription-repeat-weekdays').toggleClass('hide', !isRepeatDaysHidden);
        jQuery('#tb-dbr-subscription-repeat-monthdays').toggleClass('hide', isRepeatDaysHidden);
      });

      var toggleRefreshableTargetListFields = function(toggle) {
        $targetListForm.find('.tb-dbr-refreshable-target-list-field').toggleClass('show', toggle);
      }

      var fillSaveQueryForm = function($form, values) {
        if (!values) return;

        if (typeof $targetListForm[0] != 'undefined') {
          $targetListForm[0].reset();
        }

        $form[0].reset();

        if (values.custom_report_mode == 'subscribe_by_email') {
          values.subscription_params.has_subscription = 1;
        } else {
          values.subscription_params.has_subscription = 0;
        }

        values.subscription_params.name = values.name;
        values.subscription_params.is_shared = values.is_shared ? 1 : 0;
        //values.subscription_params.has_subscription = values.has_subscription ? 1 : 0;
        values.subscription_params.subscribers = values.subscribers;
        values.subscription_params.relative_timestamp_since = values.relative_timestamp_since;
        values.subscription_params.saved_filter_id = values.id;
        values.subscription_params.is_empty_report_enabled = values.is_empty_report_enabled ? 1 : null;

        //toggleSubscriptionFields(values.has_subscription);
        //toggleShellCmdFields(values.pass_res_to_cmd);

        //TODO - toggle Modes
        var mode = values.custom_report_mode;

        toggleCustomReportModes(mode);

        TB.Form.populateValues($form[0], values.subscription_params, false);

        //ASSERT(typeof values.report_params.export_as !== 'undefined');

        showSaveQueryForm($saveQueryForm);
        $('.import-export-buttons').removeClass('hide');
      }

      var fillTargetListsForm = function($form, values) {

        if (!values) return;

        $saveQueryForm[0].reset();
        $form[0].reset();

        values.target_list_params = {};
        values.target_list_params.name = values.name;
        values.target_list_params.is_shared = values.is_shared ? 1 : 0;
        values.target_list_params.target_list_id = values.id;
        values.target_list_params.is_refreshable_target_list = values.is_refreshable_target_list ? 1 : 0;
        values.target_list_params.is_random_order = values.is_random_order ? 1 : 0;
        values.target_list_params.expires_after_days = values.expires_after_days;
        values.target_list_params.relative_timestamp_since = values.relative_timestamp_since;

        //toggleSubscriptionFields(values.has_subscription);

        TB.Form.populateValues($form[0], values.target_list_params, false);

        //ASSERT(typeof values.report_params.export_as !== 'undefined');

        TB.Form.populateValues(jQuery('#tb-dbr-filters')[0], values.report_params, false);

        if (values.col_params) {
          values.col_params.forEach((val, idx) => {
            TB.Form.populateValues(jQuery('.tb-dbr-col-filters form')[idx], val, false);
          })
        }

        jQuery('input[value=' + values.report_params.export_as + ']', '#tb-dbr-filters').trigger('click');

        showTargetListForm($targetListForm);

        jQuery(".tb-dbr-is-refreshable-target-list").trigger("change");
      }

      var showSaveQueryForm = function($form, values) {
        $form.removeClass('hide');
        //$form.find('#tb-dbr-save-query-delete').hide();
        //$form.find('[name="saved_query_id"]').val('');

        // sometimes 'relative_timestamp_since' is not rendered at all
        if ($('[name="relative_timestamp_since"]').val() == '' && $form.find('[name="relative_timestamp_since"]').data('DateTimePicker')) {
          $form.find('[name="relative_timestamp_since"]').data('DateTimePicker').date(new Date());
        }

        //$saveQueryForm.find('#tb-dbr-save-query-delete').toggle(values.can_delete);
      };

      jQuery('#tb-dbr-set-curr-filter').on("click", function(evt) {
        evt.preventDefault();

        var values = jQuery(this).data('tbDbrValue');
        var filtValues = jQuery(this).data('tbDbrFiltValue');

        //console.log('Raw values ', values);
        fillSaveQueryForm($saveQueryForm, values);
        //showSaveQueryForm($saveQueryForm, values);

        $saveQueryForm.find('#tb-dbr-save-query-delete').toggle(values.can_delete);
      });

      jQuery('#tb-dbr-set-curr-filter').trigger("click");


      jQuery('#tb-dbr-set-curr-target-list').on("click", function(evt) {
        evt.preventDefault();

        var values = jQuery(this).data('tbDbrValue');
        fillTargetListsForm($targetListForm, values);

      });

      jQuery('#tb-dbr-set-curr-target-list').trigger("click");

      jQuery.fn.tbDaterangepicker = function(settings) {
        settings = settings || {};

        settings.format = settings.format || TB.CONFIG.DATETIME_FORMAT;
        settings.timePicker = settings.timePicker || false;

        ASSERT(settings && typeof settings === 'object');
        ASSERT(typeof settings.format === 'string');

        var getRanges = function() {
          const now = moment();

          if (settings.isDateRange) {
            return {
              'Today': [
                now.clone().startOf('day'),
                now.clone(),
              ],
              'Yesterday': [
                now.clone().startOf('day').subtract(1, 'day'),
                //now.clone().startOf('day'),
                now.clone().startOf('day').subtract(1, 'day'),
              ],
              'Current Month': [
                now.clone().startOf('month'),
                now.clone(),
              ],
              'Previous Month': [
                now.clone().startOf('month').subtract(1, 'month'),
                //now.clone().startOf('month').subtract(1, 'month').endOf('month'),
                now.clone().startOf('month').subtract(1, 'month').endOf('month')
              ],
              'Last Month': [
                now.clone().subtract(1, 'month'),
                now.clone(),
              ],
              'Previous 3 Months': [
                now.clone().startOf('month').subtract(3, 'month').startOf('month'),
                //now.clone().startOf('month'),
                now.clone().startOf('month').subtract(1, 'month').endOf('month'),
              ],
              'Last 3 Months': [
                now.clone().subtract(3, 'month'),
                now.clone()
              ],
              'Last 6 Months': [
                now.clone().startOf('month').subtract(6, 'month').startOf('month'),
                //now.clone().startOf('month'),
                now.clone().startOf('month').subtract(1, 'month').endOf('month'),
              ],
              'Previous Year': [
                now.clone().startOf('year').subtract(1, 'year'),
                now.clone().subtract(1, "year").endOf('year'),
              ],
              'Last Year': [
                now.clone().subtract(1, 'year'),
                now.clone(),
              ],
              'Last 7 Days': [
                now.clone().startOf('day').subtract(6, 'day'),
                now.clone(),
              ],
              'Last 30 Days': [
                now.clone().startOf('day').subtract(30, 'day'),
                now.clone(),
              ],
              'Current Week': [
                now.clone().startOf('isoWeek'),
                now.clone(),
              ],
              'Last Week': [
                now.clone().startOf('isoWeek').subtract(1, 'week'),
                //now.clone().startOf('isoWeek').subtract(1, 'week').endOf('isoWeek'),
                now.clone().startOf('isoWeek').subtract(1, 'week').endOf('isoWeek')
              ]
            };
          } else {
            return {
              'Today': [
                now.clone().startOf('day'),
                now.clone().endOf('day'),
              ],
              'Last Hour': [
                now.clone().subtract(1, 'hour'),
                now.clone(),
              ],
              'Yesterday': [
                now.clone().startOf('day').subtract(1, 'day'),
                now.clone().startOf('day'),
              ],
              'Last Day': [
                now.clone().subtract(1, 'day'),
                now.clone(),
              ],
              'Current Month': [
                now.clone().startOf('month'),
                now.clone().add(1, 'day').startOf('day'),
              ],
              'Previous Month': [
                now.clone().startOf('month').subtract(1, 'month'),
                //now.clone().startOf('month').subtract(1, 'month').endOf('month'),
                now.clone().startOf('month'),
              ],
              'Last Month': [
                now.clone().subtract(1, 'month'),
                now.clone(),
              ],
              'Previous 3 Months': [
                now.clone().startOf('month').subtract(3, 'month').startOf('month'),
                now.clone().startOf('month'),
              ],
              'Last 3 Months': [
                now.clone().subtract(3, 'month'),
                now.clone()
              ],
              'Last 6 Months': [
                now.clone().startOf('month').subtract(6, 'month').startOf('month'),
                now.clone().startOf('month'),
              ],
              'Previous Year': [
                now.clone().startOf('year').subtract(1, 'year'),
                now.clone().startOf('year'),
              ],
              'Last Year': [
                now.clone().subtract(1, 'year'),
                now.clone(),
              ],
              'Last Week': [
                now.clone().startOf('day').subtract(6, 'day'),
                now.clone(),
              ],
              'Current Week': [
                now.clone().startOf('isoWeek'),
                now.clone().add(1, 'day').startOf('day'),
              ],
              'Previous Week': [
                now.clone().startOf('isoWeek').subtract(1, 'week'),
                //now.clone().startOf('isoWeek').subtract(1, 'week').endOf('isoWeek'),
                now.clone().startOf('isoWeek')
              ]
            };

          }
        };

        this.each(function() {
          var $inputs = $(this).find('input');
          var $since = $inputs.first();
          var $until = $inputs.last();
          var isClickedRange = false;
          var isClickedSingleRange = false;
          var singleRanges = ['today', 'yesterday'];
          var eventList;

          ASSERT($inputs.length === 2, {
            code: 'TBJS/TK/2000',
            msg: ''
          });

          //console.log("Since until ", $since, $until);

          var ranges = getRanges();

          ASSERT(typeof ranges['Today'] !== 'undefined', {
            code: 'TBJS/TK/2049',
            msg: 'Invalid ranges structure',
            ranges: ranges
          });

          $inputs.daterangepicker({
            alwaysShowCalendars: true,
            showDropdowns: true,
            showWeekNumbers: true,
            showISOWeekNumbers: true,
            timePicker: settings.timePicker,
            timePicker24Hour: true,
            timePickerSeconds: true,
            singleDatePicker: false,
            autoApply: false,
            autoUpdateInput: false,
            minDate: moment().startOf('year').subtract(100, 'years').format(settings.format),
            maxDate: moment().startOf('year').add(100, 'years').format(settings.format),
            locale: {
              format: settings.format,
              firstDay: 1,
            },
            ranges: ranges,
            showCustomRangeLabel: false,
            keyboardNavigation: true
          }, function(sinceDate, untilDate, label) {
            //console.log("Cbbb", label);
            var isInputChangedManually = false;

            // when the input is changed manually sinceDate._i is string else an object
            if (typeof sinceDate._i === "string") {
              isInputChangedManually = true;
              return;
            }

            //Code moved to apply event handler
            //Old

            //console.log("Since mince datex ", since, until, isInputChangedManually );
          });



          $inputs.on('show.daterangepicker', function(event) {
            $('#tb-dbr-filters').on('keyup keypress', function(e) {
              var keyCode = e.keyCode || e.which;
              if (keyCode === 13) {
                e.preventDefault();
                return false;
              }
            });

            if (jQuery(this).hasClass("tb-dbr-range-input-end")) {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
              var input_name = jQuery(this).attr('name').split("_")[0];
              $('.daterangepicker:visible').css('display', 'none');
              jQuery('[name="' + input_name + '_start' + '"]').click();
              return;
            } else if (jQuery(this).hasClass("tb-dbr-range-input-end-add")) {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
              var input_name = jQuery(this).attr('name').slice(0, -1);
              $('.daterangepicker:visible').css('display', 'none');
              jQuery('[name="' + input_name + 's' + '"]').click();
              return;
            }
            //console.log('show.daterangepicker');
            // Shitty hack to update predefined ranges compared to current time
            var ranges = getRanges();

            drpSince.ranges = ranges;
            drpUntil.ranges = ranges;

            if (jQuery(this).is($until)) {
              var momentUntil;

              if ($until.val()) {
                momentUntil = moment($until.val());
              } else {
                momentUntil = moment();
              }

              var drpUntilContainer = $until.data('daterangepicker').container[0];

              jQuery(drpUntilContainer).find('select.monthselect').val(momentUntil.month()).trigger('change');
              jQuery(drpUntilContainer).find('select.yearselect').val(momentUntil.year()).trigger('change');
            }
          });

          $inputs.on('hide.daterangepicker', function(event) {
            if (jQuery(this).hasClass("tb-dbr-range-input-end") || jQuery(this).hasClass("tb-dbr-range-input-end-add")) {
              return;
            }

            //console.log("hide.daterangepicker");
            setTimeout(() => {
              $('#tb-dbr-filters').unbind();
            }, "500");
          });

          $inputs.on('click', function(event) {
            var drp = jQuery(this).data('daterangepicker');

            if (drp.isShowing && !isFocused) {
              drp.hide();
              event.stopImmediatePropagation();
            }

            isFocused = false;
          });

          var isFocused = false;

          $inputs.on('focus', function(event) {
            isFocused = true;
          });

          eventList = $._data($since[0], "events");
          eventList.click.unshift(eventList.click.pop());
          eventList = $._data($until[0], "events");
          eventList.click.unshift(eventList.click.pop());

          $inputs.on('apply.daterangepicker', function(event, picker) {
            if (isClickedRange) {
              //picker.show();
              isClickedRange = false;
              isClickedSingleRange = false;
            }

            jQuery(this).parent().removeClass('has-error');

            var since = picker.startDate.format(settings.format);
            var until = picker.endDate.format(settings.format);

            //console.log("Since mince 2 ", since, until, $since.val(), $until.val());

            //New
            if ($since.val() != since) {
              $since.val(since);
              drpSince.setStartDate($since.val());
              drpUntil.setStartDate($since.val());
            }

            if ($until.val() != until) {
              $until.val(until);
              drpSince.setEndDate($until.val());
              drpUntil.setEndDate($until.val());
            }

            //console.log("Since mince ", $since.val(), $until.val(), $inputs.last().val(), picker);
            if (jQuery(this).is($since)) {
              if ($since.val() !== '') {
                if ($since.val() <= $until.val()) {
                  jQuery($inputs).parent().removeClass('has-error');
                  return;
                }

              } else {
                $since.val(moment().format(settings.format));
              }
            } else if (jQuery(this).is($until)) {
              if ($until.val() === '') {
                $until.val(moment().format(settings.format));
              }

              if ($until.val() >= $since.val()) {
                jQuery($inputs).parent().removeClass('has-error');
                return;
              }
            }
          });

          $inputs.on('change', function(e) {
            //console.log("Inpts change", $since.val(), $until.val());
            var current = moment().format(settings.format);
            var since;
            var until;

            if ($since.val() !== '') {
              since = moment($since.val()).format(settings.format);
            } else {
              since = moment().format(settings.format);
            }

            if ($until.val() !== '') {
              until = moment($until.val()).format(settings.format);
            } else {
              until = moment().format(settings.format);
            }

            if (jQuery(this).is($since)) {
              if (jQuery(this).val() !== '') {
                return;
              }

              drpSince.setEndDate(until);
              drpSince.setStartDate(current);
              drpUntil.setStartDate(current);
            } else if (jQuery(this).is($until)) {
              if (jQuery(this).val() !== '') {
                return;
              }

              drpUntil.setStartDate(since);
              drpUntil.setEndDate(current);
              drpSince.setEndDate(current);
            }
          });

          var drpSince = $since.data('daterangepicker');
          var drpUntil = $until.data('daterangepicker');

          var drpCallbackRange = function(event) {
            isClickedRange = true;

            var rangeLabel = jQuery(this).data('rangeKey').toLowerCase();

            if (singleRanges.includes(rangeLabel)) {
              isClickedSingleRange = true;
            }
          };

          jQuery('.ranges').on('mousedown.daterangepicker', 'li', drpCallbackRange);

          if ($since.val()) {
            $since.val(moment($since.val()).format(settings.format));
            drpSince.setStartDate($since.val());
            drpUntil.setStartDate($since.val());

            var current = moment().format(settings.format);

            if (!$until.val()) {
              drpSince.setEndDate(current);
            }
          }

          if ($until.val()) {
            $until.val(moment($until.val()).format(settings.format));
            drpSince.setEndDate($until.val());
            drpUntil.setEndDate($until.val());

            var current = moment().format(settings.format);

            if (!$since.val()) {
              drpUntil.setStartDate(current);
            }
          }
        });

        return this;
      };

      var $lastActiveForm;

      jQuery('input, select').focus(function(e) {
        $lastActiveForm = $(this).closest('form');
      });

      if (jQuery('#tb-dbr-display-report').length > 0) {
        $lastActiveForm = jQuery('#tb-dbr-filters');
      }

      $(document).on('keypress', function(e) {
        if (e.which == 13) {
          if ($lastActiveForm && $lastActiveForm.is(jQuery('#tb-dbr-filters'))) {
            jQuery('#tb-dbr-display-report').trigger('click');
          }
        }
      });
    };

    dbrp.dbrTogglePdfSettings = dbrTogglePdfSettings;
    dbrp.dbrToggleRawCustomSettings = dbrToggleRawCustomSettings;
    dbrp.dbrPanelToggleDatatables = function($panel) {
      // Result report table
      var $table = $panel.closest('.x_panel').find('table.tb-dbr-results-table');

      // Previously storred value if table has responsive parent.
      // It would be either boolean if already checked, or undefined if not checked yet
      if ($table.data('tbTk.hasResponsiveContainer') === undefined) {
        $table.data('tbTk.hasResponsiveContainer', $table.parent().hasClass('table-responsive'));
      }

      if ($table.data('tbTk.isDataTable')) {
        $table.DataTable().destroy();
        $table
          .data('tbTk.isDataTable', false)
          .parent()
          .toggleClass('table-responsive', $table.data('tbTk.hasResponsiveContainer'));
      } else {
        $table.DataTable({
          responsive: true,
        });
        $table
          .data('tbTk.isDataTable', true)
          .parent()
          .toggleClass('table-responsive', false);
      }
    };

    dbrp.dbrButtonDropdown = dbrButtonDropdown;

    dbrp.dbrResetButton = dbrResetButton;

    dbrp.dbrButtonDropdownEnable = function($dropdown) {
      var button = $dropdown.find('.tb-dbr-dropdown-btn');

      button.prop('disabled', false);
    }

    jQuery(function() {
      TB.dbrepCore = new TB.DBRepCore();
    });

    $(document).delegate(".dropdown-menu [data-keepOpenOnClick]", "click", function(e) {
      e.stopPropagation();
    });

    $(document).delegate(".tb-dbr-api-copy-icon", "click", function(e) {
      var $text = $(e.target).siblings('.tb-dbr-copy-text');
      ASSERT($text.length == 1);
      var text = $text.text();

      var inp = document.createElement('input');
      document.body.appendChild(inp);
      inp.value = text;
      inp.select();

      inp.focus({
        preventScroll: true
      });

      document.execCommand("copy");

      inp.remove();

      TB.createNotification('Copied to clipboard!', '', 'success');
    });

    $(document).on('click', '.tb-dbr-expand-col-groupby', function(e) {
      var param_name = $(this).data('groupby-param');
      var $input = $(`select[name=${param_name}_grp]`);
      ASSERT($input.length === 1);
      //$input.val($(this).data('groupby-value-option'));
      $input.tbselectize()[0].selectize.setValue($(this).data('groupby-value-option'));
      $('.display-report-button').click();
    });

    $(document).on('click', 'a.tb-dbr-expand-groupby', function(e) {
      var param_name = $(this).data('groupby-param');
      var $input = $(`select[name=${param_name}]`);
      ASSERT($input.length === 1);
      //$input.val($(this).data('groupby-value-option'));
      $input.tbselectize()[0].selectize.setValue($(this).data('groupby-value-option'));
      $('.display-report-button').click();
    });

    $(document).on('click', '.tb-dbr-expand-groupby, .tb-dbr-expand-col-groupby', function(e) {
      $(this).addClass('tb-loading-spinner fa fa-refresh');
      $(this).text('');
      $(this).parent().prop('align', 'center');
    });

    $(document).on('click', '#expand_groups_button', function(e) {
      let expandedCount = 0, hiddenCount = 0;

      $('.tb-colspan-header').each(function() {
          if ($(this).find('.fa-caret-left, .fa-caret-up').length > 0) {
            expandedCount++;
          }
          if ($(this).find('.fa-caret-right, .fa-caret-down').length > 0) {
            hiddenCount++;
          }
      });

      $('.tb-colspan-header').each(function() {
        if(expandedCount > hiddenCount && hiddenCount == 0 && $(this).find('.fa-caret-left, .fa-caret-up').length > 0) {	
          $(this).click();
        } else if(expandedCount < hiddenCount && expandedCount == 0 && $(this).find('.fa-caret-right, .fa-caret-down').length > 0) {	
          $(this).click();
        } else if(expandedCount > hiddenCount && $(this).find('.fa-caret-right, .fa-caret-down').length > 0) {	
          $(this).click();
        } else if(expandedCount < hiddenCount && $(this).find('.fa-caret-left, .fa-caret-up').length > 0){
          $(this).click();
        }
      });
    });

    $(document).on('click', '.tb-add-tooltips', function(e) {
    $(this).parent().siblings('span.tb-add-tooltips-descr').toggleClass('hide');
    });

    $(document).on('click', '.filter_tooltips', function(e) {
    $(this).parent().siblings('span.filter_tooltips_descr').toggleClass('hide');
    });

    callAfterChanges(true);
    callAfterAjaxOnly();
    initTBDateRangePickers();

    const initialState = {
      filterVals: JSON.stringify(getPreferenceFields()),
      pathKey: 'init',
      init: true
    };

    history.replaceState(initialState, '', window.location.href);
    let stateId = window.location.href.split('#')[1];
    let storedStates = localStorage.getItem('dbrStates');
    let savedFilters;
    let params_object;

    if (storedStates) {
      storedStates = JSON.parse(storedStates);
      savedFilters = storedStates[stateId];

      if (savedFilters) {
        fillPreferenceFields(savedFilters.filterVals);
        setActiveTab(savedFilters.activeTab);
      }
    }
  }
});

function restoreValues() {
  let dbrPrefs = window.localStorage.getItem('dbreports-preferences');
  let rep_id = $('[name="sid"]').val();

  let currentUser = document.getElementById('dark-theme-username-info');

  if (currentUser == null) {
    return;
  }

  currentUser = document.getElementById('dark-theme-username-info').innerText.trim();

  dbrPrefs = JSON.parse(dbrPrefs, currentUser);
  if (dbrPrefs != null && dbrPrefs[currentUser] != null && dbrPrefs[currentUser][rep_id] != null) {
    $('[name="export_as"][value="' + dbrPrefs[currentUser][rep_id]['export_as'] + '"]').click();
  }

  if (dbrPrefs != null && dbrPrefs[currentUser] != null && dbrPrefs[currentUser][rep_id] != null) {
    fillPreferenceFields(dbrPrefs[currentUser][rep_id]['filters_vals']);
  }
}


window.TB.addEventListener({
  eventType: TB.MENUTYPE.DBR,
  ctx: window,
  evt: 'tb_backspace_delete_plugin_loaded',
  cb: (event) => {
    initSelectizeFields();
  }
});

function callAfterAjaxOnly() {
  initTBDateRangePickers();
  initSelectizeFields();

  checkForChartRendering();

  $(".fl-scrolls").on("scroll", function() {
    var cont = $(this);
    var coordsX = cont.get(0).scrollLeft;

    localStorage.setItem('scrollposX', coordsX);
  });

  if ($('[name="relative_timestamp_since"]').val() == '' && $('[name="relative_timestamp_since"]').data('DateTimePicker')) {
    $('[name="relative_timestamp_since"]').data('DateTimePicker').date(new Date());
  } 

  moveDisplayReportBtn();
}

function transposeTable(table) {
  const cloned_theads = table.querySelectorAll('thead.cloned');
  cloned_theads.forEach(thead => thead.remove());

  const rows = Array.from(table.rows);
  var transposed = [];
  var colspanCells = {};

  let maxColumns = 0;
  rows.forEach(row => {
    maxColumns = Math.max(maxColumns, row.cells.length);
  });

  for (let i = 0; i < maxColumns; i++) {
    transposed[i] = [];
  }

  var colspanIndex = 0;
  rows.forEach((row, rowIndex) => {
    if($(row).hasClass('tb-colspan-row')) {
      let colspanIndex = 0;
      Array.from(row.cells).forEach((cell, cellIndex) => {
        //console.log(cell.colSpan, cell.textContent, "CELL", colspanIndex );

        if (!colspanCells[colspanIndex]) {
          colspanCells[colspanIndex] = {};
        }

        colspanCells[colspanIndex]['content'] = cell.textContent;
        console.log(colspanCells[colspanIndex]);
        colspanCells[colspanIndex]['colspan'] = cell.colSpan;

        colspanIndex += cell.colSpan;
      });

      return;
    }

    Array.from(row.cells).forEach((cell, cellIndex) => {
      const clonedCell = cell.cloneNode(true);
      if(colspanCells[cellIndex] && colspanCells[cellIndex]['content']) {
        let colspanText = colspanCells[cellIndex]['content'];
        colspanCells[cellIndex]['content'] = '';

        const iconHtml = '<i class="fa fa-caret-down fa-lg tb-colspan-controls"></i>';
        const cellDiv = clonedCell.querySelector('div');
        if (cellDiv) {
          cellDiv.innerHTML = colspanText + ' · ' + cellDiv.innerHTML + '&nbsp;' + iconHtml;
          clonedCell.rowSpan = colspanCells[cellIndex]['colspan'];
          clonedCell.setAttribute('data-colspan-label', colspanText);
          clonedCell.classList.add('tb-colspan-header');
        }
      }

      if(row.classList.length > 0) {
        for (let className of row.classList) {
          clonedCell.classList.add(className);
        }
      }
     
      transposed[cellIndex][rowIndex] = clonedCell;
      colspanIndex += 1;
    });
  });

  const newTbody = document.createElement('tbody');
  transposed.forEach(rowCells => {
    const row = newTbody.insertRow();
    rowCells.forEach(cell => {
      row.appendChild(cell);
    });
  });

  const oldTbody = table.querySelector('tbody');
  table.replaceChild(newTbody, oldTbody);

  const thead = table.querySelector('thead');
  if (thead != null) {
    $(thead).remove();
  }
}


function callAfterChanges(initialCall) {
  var reportSavedValues = jQuery('#tb-dbr-set-curr-filter').data('tbDbrValue');

  stickIt(true);
  $("#control-buttons-row").prependTo('#display-buttons-div');  

  if ($('#shortcut-to-chart-settings').length > 0) {
  $('#shortcut-to-chart-settings').on('click', function(e) {
    $('#chart-customization-tab-wrapper')[0].style.display = 'block';
    $('.chart-customization-tab').click();
    $('.chart-customization-tab').focus();
  });       
  }

  var transposeTables = document.querySelectorAll('.tb-transposed-table');
  
  transposeTables.forEach((table) => {
  transposeTable(table);
  });

/*
  var transposeIcons = document.querySelectorAll('.tb-transpose-row');
  if (transposeIcons !== null) {
  transposeIcons.forEach(function (transposeIcon) {
    transposeIcon.addEventListener('click', function (event) {
    var row = event.target.closest('tr');
    var cells = row.querySelectorAll('td');
    var colspanRow = row.closest('table').querySelector('.tb-colspan-row');
    var colspanIndex = 0;
    var colspanCells = [];

    Array.from(colspanRow.querySelectorAll('th')).map(function(cell) {
      colspanCells[colspanIndex] = cell.innerText ? [cell.innerText, cell.dataset.originalColspan || '1'] : [cell.textContent, cell.dataset.originalColspan || '1'];
      colspanIndex += cell.dataset.originalColspan ? Number(cell.dataset.originalColspan) : 1;
    });

      var headersRow = row.closest('table').querySelector('thead').lastElementChild;
    var headerCells = Array.from(headersRow.querySelectorAll('th')).map(function(th) {
      return th.innerText || th.textContent;
    });

    var transposeTable = document.getElementById('transposeTable');
    transposeTable.innerHTML = '';

    cells.forEach(function (cell, index) {
      var newRow = transposeTable.insertRow();
      console.log(colspanCells[index], index);
      if (typeof colspanCells[index] !== "undefined") {
        var colspanCell = newRow.insertCell();
      colspanCell.innerHTML = colspanCells[index][0] ? `<strong>${colspanCells[index][0]}</strong>` : '';
      colspanCell.rowSpan = colspanCells[index][1];
      }
      var nameCell = newRow.insertCell();
          nameCell.innerHTML = headerCells[index] ? `<strong>${headerCells[index]}</strong>` : '';
      var valueCell = newRow.insertCell();
      valueCell.innerText = cell.innerText;
    });

    $('#transposeModal').modal('show');
    });
  });
  }
*/

  document.querySelectorAll('th[rowspan]').forEach(function(th) {
  th.addEventListener('click', function(event) {
    var initialCall = false;
    var targetIsIcon = event.target.matches('.tb-colspan-controls');
    var icon = targetIsIcon ? event.target : th.querySelector('.tb-colspan-controls');

    if (!icon) return;

      var isCollapsed = th.getAttribute('data-is-collapsed');

      if(isCollapsed === null) {
        th.setAttribute('data-is-collapsed', true);
        initialCall = true;
      }

      isCollapsed = isCollapsed == 'true' ? true : false;

    var currentRowspan = parseInt(th.getAttribute('rowspan'), 10);
    var originalRowspan = parseInt(th.getAttribute('data-original-rowspan') || currentRowspan, 10);

      if(currentRowspan != 1) {
        th.setAttribute('rowspan', 1);
      }

    if (th.getAttribute('data-original-rowspan') === null) {
        th.setAttribute('data-original-rowspan', currentRowspan);
      }

    var rowIndex = Array.from(th.closest('table').rows).indexOf(th.closest('tr'));
    var totalRows = th.closest('table').rows.length;

    for (let i = rowIndex + 1; i < rowIndex + originalRowspan && i < totalRows; i++) {
    var row = th.closest('table').rows[i];
    if (row) {
      Array.from(row.cells).forEach(cell => {
            if(initialCall && cell.tagName == 'TH') {
              cell.textContent = th.getAttribute('data-colspan-label') + ' · ' + cell.textContent;
            }
      cell.classList.toggle('hide', !isCollapsed);
      });
    }
    }

      if(isCollapsed) {
        th.setAttribute('data-is-collapsed', 'false');
      }
      else {
        th.setAttribute('data-is-collapsed', 'true');
      }

      if(initialCall) {
        return;
      }

    if (icon.classList.contains('fa-caret-down')) {
    icon.classList.replace('fa-caret-down', 'fa-caret-up');
    } else if (icon.classList.contains('fa-caret-up')) {
    icon.classList.replace('fa-caret-up', 'fa-caret-down');
    }
  });
  });

  document.querySelectorAll('th[colspan]').forEach(function(th) {
  th.addEventListener('click', function(event) {
    var targetIsIcon = event.target.matches('.tb-colspan-controls');
    var icon = targetIsIcon ? event.target : th.querySelector('.tb-colspan-controls');
    
    if (!icon) return;
    
    var isCollapsed = th.getAttribute('colspan') === '1';
    var currentColspan = parseInt(th.getAttribute('colspan'));
    var originalColspan = parseInt(th.getAttribute('data-original-colspan') || currentColspan);
    
    var newColspan = isCollapsed ? originalColspan : 1;
    th.setAttribute('colspan', newColspan);
    if (!isCollapsed) th.setAttribute('data-original-colspan', currentColspan);
    
    var allCells = Array.from(th.parentNode.querySelectorAll('th'));
    var startIndex = allCells.indexOf(th);
    var actualStartIndex = allCells.slice(0, startIndex).reduce((acc, cell) => acc + parseInt(cell.getAttribute('data-original-colspan') || 1), 0);
    var table = th.closest('table');

      if(table != null) {
        Array.from(table.querySelectorAll('tr')).forEach(row => {
          if($(row).hasClass('tb-colspan-row'))
          {
            return;
          }

          Array.from(row.querySelectorAll('th, td')).forEach((cell, index) => {
            if (!cell.hasAttribute('colspan') && (index >= actualStartIndex + 1 && index < actualStartIndex + originalColspan)) {
              cell.classList.toggle('hide', !isCollapsed);
            }
          });
        });

    if (icon.classList.contains('fa-caret-right')) {
      icon.classList.replace('fa-caret-right', 'fa-caret-left');
    } else if (icon.classList.contains('fa-caret-left')) {
      icon.classList.replace('fa-caret-left', 'fa-caret-right');
    }    

        var parentTable = th.closest('table');

        var originalThead = parentTable.querySelector('thead.original');
        var clonedThead = parentTable.querySelector('thead.cloned');

        if(originalThead !== null && clonedThead !== null) {
          while (clonedThead.firstChild) {
            clonedThead.removeChild(clonedThead.firstChild);
          }

          Array.from(originalThead.childNodes).forEach(child => {
            clonedThead.appendChild(child.cloneNode(true));
          });
        }

        $(parentTable).floatingScroll("update");
      }
  });
  });

  $('.tb-colspan-controls').click();
  applyColspanStates();

  if($('table.report-tables th[colspan], table.report-tables th[rowspan]').length > 0) {
    $('#expand_groups_button').removeClass('hide');
  }

  $('.report-tabs').on('click', function() {
    // setTimeout s 0 ms za da se izpulni sled bootstrap js-a (sled kato taba se e switchnal veche)
    setTimeout(() => {
      saveActiveTab();
    }, "0");
  });

  //Advanced mode hide/show icons
  $(".tb-lock-filters").on('change', function() {
    let icon = ".tb-locked-filter-icon[data-for-filter='" + $(this).attr('id') + "']";
    if (this.checked) {
      $(this).val("locked");
      $(icon).show();
    } else {
      $(this).val("unlocked");
      $(icon).hide();
    }
  });

  $(".tb-hide-filters").on('change', function() {
    let icon = ".tb-visible-filter-icon[data-for-filter='" + $(this).attr('id') + "']";
    //console.log("icon", icon);
    if (this.checked) {
      $(this).val("checked");
      $(icon).show();
    } else {
      $(this).val("unchecked");
      $(icon).hide();
    }
  });

  $(".tb-required-filters").on('change', function() {
    let icon = ".tb-required-filter-icon[data-for-filter='" + $(this).attr('id') + "']";
    if (this.checked) {
      $(this).val("required");
      $(icon).show();
    } else {
      $(this).val("not_required");
      $(icon).hide();
    }
  });

  $(".tb-include-empty-value-filters").on('change', function() {
    let icon = ".tb-empty-value-included-filter-icon[data-for-filter='" + $(this).attr('id') + "']";
    if (this.checked) {
      $(this).val("1");
      $(icon).show();
    } else {
      $(this).val("0");
      $(icon).hide();
    }
  });

  $(".transpose-result").on('change', function() {
    if (this.checked) {
      $(this).val("1");
    } else {
      $(this).val("0");
    }
  });

  $("#import-report-details").on("click", function() {
    $("#FileUpload").trigger('click');
  });

  $("#FileUpload:file").on('change', function() {
    var fileName = $(this).get(0).files[0];
    const reader = new FileReader();
    reader.addEventListener("loadend", function() {
      let reportParams;
      try {
        decrypted = decodeURIComponent(escape(window.atob(reader.result)));
        reportParams = JSON.parse(decrypted);
      } catch (error) {
        TB.createNotification("Error", "Invalid dbr file!", "error");
        $('#FileUpload').val('');
        return;
      }

      if (fromBinary(reportParams['tb-dbr-filters']['sid']) == $('[name="sid"]').val() && !$("input[name=saved_filter_id]").val() && !$("input[name=saved_filter_id2]").val()) {
        var formulaCols = [];

        for (var form in reportParams) {
          for (var key in reportParams[form]) {
            reportParams[form][key] = fromBinary(reportParams[form][key]);

            if (key == 'saved_filter_id2' || reportParams[form][key] == 'Default value' || key == 'export_as') {
              continue;
            }

            if (key.startsWith("tb_formula_cols_")) {
              var parsedObject = JSON.parse(reportParams[form][key]);
              formulaCols.push({
                value: reportParams[form][key],
                name: parsedObject['name'],
                subrep: parsedObject['subrep']
              });

              continue;
            }

            var $ele = '[name="' + key + '"]';

            if ($($ele).attr('type') == 'text') {
              if ($($ele).hasClass("tb_name_input_box")) {
                $('.tb_name_input_box[data-id-name="' + key + '"]').val(reportParams[form][key]);
                $('.tb_add_filter_descr_label_span[data-id-name="' + key + '"]').text(reportParams[form][key]);
              } else if ($($ele).hasClass("tb_descr_input_box")) {
                $id_key = $($ele).attr('data-id-name');
                $('.tb_descr_input_box[data-id-name="' + $id_key + '"]').val(reportParams[form][key]);
                $('.filter_descr_text[data-id-name="' + $id_key + '"]').text(reportParams[form][key]);
              } else if ($($ele).hasClass("tb-dbr-date-picker")) {
                $($ele).val(reportParams[form][key]);
              } else {
                $($ele).val(reportParams[form][key]);
              }
              $($ele).attr('value', reportParams[form][key]);
            } else if ($($ele).attr('type') == 'checkbox') {
              if (Array.isArray(reportParams[form][key])) {
                var checkboxes = $("#" + form).find('input[name="' + key + '"]');
                $.each(checkboxes, function(index, value) {
                  if (!reportParams[form][key][index]) {
                    $(this).prop('checked', false);
                  } else {
                    $(this).prop('checked', true);
                  }
                });
              } else if ($($ele).prop('checked') != reportParams[form][key]) {
                $('#' + form).find('input[name="' + key + '"]').click();
              }
            } else if ($($ele).attr('type') == 'number') {
              if ($($ele).hasClass("tb-add-order-number")) {
                $('.tb-add-order-number[data-id-name="' + key.replace("tb-add_order_", "") + '"]').val(reportParams[form][key]);
              } else if ($($ele).hasClass("tb-order-number")) {

                $('.tb-order-number[data-id-name="' + key.replace("tb-order_", "") + '"]').val(reportParams[form][key]);
              }
            } else if ($($ele).attr('type') == 'radio') {
              $($ele + '[value="' + reportParams[form][key] + '"]').click();
            } else if ($($ele).is('textarea')) {
              if ($($ele).hasClass("tb_subrep_edit_inputbox")) {
                $id_key = key.replace('_edit_inputbox', '');
                $('.subrep_description[data-id-name="' + $id_key + '"]').text(reportParams[form][key]);
              }
              if ($($ele).hasClass('tb_helper_descr_input_box')) {
                $id_key = $($ele).attr('data-id-name');
                $('.filter_tooltips[data-id-name="' + $id_key + '"]').attr("data-original-title", reportParams[form][key]);
                if ($('.filter_tooltips[data-id-name="' + $id_key + '"]').attr("data-original-title").length > 0) {
                  $('.filter_tooltips[data-id-name="' + $id_key + '"]').show();
                }

              }
              if ($($ele).hasClass('tb_add_name_input_box')) {
                $id_key = $($ele).attr('data-id-name');
                $('.tb-add-tooltips[data-id-name="' + $id_key + '"]').attr("data-original-title", reportParams[form][key]);

                if ($('.tb-add-tooltips[data-id-name="' + $id_key + '"]').attr("data-original-title").length > 0) {
                  $('.tb-add-tooltips[data-id-name="' + $id_key + '"]').show();
                }

              }
              $($ele).text(reportParams[form][key]);
              $($ele).val(reportParams[form][key]);

            } else if ($($ele).is('select')) {
              if (reportParams[form][key] == "") {
                $($ele + ' option[value=""]').prop('selected', 'true');
                $($ele).tbselectize()[0].selectize.setValue("");
              } else if (Array.isArray(reportParams[form][key])) {
                reportParams[form][key].forEach(mapOptions);

                function mapOptions(item) {
                  $($ele + ' option[value="' + item + '"]').prop('selected', 'true');
                }
                $($ele).tbselectize()[0].selectize.setValue(reportParams[form][key]);
              } else {
                $($ele + ' option[value="' + reportParams[form][key] + '"]').prop('selected', 'true');
                $($ele).tbselectize()[0].selectize.setValue(reportParams[form][key]);
              }
            }
          }
        }

        if (formulaCols.length > 0) {
          for (let i = 0; i < formulaCols.length; i++) {
            const item = formulaCols[i];
            var formulaInput = $("<input>", {
              type: "text",
              style: "display:none;",
              value: item['value'],
              subrep: item['subrep'],
              name: "tb_formula_cols_" + item['name']
            });

            $('#tb-dbr-filters').append(formulaInput);
          }

          $("#tb-dbr-filters").append("<input type='hidden' name='empty_rep_submit' value='1'/>");
          $("#tb-dbr-filters").append("<input type='hidden' name='display_as' value='table'/>");
          $('[name="is_empty_rep_submit"]').val(1);
          $("#tb-dbr-filters").submit();
          $("#load-modal").modal();
        }

        TB.createNotification("Success!", "The report was successfully imported!", "success");
      } else {
        TB.createNotification("Error!", "Report mismatch!", "error");
      }

      $('#FileUpload').val('');
    });

    reader.readAsText(fileName);
  });

  $("#export-report-details").on("click", function() {
    var reportParams2 = {};
    var anchor = $(this);

    $("form, .add_filters_tabpanels, #customization-mode-tab, #chart-customization-tab").each(function() {
      var inputs = $(this).find('input, select, textarea');
      var form = $(this).attr('id');
      reportParams2[form] = {};
      inputs.each(function(index) {

        var input = $(this);
        if (input.attr('type') == 'checkbox') {
          if (typeof reportParams2[form][input.attr('name')] === 'undefined') {
            reportParams2[form][input.attr("name")] = input.prop('checked');
          } else if (Array.isArray(reportParams2[form][input.attr('name')])) {
            reportParams2[form][input.attr("name")].push(input.prop('checked'));
          } else if (!Array.isArray(reportParams2[form][input.attr('name')])) {
            var onlyVal = reportParams2[form][input.attr("name")];
            reportParams2[form][input.attr("name")] = [];
            reportParams2[form][input.attr("name")].push(onlyVal);
            reportParams2[form][input.attr("name")].push(input.prop('checked'));
          }
        } else if (input.is('textarea')) {
          reportParams2[form][input.attr("name")] = toBinary(input.val());
        } else if (input.attr('type') == 'radio') {
          if (input.prop('checked')) {
            reportParams2[form][input.attr("name")] = toBinary(input.val());
          }
        } else if (input.is('select')) {
          reportParams2[form][input.attr("name")] = toBinary(input.tbselectize()[0].selectize.getValue());
        } else {
          reportParams2[form][input.attr("name")] = toBinary(input.val());
        }

      });

    });

    var exportParams = JSON.stringify(reportParams2);
    exportParams = btoa(unescape(encodeURIComponent(exportParams)));
    anchor.attr('href', "data:text/dbr;," + exportParams);

    $filename = $('#save-query-name').val();

    if ($filename == "") {
      $filename = $('[name="sid"]').val();
    }

    var currentdate = new Date();

    var datetime = currentdate.getDate() + "-" +
      (currentdate.getMonth() + 1) + "-" +
      currentdate.getFullYear() + "-" +
      currentdate.getHours() + "-" +
      currentdate.getMinutes() + "-" +
      currentdate.getSeconds();

    anchor.attr('download', $filename + " - " + datetime + ".dbr");
  });

  //Import/exports reports end

  //filters daterange
  $(".tb-dbr-additinonal-filters-cont").each(function(index) {
    let tabpanel_idx = $(this).data('subrep-idx') + 1;
    $("#add_filters_tabpanel_content_" + tabpanel_idx).append($(this).html());
    //$("#tb-dbr-additional-filters").append($(this).html());
    $(this).html("");
  });

  $('[data-toggle="tooltip"]').tooltip()

  //jQuery('.table-responsive').floatingScroll('update');
  var is_auto_refresh_enabled = false;
  $("#tb-dbr-export-as-btn").click(() => {
    $('[name="max_refreshes"]').val("100");
  });
/*  
  document.addEventListener("click", "#tb-dbr-export-as-btn" function(evnt) {
    if (evnt.target.id != 'tb-dbr-export-as-btn') {
      $('[name="max_refreshes"]').val("100");
    }
  });
*/
  var timer;

  if ($(".tb-report-result-table")[0] && $('#refresh_timer').length > 0 && $('#auto_refresh_time_id').val()) {
    $(".refresh-div").show();
    var duration = $('#auto_refresh_time_id').val();
    display = document.querySelector('#refresh_timer');
    startTimer(duration, display);
    $('#refresh_report_button').on('click', function() {
      $('#stop_timer_button').click();
      autoSubmit();
    });
  } else {
    $(".refresh-div").hide();
  }
  //rep finished res

  //Custom logic 2 

  $('[name="is_shared"]').on('click', function() {
    var is_shared = $(this).prop('checked') ? 1 : 0;
    $(this).prop('value', is_shared);
  });

  $('[name="is_empty_report_enabled"]').on('click', function() {
    var is_empty_enabled = $(this).prop('checked') ? 1 : 0;
    $(this).prop('value', is_empty_enabled);
  });

  $('[name="template_report"]').on('click', function() {
    var is_empty_enabled = $(this).prop('checked') ? 1 : 0;
    $(this).prop('value', is_empty_enabled);
  });

  $('[name="is_pagination_enabled"]').on('click', () => {
    let is_pagination_enabled = $(this).prop('checked') ? 1 : 0;
    $(this).prop('value', is_pagination_enabled);
  });

  $('[name="shell_cmd_uri_escape"').on('click', function() {
    var shell_cmd_uri_escape = $(this).prop('checked') ? 1 : 0;
    $(this).prop('value', shell_cmd_uri_escape);
  });

  $(".custom_rep_dropdown_delete").on("click", function() {
    let old_name = custom_report_name;
    custom_report_name = $(this).data('report-name');
    $(".saved_filter_id_input").val($(this).data("report-id"));
    $("#tb-dbr-save-query-delete").click();
    $(".saved_filter_id_input").val($('[name="saved_filter_id2"]').val());
    custom_report_name = old_name;
  });

  $(".display-report-button").on("click", function() {
    var finalChecksum = JSON.stringify(GetCustomizationFields("#tb-dbr-filters-list"));
    var addFinalChecksum = JSON.stringify(GetCustomizationFields("#tb-dbr-additional-filters"));

    if (!(initialChecksum === finalChecksum)) {
      $('[name="are_report_filters_changed"]').val(1);
    }

    if (!(addInitialChecksum === addFinalChecksum)) {
      $('[name="are_report_columns_changed"]').val(1);
    }

    let flag = false;
    $('.tinymce-textareas').each(function() {
      if ($(this).attr('data-enabled') == 'true') {
        flag = true;
      }
    });
    if (flag) {
      $('input[name="is_custom_html_enabled"]').val("1");
    } else {
      $('input[name="is_custom_html_enabled"]').val("0");
    }

    $('input[name="is_filter_form_submitted"]').val("1");

    //$("#dbreports-overlay").show();
  });

  $(".custom-html-checkboxes").on('change', function() {
    let textarea_id = "#" + $(this).data('textarea-id');
    if (this.checked) {
      $(textarea_id).attr("data-enabled", "true");
      $(this).val("true");

    } else {
      $(textarea_id).attr("data-enabled", "false");
      $(this).val("false");
    }
  });

  $(".add-required-filters").on('change', function() {
    let icon = ".tb-add-required-filter-icon[data-for-filter='" + $(this).attr('name') + "']";
    if (this.checked) {
      $(this).val("required");
      $(icon).show();
    } else {
      $(this).val("not_required");
      $(icon).hide();
    }
  });

  $(".tb-add-lock-filters").on('change', function() {
    let icon = ".tb-add-locked-filter-icon[data-for-filter='" + $(this).attr('name') + "']";
    if (this.checked) {
      $(this).val("locked");
      $(icon).show();
    } else {
      $(this).val("unlocked");
      $(icon).hide();
    }
  });

  $(".tb-add-subsum-filters").on('change', function() {
    let icon = ".tb-add-subsum-filter-icon[data-for-filter='" + $(this).attr('name') + "']";
    if (this.checked) {
      $(this).val("1");
      $(icon).show();
    } else {
      $(this).val("0");
      $(icon).hide();
    }
  });

  $(".tb-add-check-filters").on('change', function() {
    let icon = ".tb-add-visible-filter-icon[data-for-filter='" + $(this).attr('name') + "']";
    if (this.checked) {
      $(this).val("checked");
      $(icon).show();
    } else {
      $(this).val("unchecked");
      $(icon).hide();
    }
  });

  $(".tb-add-show-columns").on('change', function() {
    let icon = ".tb-shown-in-result-filter-icon[data-for-filter='" + $(this).attr('name') + "']";
    if (this.checked) {
      $(this).val("1");
      $(icon).show();
    } else {
      $(this).val("0");
      $(icon).hide();
    }
  });

  $(".tb-check-all-visible-primary-filters").on('change', function() {
    if (this.checked) {
      $('.tb-primary-visible-filters').prop("checked", true);
      $('.tb-primary-visible-filters').val("checked");
    } else {
      $('.tb-primary-visible-filters').prop("checked", false);
      $('.tb-primary-visible-filters').val("unchecked");
    }
  });

  $(".tb-check-all-primary-lock-filters").on('change', function() {
    if (this.checked) {
      $('.tb-primary-lock-filters').prop("checked", true);
      $('.tb-primary-lock-filters').val("locked");
    } else {
      $('.tb-primary-lock-filters').prop("checked", false);
      $('.tb-primary-lock-filters').val("unlocked");
    }
  });

  $(".tb-check-all-primary-required-filters").on('change', function() {
    if (this.checked) {
      $('.tb-primary-required-filters').prop("checked", true);
      $('.tb-primary-required-filters').val("required");
    } else {
      $('.tb-primary-required-filters').prop("checked", false);
      $('.tb-primary-required-filters').val("not_required");
    }
  });


  $(".tb-check-all-primary-empty-value-filters").on('change', function() {
    if (this.checked) {
      $('.tb-primary-empty-val-filters').prop("checked", true);
      $('.tb-primary-empty-val-filters').val("1");
    } else {
      $('.tb-primary-empty-val-filters').prop("checked", false);
      $('.tb-primary-empty-val-filters').val("0");
    }
  });

  $(".tb-check-all-secondary-visible-filters").on('change', function() {
    if (this.checked) {
      $('.tb-secondary-visible-filters').prop("checked", true);
      $('.tb-secondary-visible-filters').val("checked");
    } else {
      $('.tb-secondary-visible-filters').prop("checked", false);
      $('.tb-secondary-visible-filters').val("unchecked");
    }
  });

  $(".tb-check-all-secondary-lock-filters").on('change', function() {
    if (this.checked) {
      $('.tb-secondary-lock-filters').prop("checked", true);
      $('.tb-secondary-lock-filters').val("locked");
    } else {
      $('.tb-secondary-lock-filters').prop("checked", false);
      $('.tb-secondary-lock-filters').val("unlocked");
    }
  });

  $(".tb-check-all-secondary-required-filters").on('change', function() {
    if (this.checked) {
      $('.tb-secondary-required-filters').prop("checked", true);
      $('.tb-secondary-required-filters').val("required");
    } else {
      $('.tb-secondary-required-filters').prop("checked", false);
      $('.tb-secondary-required-filters').val("not_required");
    }
  });

  $(".tb-check-all-secondary-empty-value-filters").on('change', function() {
    if (this.checked) {
      $('.tb-secondary-empty-val-filters').prop("checked", true);
      $('.tb-secondary-empty-val-filters').val("1");
    } else {
      $('.tb-secondary-empty-val-filters').prop("checked", false);
      $('.tb-secondary-empty-val-filters').val("0");
    }
  });

  $(".tb-check-all-subsums").on('change', function() {
    var table = $(this).closest('table');

    if (this.checked) {
      table.find('.tb-add-subsum-filters').prop("checked", true);
      table.find('.tb-add-subsum-filters').val('1');
    } else {
      table.find('.tb-add-subsum-filters').prop("checked", false);
      table.find('.tb-add-subsum-filters').val('0');
    }
  });

  $(".tb-check-all-columns").on('change', function() {
    var table = $(this).closest('table');

    if (this.checked) {
      table.find('.tb-add-show-columns').prop("checked", true);
      table.find('.tb-add-show-columns').val('1');
    } else {
      table.find('.tb-add-show-columns').prop("checked", false);
      table.find('.tb-add-show-columns').val('0');
    }
  });

  $("#is_pagination_enabled").on('change', function() {
    if (this.checked) {
      $('#is_pagination_enabled').prop("checked", true);
      $('#is_pagination_enabled').val('1');
    } else {
      $('#is_pagination_enabled').prop("checked", false);
      $('#is_pagination_enabled').val('0');
    }
  });


  $("#show_cols_labels_id").on('change', function() {
    if (this.checked) {
      $('#show_cols_labels_id').prop("checked", true);
      $('#show_cols_labels_id').val('1');
    } else {
      $('#show_cols_labels_id').prop("checked", false);
      $('#show_cols_labels_id').val('0');
    }
  });

  $("#shell_cmd_uri_escape_id").on('change', function() {
    if (this.checked) {
      $('#shell_cmd_uri_escape_id').prop("checked", true);
      $('#shell_cmd_uri_escape_id').val('1');
    } else {
      $('#shell_cmd_uri_escape_id').prop("checked", false);
      $('#shell_cmd_uri_escape_id').val('0');
    }
  });

  $("#auto_run_report").on('change', function() {
    if (this.checked) {
      $('#auto_run_report').prop("checked", true);
      $('#auto_run_report').val('1');
    } else {
      $('#auto_run_report').prop("checked", false);
      $('#auto_run_report').val('0');
    }
  });

  $("#hide_filters").on('change', function() {
    if (this.checked) {
      $('#hide_filters').prop("checked", true);
      $('#hide_filters').val('1');
    } else {
      $('#hide_filters').prop("checked", false);
      $('#hide_filters').val('0');
    }
  });

  $('.tb-add-tooltips').each(function() {
    if ($(this).data('original-title') != null && $(this).data('original-title') != "") {
      $(this).show();
    }
  });


  $('.filter_tooltips').each(function() {
    if ($(this).data('original-title') != null && $(this).data('original-title') != "") {
      $(this).show();
    }
  });

  $('.subrep_description[data-title=""]').text("Subreport Description");
  $('.tb-checkbox-hide[data-is-shown="checked"]').show();
  $('.tb-addcheckbox-hide[data-is-shown="checked"]').show();
  $('.tb-lock-class[data-locked="locked"]').prop("disabled", true);

  if ($('[name="saved_filter_id2"]').val() != '') {
    var custom_report_name = $('#save-query-name').val();
  }

  $('#tb-dbr-save-query-save').on('click', function() {
    if (!validateCustomFields()) {
      return false;
    }

    if ($('[name="saved_filter_id2"]').val() != '') {
      if (confirm("Are you sure that you want to modify the following custom report: " + custom_report_name)) {
        $('[name="show_custom_fields"]').val("0");
        $("[name=show_custom_fields]").val(0);
        $("#load-modal").modal();
      } else {
        return false;
      }
    } else {
      $('[name="show_custom_fields"]').val("0");
      $("#load-modal").modal();
    }
  });

  $('#tb-dbr-save-query-save-as-new').on('click', function() {
    if (!validateCustomFields()) {
      return false;
    }

    $('[name="show_custom_fields"]').val("0");
    $("#load-modal").modal();
  });

  $('#tb-dbr-save-query-cancel').on('click', function() {
    if (!confirm("Are you sure that you want to CLOSE the form? All information in the form will be LOST!")) {
      return false;
    } else {
      if ($("[name=show_custom_fields]").val() == "1") {
        $('#tb-dbr-save-query-btn').click();
      }
    }
  });

  $('#tb-dbr-save-query-delete').on('click', function() {

    if (confirm("Are you sure that you want to DELETE the following custom report: " + custom_report_name + "?")) {
      $("[name=show_custom_fields]").val(0);
      $("#load-modal").modal();

    } else {
      return false;
    }
  });

  $('[name="previous_subrep"]').val($('#subrep_id').val());

  var td_click = false;

  if ($('[name="auto_refresh_time_db"]').val() && !$('#auto_refresh_time_id').val()) {
    $('#auto_refresh_time_id').val($('[name="auto_refresh_time_db"]').val());
  }

  $('#auto_refresh_time_id').keyup(function() {
    $('[name="auto_refresh_time_db"]').val($('#auto_refresh_time_id').val());
  });

  if ($('#auto_run_report').val()) {
    let flag = false;
    $('.tinymce-textareas').each(function() {
      if ($(this).attr('data-enabled') == 'true') {
        flag = true;
      }
    });
    if (flag) {
      $('input[name="is_custom_html_enabled"]').val("1");
    } else {
      $('input[name="is_custom_html_enabled"]').val("0");
    }
  }

  let default_report_format = $('#default_rep_format').val();
  if (default_report_format != '') {
    $('[name="export_as"][value="' + default_report_format + '"]').click();
  }

  $('[name="export_as"]:checked').click();

  /*
  $('.tinymce-textareas[data-is-raw="false"]').each(async function() {
    let self = this;
    let subrep_id = $(self).attr('id');
    let pluginOptions = {
      "selector": '#' + subrep_id,
      "valid_children": "+body[style],+body[style]",
      "elementpath": false,
      "height": 150,
      "theme": "modern",
      "skin": "lightgray-gradient",
      "plugins": [
        "base64image",
        "code",
        "image",
        "preview"
      ],
      "image_advtab": false,
      "resize": true,
      "paste_data_images": true,
      "max_image_count": 10,
      "max_image_size": 512000,
      "max_image_height": 1024,
      "max_image_width": 1024,
      "forced_root_block": "",
      "toolbar1": "undo redo | base64image styleselect | link image | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | forecolor backcolor | preview print code",
      "setup": function(editor) {
        editor.on('change', function(e) {
          $(self).val(editor.getContent());
        });
      }
    };

    if (typeof tinyMCE !== 'undefined') {
      while (tinyMCE.editors.length > 0) {
        try {
          tinyMCE.remove(tinyMCE.editors[0]);
        } catch (e) {}
      }
    }

    await TB.loadJSFile('tinymce-4');
    $(pluginOptions.selector).one('click', function() {
      tinymce.init(pluginOptions);
    });
  });
  */

  $(".tb-locked-filter-icon[data-is-locked='unlocked'").hide();
  $(".tb-add-locked-filter-icon[data-is-locked='unlocked'").hide();
  $(".tb-visible-filter-icon[data-is-visible='unchecked'").hide();
  $(".tb-add-visible-filter-icon[data-is-visible='unchecked'").hide();
  $(".tb-required-filter-icon[data-is-required='not_required'").hide();
  $(".tb-add-required-filter-icon[data-is-required='not_required'").hide();
  $(".tb-shown-in-result-filter-icon[data-is-enabled='0'").hide();
  $(".tb-add-subsum-filter-icon[data-is-sum='0'").hide();
  $(".tb-empty-value-included-filter-icon[data-empty-value-included='0']").hide();
  $(".tb-empty-value-included-filter-icon[data-empty-value-included='']").hide();

  $(document).on('click', '.allow-focus', function(e) {
    e.stopPropagation();
  });

  if ($('.tb-dbr-col-filters')[0]) {
    $('[name="are_add_filters_visible"]').val(1);
  }

  if ($('#report_display_type_id').val() == 'chart' && !$('[name="is_rep_owner"]').val()) {
    $('#tb-dbr-filters').hide();
  }

  $('[name="is_empty_rep_submit"]').val("0");


  $(document).ready(function() {
    $('.report-tables tbody').on('click', 'td', function() {
      if (!td_click && typeof DBRCellClickCallback === "function") {
        td_click = true;

        var object = {
          row: $(this).closest("tr").index(),
          column: $(this).closest("td").index(),
          html_val: $(this).html(),
          td_cell_ref: $(this),
          parent_table_id: $(this).parents("table:first").attr("id"),
          report_id: $(this).parents("table:first").data("rep-id"),
          subrep_idx: $(this).parents("table:first").data("subrep-idx")
        };

        DBRCellClickCallback(object);

        td_click = false;
      }
    });
  });

  TB.DBRepCore().initialAPIPayload = $('.tb-dbr-api-payload').text();

  $('#tb-api-params-modal').on('show.bs.modal', function() {
    reloadAPIParams();
  });

  $('.tb-dbr-api-toggle-params-button').on('click', function() {
    $('.tb-dbr-api-label-textinput').each((i, e) => {
      var $e = $(e);
      var name = $e.data('for');
      var prefix = $e.data('filter-prefix');
      var $input = $(`[name="${name}"]`);
      var handleChange = () => $e.text(getTooltipText(`${prefix}value`, $input.val()));
      handleChange();
      $input.on('input', handleChange);
    });

    $('.tb-dbr-api-label-selectbox').each((i, e) => {
      var $e = $(e);
      var name = $e.data('for');
      var prefix = $e.data('filter-prefix');
      var $input = $(`[name="${name}"]`);
      var handleChange = () => $e.text(getTooltipText(`${prefix}value`, $input.val()));
      handleChange();
      $input.on('input', handleChange);
      $input.on('dp.change', handleChange);
    });

    $('.tb-dbr-api-label-range').each((i, e) => {
      var name = $(e).data('for');
      var prefix = $(e).data('filter-prefix');
      var $startLabel = $(e).find('.tb-dbr-api-label-start');
      var $endLabel = $(e).find('.tb-dbr-api-label-end');
      //			var $singleLabel = $(e).find('.tb-dbr-api-label-single-date');
      var startName = name.startsWith('a_f_') ? `${name}_s` : `${name}_start`;
      var endName = name.startsWith('a_f_') ? `${name}_f` : `${name}_end`;
      var singleName = name.startsWith('a_f_') ? `${name}_v` : `${name}`;
      var $startInput = $(`[name="${startName}"]`);
      var $endInput = $(`[name="${endName}"]`);
      var $singleInput = $(`[name="${singleName}"]`);
      var handleChange = isLoading => {
        if ($(`#${name}_range_date`).length > 0) {
          if ($(`#${name}_range_date`).prop('checked') || isLoading === true) {
            $endLabel.show();
            $startLabel.text(getTooltipText(`${prefix}start_value`, $startInput.val()));
            $endLabel.text(getTooltipText(`${prefix}end_value`, $endInput.val()));
          } else {
            $startLabel.text(getTooltipText(`${prefix}_single_date_value`, $singleInput.val()));
            $endLabel.hide();
          }
        } else {
          $startLabel.text(getTooltipText(`${prefix}start_value`, $startInput.val()));
          $endLabel.text(getTooltipText(`${prefix}end_value`, $endInput.val()));
          $endLabel.show();
        }
      };

      handleChange(true);
      $startInput.on('apply.daterangepicker hide.daterangepicker hideCalendar.daterangepicker input', handleChange);
      $endInput.on('apply.daterangepicker hide.daterangepicker hideCalendar.daterangepicker input', handleChange);
      $singleInput.on('dp.change input', handleChange);
      $(`#${name}_range_date`).change(handleChange);
    });

    $('.tb-dbr-api-label-ignore-year').each((i, e) => {
      var $ignoreYearLabel = $(e).find('.tb-dbr-api-ignore-year');
      var name = $(e).data('for');
      var prefix = $(e).data('filter-prefix');
      var ignoreYearName = name.startsWith('a_f_') ? `${name}_f` : `${name}_ignore_year`;
      var $input = $(e).closest('form').find(`[name="${ignoreYearName}"]`);
      var handleChange = () => {
        if ($(`#${name}_ignore_year`)[0] != null) {
          $(e).text(getTooltipText(`${prefix}ignore_year_value`, $input.prop('checked') ? 'true' : 'false'));
        }
      }

      handleChange();
      $input.change(handleChange);
    });

    $('.tb-dbr-api-label-groupby').each((i, e) => {
      var $input = $(`[name="${$(e).data('for')}"]`);
      var prefix = $(e).data('filter-prefix');

      function handleChange() {
        var json = $input.find(':selected').data('data');

        var value = undefined;
        if (json !== undefined) {
          value = json['api_name'];
        }

        if (value !== undefined) {
          value = value == 'hide' ? 'hide' : `group_by_${value}`;
          $(e).text(getTooltipText($(e).data('api-param-name'), value));
        }
      };

      handleChange();
      $input.on('change', handleChange);
    });

    $('.tb-dbr-api-label-agg').each((i, e) => {
      var row_div = $(e).parent().parent().siblings()[0];
      var $input = $(row_div).find(`[name="${$(e).data('for')}_agg"]`);
      var prefix = $(e).data('filter-prefix');

      function handleChange() {
        var value = $input.val();
        if (value != ' ' && value != '') {
          $(e).text(getTooltipText(`${prefix}agg`, $input.val()));
        } else {
          $(e).text('');
        }
      };

      handleChange();
      $input.on('change', handleChange);
    });

    $('.tb-dbr-api-label-operator').each((i, e) => {
      var $input = $(`[name="${$(e).data('for')}_o"]`);
      var prefix = $(e).data('filter-prefix');
      var handleChange = () => $(e).text(getTooltipText(`${prefix}operation`, $input.val()));
      handleChange();
      $input.on('change', handleChange);
    });

    $('.tb-dbr-api-label-filt-operator').each((i, e) => {
      var $input = $(`[name="${$(e).data('for')}_operation"]`);
      var prefix = $(e).data('filter-prefix');
      var handleChange = () => $(e).text(getTooltipText(`${prefix}operation__value`, $input.val()));
      handleChange();
      $input.on('change', handleChange);
    });

    $('.tb-dbr-api-label-operator-text').each((i, e) => {
      var $input = $(`[name="${$(e).data('for')}_v"]`);
      var prefix = $(e).data('filter-prefix');
      var handleChange = () => $(e).text(getTooltipText(`${prefix}value`, $input.val()));
      handleChange();
      $input.on('input', handleChange);
    });

    $('.tb-dbr-api-label-operator-bool').each((i, e) => {
      var $input = $(`[name="${$(e).data('for')}_o"]`);
      var prefix = $(e).data('filter-prefix');
      var handleChange = () => $(e).text(getTooltipText(`${prefix}operation`, $input.filter(':checked').val()));
      handleChange();
      $input.on('input', handleChange);
    });

    $('.tb-dbr-api-ui').toggleClass('hide');
  })

  function setCheckboxes(selector, attr, valueMap) {
    $(selector).each(function() {
      var $this = $(this);
      var attrValue = attr === 'value' ? $this.attr(attr) : $this.data(attr);
      if (valueMap.hasOwnProperty(attrValue)) {
        $this.prop('checked', valueMap[attrValue]);
      }
    });
  }

  setCheckboxes('.transpose-result', 'value', {
    '0': false,
    '1': true
  });
  setCheckboxes('.custom-html-checkboxes', 'value', {
    'true': true
  });
  setCheckboxes('.tb-hide-filters', 'checked', {
    'checked': true,
    'unchecked': false
  });
  setCheckboxes('.tb-add-check-filters', 'checked', {
    'checked': true,
    'unchecked': false
  });
  setCheckboxes('.tb-lock-filters', 'locked', {
    'locked': true,
    'unlocked': false
  });
  setCheckboxes('.add-required-filters', 'required', {
    'required': true,
    'not_required': false
  });
  setCheckboxes('.tb-required-filters', 'required', {
    'required': true,
    'not_required': false
  });
  setCheckboxes('.tb-add-lock-filters', 'locked', {
    'locked': true,
    'unlocked': false
  });
  setCheckboxes('.tb-add-show-columns', 'value', {
    '0': false,
    '1': true
  });
  setCheckboxes('.tb-add-subsum-filters', 'value', {
    '0': false,
    '1': true
  });
  setCheckboxes('.tb-include-empty-value-filters', 'value', {
    '0': false,
    '1': true
  });

  if ($('.saved_filter_id_input').val() ||
    $('[name="saved_filter_id2"]').val() ||
    $('[name="are_report_filters_changed"]').val() == 1 ||
    $('[name="are_report_columns_changed"]').val() == 1
  ) {
    $('#tb-custom-report-message-1').show();
  }

  if ($('[name="are_report_filters_changed"]').val() == 1) {
    $('#tb-custom-report-message-2').show();
  }

  if ($('[name="are_report_columns_changed"]').val() == 1) {
    $('#tb-custom-report-message-3').show();
  }

  initialChecksum = JSON.stringify(GetCustomizationFields("#tb-dbr-filters-list"));
  addInitialChecksum = JSON.stringify(GetCustomizationFields("#tb-dbr-additional-filters"));

  $('.tb-cols-agg').on('change', function(e) {
    var isAggSelected = e.target.value != ' ';
    if (isAggSelected) {
      $('[name="' + $(e.target).data('id') + '_grp"]').tbselectize()[0].selectize.disable();
    } else {
      $('[name="' + $(e.target).data('id') + '_grp"]').tbselectize()[0].selectize.enable();
    }
  });

  $(document).on('click', '.export-as-anchor', function(e) {
    let currTarget = e.currentTarget;
    let exportAsInput = $(currTarget).children('input');
    let exportAsInputVal = $(exportAsInput).val();

    let mode;
    if (exportAsInputVal == 'summarized_report') {
      mode = 0;
    } else if (exportAsInputVal == 'detailed_report') {
      mode = 1;
    } else {
      return;
    }

    changeAllGroupByFields(mode);
  });

  $('.resize-operator-range').toggleClass("col-sm-4 col-sm-8");
  $('.resize-operator-text').toggleClass("col-sm-2 col-sm-4");

  if ($('[name="relative_timestamp_since"]').val() == '' && $('[name="relative_timestamp_since"]').data('DateTimePicker')) {
    $('[name="relative_timestamp_since"]').data('DateTimePicker').date(new Date());
  }

  $("#toggle_report_result_customization_fields").on('click', function(e) {
    e.preventDefault();
    $('#custom_report_result_tab').slideToggle();
  });

  $(function() {
    $('[data-toggle="popover"]').popover()
  })

  $('#chartCustomizationModal').on('show.bs.modal', function(event) {
    let modal = $(this);
    let is_activated = false;
    if ($('.chart-customization-tab-li').is(':visible')) {
      is_activated = true;
    }

    //we do the opposite aaction of is_activated - if its open we close if its closed we open
    modal.find('.modal-title').text('Advanced chart tab ' + (!is_activated ? 'activated' : 'deactivated'));
    modal.find('.modal-body').html('<h5>The advanced chart tab has been ' + (!is_activated ? 'activated' : 'deactivated') + '. </h5>');

    if (!is_activated) {
      $('.chart-customization-tab-li').show();
      $('#navigate_to_chart_tab').show();
    } else {
      $('#navigate_to_chart_tab').hide();
      $('.chart-customization-tab-li').hide();
    }
  });

  $('#navigate_to_chart_tab').on('click', function(e) {
    $('.chart-customization-tab').click();

    $('#chartCustomizationModal').modal('hide');

    $('.chart-customization-tab').focus();
  });


  $('#customizationModeModal').on('show.bs.modal', function(event) {
    let modal = $(this);
    let is_activated = false;
    let additional_info = '';

    if ($('[name="customization-mode-enabled"]').val() == "1") {
      is_activated = true;
      additional_info = 'You can now navigate to the Customization tab and customize the filters there. If you don\'t save your changes after customizing the filters they <b>WILL BE LOST</b>!'
    }

    modal.find('.modal-title').text('Customization mode ' + (is_activated ? 'activated' : 'deactivated'));
    modal.find('.modal-body').html('<h5>The <a class="tb-poppup" type="button" tabindex="0" data-toggle="popover" data-trigger="focus" title="Customization mode" data-content="This mode allows you to see an additional tab that can be used to further customize the report.">customization mode</a> has been ' + (is_activated ? 'activated' : 'deactivated') + '. ' + additional_info + '</h5>');

    if (is_activated) {
      $('.customization-mode-tab-li').show();
      $('#navigate_to_customization_tab').show();
    } else {
      $('#navigate_to_customization_tab').hide();
      $('.customization-mode-tab-li').hide();
    }

    $('[data-toggle="popover"]').popover()
  });

  $("#tb-custom-column-modal").on('show.bs.modal', function(event) {
    let button = $(event.relatedTarget);
    let subrep_id = button.data('subreport');
    let columns = button.data('columns');
    $('#tb_custom_col_subrep_id').attr('value', subrep_id);
    $('#tb_curr_subrep_columns_id').attr('data-columns', JSON.stringify(columns));
  });

  $('#navigate_to_customization_tab').on('click', function(e) {
    $('.customization-mode-tab').click();

    $('#customizationModeModal').modal('hide');

    $('.customization-mode-tab').focus();
  });

  $('#apply_last_values_btn').on('click', function(e) {
    restoreValues();
    $('#restoreLastValuesModal').modal('hide');
    TB.createNotification("Success!", "You've successfully restored your last filter values for the current report!", "success");
  });

  let dbrPrefs = window.localStorage.getItem('dbreports-preferences');
  let currentUser = document.getElementById('dark-theme-username-info');

  if (currentUser != null) {
    currentUser = currentUser.innerText.trim();
    let rep_id = $('[name="sid"]').val();
    dbrPrefs = JSON.parse(dbrPrefs);

    if (dbrPrefs == null || dbrPrefs[currentUser] == null || dbrPrefs[currentUser][rep_id] == null || Object.keys(dbrPrefs[currentUser][rep_id]).length === 0) {
      $('#restore-values-button').hide();
    }
  }

  if ($("[name=show_custom_fields]").val() == "1") {
    $('.customization-mode-tab-li').show();
    toggleCustomizationMode();
  }

  jQuery('#tb-dbr-save-query-btn').click(function(evt) {
    if (!$('.tb-dbr-col-filters')[0]) {
      $("[name=show_custom_fields]").val(1);
      $('#tb-dbr-show-hide-addit-filters-link').click();
      return;
    }

    toggleCustomizationMode();
  });

  jQuery('table.ta-sortable:not(.tb-transposed-table)').each(function(idx, table) {
    sorttable.makeSortable(table);
  });

  $('.tb-report-result-table table:not(.tb-transposed-table) th:not(.tb-colspan-header)').click(function() {
  var $table = $(this).closest('table');
  var $subsumRows = $table.find('.tb-dbr-row-subsum, .tb-dbr-row-summary').detach();
  $table.append($subsumRows);
  });

  dbrButtonDropdown(jQuery('#tb-dbr-dropdown-export'));

  dbrButtonDropdown(jQuery('#tb-dbr-dropdown-chart'));

  // toggle pdf and rawcustom settings
  jQuery('#tb-dbr-dropdown-export').on('change', function(e, customData) {
    if (typeof(customData) !== 'undefined') {
      var isPdfExport = customData.exportAs === 'pdf';
      dbrTogglePdfSettings(isPdfExport);

      var isRawCustomExport = customData.exportAs === 'raw_custom';
      dbrToggleRawCustomSettings(isRawCustomExport);
    }
  });

  $('#tb-dbr-save-query').find('[name="custom_report_mode"]').on('change', function(event) {
    var mode = $(this).val();
    toggleCustomReportModes(mode);
  });

  if (typeof(TB.ChartJs) !== 'undefined') {
    TB.ChartJs.autodetect();
  }

  let enable_pagination_checkbox = $('#is_pagination_enabled')[0];
  let pagination_rows_limit = $('#pagination_rows_limit_group')[0];
  let custom_rep_radio = $('#report_mode')[0];

  if (custom_rep_radio != null) {
    if (!custom_rep_radio.checked) {
      pagination_rows_limit.style.setProperty("display", "none", "important");
    }

    $('input[name="custom_report_mode"]').on('change', () => {
      if (!custom_rep_radio.checked) {
        pagination_rows_limit.style.setProperty("display", "none", "important");
      } else {
        pagination_rows_limit.style.setProperty("display", "block", "important");
      }
    });
  }

  if (enable_pagination_checkbox != null) {
    if (!enable_pagination_checkbox.checked) {
      pagination_rows_limit.style.setProperty("display", "none", "important");
    }

    enable_pagination_checkbox.addEventListener('change', () => {

      if (enable_pagination_checkbox.checked) {
        pagination_rows_limit.style.setProperty("display", "block", "important");
      } else {
        pagination_rows_limit.style.setProperty("display", "none", "important");
      }
    });
  }

  setupRangeDatePickers();

  $('.switch-input-mode').on('click', async function() {
    await switchInputMode(this);
  });

  setLocaleFormat();

  $('.table-responsive table').each(function() {
    let $this = $(this);
    //if ($this.width() > $this.parent().width()) {
    $this.parent().floatingScroll();
    //}
  });

  if ($('.customization-settings-tables thead, .report-tables thead').length > 0) {
    $('.customization-settings-tables thead, .report-tables thead').each(function() {
      let $this = $(this);
      if ($this.parents('table').find('thead.cloned').length === 0) {
        $this.addClass('original').clone(1).insertAfter(this).addClass('cloned').removeClass('original').hide();
      }
    });
  }

  stickIt();

  var currentRow = null;
  var currentSelection = null;

  $('.report-tables tbody tr, .report-tables thead').contextmenu(function(event) {
    event.preventDefault();
    currentSelection = window.getSelection().toString();
    currentRow = this;
    currentTable = $(this).closest('table');

    if($(this).is('thead') || $(this).closest('table').hasClass('tb-transposed-table')) {
      $('#tranpose-row-button').hide();
    } else {
      $('#tranpose-row-button').show();
    }

  var contextMenu = $('#contextMenu');
  contextMenu.css({
    display: 'block',
    left: event.pageX + 'px',
    top: event.pageY - $(window).scrollTop() + 'px'
  });
  });

  $(document).click(function(event) {
  $('#contextMenu').hide();
  });


  $("#tb-copy-btn").click(function(event) {
  const el = document.createElement('textarea');
  el.innerHTML = currentSelection;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  });


  $('#tranpose-row-button').click(function(event) {
    console.log("ROW", currentRow);
  transposeRow(currentRow);
  });

  $('#show-totals-button').click(function(event) {
    var $totalRows = $(currentTable).find('.tb-dbr-row-summary').detach();
    $(currentTable).prepend($totalRows);
  });

  $('.tb-column-tooltips').click(function(event) {
    event.stopPropagation()
    $(this).parent().siblings('span.tb-column-descr').toggleClass('hide');
  });

  if (initialCall && reportSavedValues && reportSavedValues.custom_report_mode != null) {
    toggleCustomReportModes(reportSavedValues.custom_report_mode);
  } else {
    const customReportModeElement = $('[name="custom_report_mode"]:checked');
    if (customReportModeElement.length > 0 && customReportModeElement.val() != null) {
      toggleCustomReportModes(customReportModeElement.val());
    }
  }

  
  window.setDefaultActiveTab(); 
}

async function fetchData(url, postData, filterVals) {
  let timeout = setTimeout(function() {
    $("#dbreports-overlay").show();
  }, 1000);

  var reqSettings = {
    httpMethod: 'POST',
    url: window.location.pathname,
    data: postData,
    timeout: 0
  };

  try {
    let req = new TB.Request(reqSettings);
    let awaitObj = await req.request();

    clearTimeout(timeout);

    if (_.get(req, "requestObj.responseURL") != null && _.get(req, "requestObj.responseURL").includes('login.html')) {
      TB.createNotification("Session expired", "Redirecting...", "warning");
      window.location.href = _.get(req, "requestObj.responseURL");
    }

    var $responseHtml = $('<div>').html(awaitObj.data);
    var newContent = $responseHtml.find('#dbr-main-cont').html();

    if (!newContent) {
      newContent = $responseHtml.find('.right_col').html();
      if (newContent) {
        $('.right_col').html(newContent);
        return;
      }
    } else {
      $('#dbr-main-cont').html(newContent);

      callAfterChanges(false);
      callAfterAjaxOnly();

      //vajno e da e s timeout ot 1ms za da se izpulni pri sledvashtiq tick na JS event loop-a
      setTimeout(function() {
        var dbrReportReady = new Event('tb_dbr_report_ready');
        var dbrEmbReadyEvent = new Event('tb_dbr_emb_ready');

        window.dispatchEvent(dbrReportReady);
        window.dispatchEvent(dbrEmbReadyEvent);
      }, 1);
    }

    $("#dbreports-overlay").hide();
  } catch (err) {
    clearTimeout(timeout);
    TRACE("ERR", err);
    TB.createNotification("Internal Server Error", "Please try again later!", "error");
    $('#tb-dbr-export-as-btn').prop('disabled', false);
    $("#dbreports-overlay").hide();
  };

  let states = localStorage.getItem('dbrStates');
  let newStateId = generateRandomString(7);
  var newState = {
    pathKey: newStateId
  };
  let baseUrl = window.location.href.split('#')[0];
  let newUrl = baseUrl + '#' + newStateId;
  let rep_id = $('[name="sid"]').val();

  if (states !== null) {
    states = JSON.parse(states)

    if (states[newStateId] == null) {
      states[newStateId] = {
        filterVals: filterVals,
        timestamp: Date.now(),
        filtersChecksum: hashString(filterVals),
        repChecksum: hashString(rep_id)
      };

      let sortedEntries = Object.entries(states).sort((a, b) => a[1].timestamp - b[1].timestamp);

      if (sortedEntries.length > 6) {
        sortedEntries = sortedEntries.slice(-6);
      }

      let trimmedStates = sortedEntries.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

      localStorage.setItem('dbrStates', JSON.stringify(trimmedStates));
    }
  } else {
    states = {
      [newStateId]: {
        filterVals: filterVals,
        timestamp: Date.now(),
        filtersChecksum: hashString(filterVals),
        repChecksum: hashString(rep_id)
      }
    };
    localStorage.setItem('dbrStates', JSON.stringify(states));
  }

  history.pushState(newState, '', newUrl);
  saveActiveTab();
}

function appendDataToForm() {
  $displayRepAdds = $('#tb-dbr-filters');

  const clonedElements = [
    '.add_filters_tabpanels',
    '#customization-mode-tab',
    '#chart-customization-tab table:not(.d-none)'
  ];

  var elementsToIterateArr = [
    '#show_as_select',
    '#hide_filters',
    '#auto_run_report',
    '#recipient',
    '#save-query-note',
    '#auto_refresh_time_id',
    '#is_pagination_enabled',
    '#pagination_rows_limit',
    '#previous_page',
    '#default_rep_format',
    '[name="is_custom_html_enabled"]',
    '#report_display_type_id',
    '#show_cols_labels_id',
    '#shell_cmd_id',
    '[name="name"]',
    '#raw_export_mimetype_id',
    '#shell_cmd_uri_escape_id',
    '[name="custom_report_mode"]:checked',
    '[name="export_as"]:checked',
    '[name="ui_hide_filters_table"]',
    '[name="ui_hide_subreport_result_headers"]',
    '[name="ui_hide_report_tab"]',
    '[name="ui_hide_chart_tab"]',
    '[name="ui_hide_report_meta"]',
    '[name="ui_hide_display_button"]',
    '[name="ui_hide_restore_last_values_button"]',
    '[name="ui_hide_api_buttons"]',
    '[name="ui_hide_tabpanel"]',
    '[name="ui_hide_save_tab"]',
    '[name="ui_hide_filter_tabs"]',
    '[name="custom_report_name"]',
    '[name="ui_hide_filter_by_id"]',
    '[name="ui_show_filter_by_id"]',
    '[name="show_body_only"]',
    '[name="ui_ta_hide_title"]',
    '[name="template_report_settings"]',
    '.tb-chart-y-vals',
    '.raw-export-body-delimiters',
    '.tinymce-textareas',
    '.tb-hide-filters:not(:checked)',
    '.tb-lock-filters:not(:checked)',
    '.add-required-filters:not(:checked)',
    '.custom-html-checkboxes',
    '.tb-required-filters:not(:checked)',
    '.tb-add-check-filters:not(:checked)',
    '.tb-add-lock-filters:not(:checked)',
    '.tb-add-subsum-filters:not(:checked)',
    '.tb-add-show-columns:not(:checked)',
    '.tb-include-empty-value-filters:not(:checked)',
    '.result-rows-limit',
  	'.transpose-result:not(:checked)',
    '#export_file_name_id',
		'[name="is_shared"]',
		'[name="is_empty_report_enabled"]'
  ];

  const docFragment = document.createDocumentFragment();

  clonedElements.forEach(selector => {
    const cloned = $(selector).clone().hide();
    $(docFragment).append(cloned);
  });

  function appendHiddenInput(name, value) {
    $('<input>', {
      type: 'hidden',
      name: name,
      value: value
    }).appendTo(docFragment);
  }

  elementsToIterateArr.forEach(selector => {
    $(selector).each(function() {
      appendHiddenInput($(this).attr('name'), $(this).val());
      if (selector === '.tinymce-textareas') {
        appendHiddenInput($(this).attr('name') + '-is-raw', $(this).attr('data-is-raw'));
      }
    });
  });

  appendHiddenInput('display_as', $('[name="display_as"]').val());
  appendHiddenInput('show_body_only', '1');

  const excludedUrlParams = ['saved_filter_id', 'empty_rep_submit'];
  const urlParams = getUrlParameters(window.location.href, excludedUrlParams);

  for (const [key, value] of Object.entries(urlParams)) {
      appendHiddenInput(key, value);
  }

  $displayRepAdds.append(docFragment);

  var serializedData = $displayRepAdds.serialize();

  var disabledInputs = $displayRepAdds.find(':disabled');

  disabledInputs.each(function(index, input) {
    let name = $(input).attr('name');
    let val = $(input).val();

    if(typeof name !== 'undefined' && typeof val !== 'undefined' && val != null) {
      serializedData += `&${encodeURIComponent(name)}=${encodeURIComponent(val)}`;
    }
  });

  if ($('#chart-customization-tab-wrapper')[0].style.display != "none") {
    serializedData += '&chart_settings_tab_wrapper_visible=1';
  }

  if ($('#customization-mode-tab-wrapper')[0].style.display != "none") {
    serializedData += '&customization_tab_wrapper_visible=1';
  }

  return serializedData;
}

function initTBDateRangePickers() {
  jQuery('.tb-dbr-tbdatetimerange-picker').tbDaterangepicker({
    format: TB.CONFIG.DATETIME_FORMAT,
    timePicker: true,
    isDatetimeRange: true
  });
  jQuery('.tb-dbr-tbdaterange-picker').tbDaterangepicker({
    format: TB.CONFIG.DATE_FORMAT,
    isDateRange: true
  });

  jQuery('.tb-dbr-datetime-picker').datetimepicker({
    format: TB.CONFIG.DATETIME_FORMAT,
  });

  jQuery('.tb-dbr-date-picker').datetimepicker({
    format: TB.CONFIG.DATE_FORMAT,
  });
}

function generateRandomString(length) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function hashString(string) {
  var hash = 0;

  if(typeof string === 'undefined'){
    return string;
  }

  if (string.length == 0) {
    return hash;
  }
  for (var i = 0; i < string.length; i++) {
    var char = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function sortObjectKeys(obj){
  if(obj == null || obj == undefined){
    return obj;
  }
  if(typeof obj != 'object'){
    return obj;
  }
  return Object.keys(obj).sort().reduce((acc,key)=>{
  if (Array.isArray(obj[key])){
    acc[key]=obj[key].map(sortObjectKeys);
  }
  else if (typeof obj[key] === 'object'){
    acc[key]=sortObjectKeys(obj[key]);
  }
  else{
    acc[key]=obj[key];
  }
  return acc;
  },{});
}

function transposeRow(row) {
  var cells = row.querySelectorAll('td');
  var colspanRow = row.closest('table').querySelector('.tb-colspan-row');
  var colspanIndex = 0;
  var colspanCells = [];

  if(row.closest('table').classList.contains('tb-transposed-table')) {
    return;
  }

  Array.from(colspanRow.querySelectorAll('th')).map(function(cell) {
    colspanCells[colspanIndex] = cell.innerText ? [cell.innerText, cell.dataset.originalColspan || '1'] : [cell.textContent, cell.dataset.originalColspan || '1'];
    colspanIndex += cell.dataset.originalColspan ? Number(cell.dataset.originalColspan) : 1;
  });

  var headersRow = row.closest('table').querySelector('thead').lastElementChild;
  var headerCells = Array.from(headersRow.querySelectorAll('th')).map(function(th) {
    return th.innerText || th.textContent;
  });

  var transposeTable = document.getElementById('transposeTable');
  transposeTable.innerHTML = '';

  cells.forEach(function(cell, index) {
    var newRow = transposeTable.insertRow();
    if (typeof colspanCells[index] !== "undefined") {
      var colspanCell = newRow.insertCell();
      colspanCell.innerHTML = colspanCells[index][0] ? `<strong>${colspanCells[index][0]}</strong>` : '';
      colspanCell.rowSpan = colspanCells[index][1];
    }
    var nameCell = newRow.insertCell();
    nameCell.innerHTML = headerCells[index] ? `<strong>${headerCells[index]}</strong>` : '';
    var valueCell = newRow.insertCell();
    var clonedCell = cell.cloneNode(true);
    clonedCell.classList.remove('dbreports-nowrap');
    clonedCell.classList.remove('hide');
    valueCell.replaceWith(clonedCell);
  });

  $('#transposeModal').modal('show');
}

function getUrlParameters(url, exclude = []) {
  const params = {};

  const urlObj = new URL(url);

  urlObj.searchParams.forEach((value, key) => {
    if (!exclude.includes(key)) {
      params[key] = value;
    }
  });

  return params;
}

function applyColspanStates() {
	let currentUser = document.getElementById('dark-theme-username-info');

	if(currentUser == null) {
		return;
	}

	currentUser = currentUser.innerText.trim();
  let rep_id = $('[name="sid"]').val();

	let colspanStates = window.localStorage.getItem('colspan-states');

	if (colspanStates !== null) {
		colspanStates = JSON.parse(colspanStates);

		if (colspanStates[currentUser] && colspanStates[currentUser][rep_id]) {
			let savedState = colspanStates[currentUser][rep_id];

			$('.tb-colspan-controls').not('thead.table-header.cloned .tb-colspan-controls').each(function(index) {
				if (savedState[index] === 'expanded') {
					$(this).click();
				}
			});
		}
	}
}


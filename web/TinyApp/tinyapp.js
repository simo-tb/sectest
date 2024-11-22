const EMBED_IFRAME_ID = 'embed-iframe';
const ENABLE_DARKMODE_COMMAND = 'enable_darkmode';
const DISABLE_DARKMODE_COMMAND = 'disable_darkmode';
const RELOAD_THEME_COMMAND = 'reload_theme';

window.onmessage = event => {
    if (event.data === ENABLE_DARKMODE_COMMAND) {
        enableDarkmode();
    }
    else if (event.data === DISABLE_DARKMODE_COMMAND) {
        disableDarkmode();
    }
    else if (event.data === RELOAD_THEME_COMMAND) {
        loadIframeTheme(EMBED_IFRAME_ID);
    }
}

window.TB = window.TB || {};

window.addEventListener('tinyapp_loaded', (event) => {
    // Dark Mode
    if ($(`#${EMBED_IFRAME_ID}`).length) {
        $(`#${EMBED_IFRAME_ID}`).on('load', () => {
            loadIframeTheme(EMBED_IFRAME_ID);
        });
    }

    if (checkForDarkmode())
    {   
        enableDarkmode();
    }

	$('.tb-submenu').on("click", function() {
		if(localStorage.getItem("hideSearch") == "clicked"){
			$('#sidebar-menu').height('fit-content');

			if($(this).hasClass('expanded')) {
				$(this).removeClass('expanded');
				return;
			}

			let sidebarHeight = $('#sidebar-menu').height();
			let submenuHeight = $(this).find('ul').height();

			let submenuOffsetHeight = this.offsetTop;

			let submenuDepth = submenuOffsetHeight + submenuHeight;

			if(submenuDepth > sidebarHeight)
			{
				$('#sidebar-menu').height(submenuDepth);
				$(this).addClass('expanded');
			}
		}
	});

	$('#scrollButton').on( "click", function() {
       scrollToTop();
    });

   $(window).scroll(window.TB.debounce(function() {
        if (typeof $('.tb-scroll-button-div').position() == 'undefined'
          || $('footer').offset() == 'undefined'
          || $('.tb-scroll-button-div').offset() == 'undefined') {
            return;
        }

        var footertotop = ($('.tb-scroll-button-div').position().top);
        var scrolltop = $(document).scrollTop() + window.innerHeight;
        var difference = scrolltop - footertotop;

        //console.log("difference", "footertotop",footertotop,"scrolltop", scrolltop);

        if (scrolltop > footertotop) {
            $('#scrollButton').css({'bottom' : difference});
        }else{
            $('#scrollButton').css({'bottom' : 10});
        };
        if ($(this).scrollTop() > 200) {
            $('#scrollButton').fadeIn(200);
        } else {
            $('#scrollButton').fadeOut(200);
        }

        /* This bugs the scroll to top button in DBReports
        if($(window).scrollTop() + $(window).height() > $(document).height() - 200 && $('footer')[0] != null && $('footer').offset().top - $('.tb-scroll-button-div').offset().top <= 100 )
        {
            $('.tb-scroll-button-div').css({'min-height': 2 * $('footer').height() });
        }
        else if($('footer')[0] != null && $('footer').offset().top - $('.tb-scroll-button-div').offset().top <= 200 + 2 * $('footer').height())
        {
            let min_height = (200 + 2 * $('footer').height() ) - ($('footer').offset().top - $('.tb-scroll-button-div').offset().top);
            min_height += 'px';
            $('.tb-scroll-button-div').css({'min-height': min_height });
        }
        else
        {
            $('.tb-scroll-button-div').css({'min-height': '0' });
        }
        */

    },16,false));

    function scrollToTop() {
        var rootElement = document.documentElement;
        rootElement.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    window.scrollToTop = scrollToTop; 

    if (TB.CONFIG.HAS_WINDOW && window.$) {
      $(document).on('click', '#alert-show-details', function() {
        $(this).hide();
        $(this).siblings('br').hide();

        $('#alert-details').css('display', 'block');
      });
    }

  var TB_CORE_MODAL_IFRAME_ID = 0;
  // TB.createModalWithJF2 maybe? That will fetch the API?
  TB.createModalWithIFrame = function(options) {
    if ( ! TB.CONFIG.HAS_WINDOW ) {
      return;
    }

    TB.ASSERT(_.isPlainObject(options), options);
    TB.ASSERT(options.src, options);
    TB.ASSERT(options.title, options);

    TB_CORE_MODAL_IFRAME_ID += 1;

    // show modal
    var $modal = $(`
         <div class="modal" tabindex="-1" role="dialog">
           <div class="modal-dialog" role="document" style="width: 95%; height: ${window.innerHeight - 50}px">
                 <div class="modal-content">
                   <div class="modal-header">
                     <h5 class="modal-title">${ options.title }</h5>
                         <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                           <span aria-hidden="true">&times;</span>
                         </button>
                       </div>
                       <div class="modal-body">
                         <iframe src="${ options.src }" height = "${window.innerHeight - 250}px" width = "100%;">
              </iframe>
                       </div>
                       <div class="modal-footer">
                         <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                       </div>
                 </div>
               </div>
         </div>
    `);

    $modal.modal('show');
    $modal.on('shown.bs.modal', function () {
    });

    // populate with iframe with link <options.url>
  }

  /*
  $('.tb-report-description-icon').on('click', function () {
    $('.tb-report-description').toggleClass('hide');
  });
  */
});

function fixIFrameHeight() {
    $(`#${EMBED_IFRAME_ID}`).height(window.innerHeight - 150);
}

function loadIframeTheme(id) {
    ASSERT(id != null);
    
    let command;

    if (checkForDarkmode()) {
        command = ENABLE_DARKMODE_COMMAND;
    }
    else {
        command = DISABLE_DARKMODE_COMMAND;
    }

    $(`#${id}`)[0].contentWindow.postMessage(command, '*');
   
}

function checkForDarkmode() {
	try {
		if (document.getElementById('dark-theme-username-info') != null) {
			let currentUser = document.getElementById('dark-theme-username-info').innerText;
			currentUser = currentUser.trim();
		
			let theme = window.localStorage.getItem('tb-theme');
			if (theme !== null) {
				theme = JSON.parse(theme);
				let userPreference = theme[currentUser];
				if (userPreference !== null && userPreference === "true") {
                    return true;
				}
			}
		}

        return false;
	}
	catch (err) {
		console.error(err);
        return false;
	}

}

function enableDarkmode() {
	document.body.classList.add('tinyapp-dark');
}

function disableDarkmode() {
    if (document.body.classList.contains('tinyapp-dark')) {
        document.body.classList.remove('tinyapp-dark');
    }
}

function loadTestInfo(text) {
    let infoModal = $('#tb-test-info-container')[0];
    infoModal.innerHTML = text;
}

var TinyKorSingleton = (function(){
    var instance = null;

    return {
        getInstance: function() {
            if (!instance) {
                console.log("THIS_IS:", this);
                instance = new TinyKor();
            }

            return instance;
        }
    }
})();

function TinyKor() {
    var self = this;
    var clickOnce = true;
    // TODO this should group errors by stack, otherwise it will become crazy, when the same error happens again and again
    //TB.CONFIG = TB.CONFIG || {};
    console.log("TBBB ", TB);
    //console.log("TBBB2", TB2);
    //TB = TB2;
    TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI = TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI || this.errorHandlerUI;

    TB.CONFIG.MIN_MENU_SEARCH_TERM_LENGTH = 2;

    this.localPreferencesKey = 'TB.TINYKOR.USER_PREFERENCES';
    
    self.initLegacy();
    self.alertConsume();

    var $FIXED_SIDEBAR = jQuery('.tb-tk-fixed-sidebar');
    var $menu = jQuery('.nav.side-menu');
    var $sidebarMenu = jQuery('.main_menu_side.main_menu');
    var $searchInput = jQuery('#tb-tk-search-menu-input');
    var $sidebarHeader = jQuery('.tb-tk-sidebar-header');
    var $sidebarFooter = jQuery('.sidebar-footer');

    this.userPreferences = this.getUserPreferences();
    this.initUserPreferences();

    // fixed sidebar
    if (jQuery.fn.mCustomScrollbar && $FIXED_SIDEBAR.length) {
 		setTimeout(() => {
        	self.sidebarInit($FIXED_SIDEBAR, $sidebarHeader, $sidebarFooter);
        }, "50");
    }

    // Result report table panel has this class on one of the settings menu items
    jQuery(document).on('click', '.tb-tk-dbr-toggle-smart-table', function(e) {
        var $panel = jQuery(this).closest('.x_panel');

        self.dbrPanelToggleDatatables($panel);
    });

    jQuery('.tb-tk-toggle-fullscreen').click( function() {
        self.toggleFullscreen();
    });

    jQuery(document).on('click', '.tb-tk-toggle-menus', function() {
        self.toggleMenus();
    });

    jQuery($sidebarMenu).find('.nav.child_menu:has(*)').prevAll('a').click(function() {
        self.hideMenus($FIXED_SIDEBAR, $sidebarHeader, $sidebarMenu, $searchInput, this);
    });

    $searchInput.on('keyup keypress', TB.debounce(function() {
        self.filterMenu($menu, this.value);
    }, 50, false));

    var hideSearch = localStorage.getItem("hideSearch");

    if(hideSearch != null && localStorage.getItem("hideSearch") == "clicked")
    {
        $('#menu_toggle').click();
        self.hideSearch();
    }

    jQuery('#menu_toggle').click(function() {
        self.hideSearch();

        if(localStorage.getItem("hideSearch") != "clicked")
        {
            localStorage.setItem("hideSearch", "clicked");
        }
        else
        {
			$('#sidebar-menu').height('fit-content');
            localStorage.setItem("hideSearch", "notclicked");
        }
    });

    setTimeout(async function() {
        /**
        * Generates random color, supports seed
        * @param  {String} seed seed to generate color from, anytime you provide the same seed, you get the same color
        * @return {String}      HEX color
        */
        TB.generateColor = function(seed) {
            seed = seed !== undefined ? seed : Math.random();
            seed = seed.toString();

            var hash = 0;

            for (var i = 0; i < seed.length; i++) {
                hash = seed.charCodeAt(i) + ((hash << 5) - hash);
            }

            var color = Math.floor(Math.abs(Math.sin(seed) * 16777215) % 16777215);

            color = color.toString(16);
            // pad any colors shorter than 6 characters with leading 0s
            while (color.length < 6) {
                color = '0' + color;
            }

            return color;
        };

        await TB.loadJSFile('tbchart');
        TB.ChartJs.autodetect();
    }, 1000)

    //this.dbrInit();
}
/*
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
*/

function detachAllEventListeners() {
  for (const [key, value] of Object.entries(window.TB.MENUTYPE)) {
    TB.detachEventListenersForMenuType(value);
  } 
} 

function buildAjaxRequestsForSideMenus() {
  let sideMenuAnchors = document.querySelectorAll('#sidebar-menu a.child_menu_item_name');
  
    for (let i = 0; i < sideMenuAnchors.length; i++) { 
        sideMenuAnchors[i].addEventListener('click', async evt => {
            evt.preventDefault();

            let hrefQueryParams = (evt.currentTarget.href).split('?')[1];
            let urlParams = TB.parseQueryParams(hrefQueryParams);
            let view = urlParams.custom_report_view || urlParams.p0 || urlParams.view || window.TB.defaultMenuView;
            let menuType = window.TB.allMenus[view];

            if (menuType != TB.MENUTYPE.DBR) {
              window.location.href = evt.currentTarget.href;
              return;
            }

            history.pushState({}, null, evt.currentTarget.href);
				
            detachAllEventListeners(); 

						// Remove highlighting from old active menu
						evt.currentTarget.parentNode.classList.add("tb-curr-menu");
						$("li.current-page").removeClass("current-page");
						$("ul.side-menu li.tb-submenu li.active:not(.tb-curr-menu)").removeClass("active");
						evt.currentTarget.parentNode.classList.remove("tb-curr-menu");

						await sendMenuAjaxAndReplaceContent(view, evt.currentTarget.href)
							.catch(err => {
                console.error(err);
							});
        });
    }
}

async function sendMenuAjaxAndReplaceContent(view, url) {
  ASSERT(view != null, "View is missing!");
  ASSERT(url != null, "URL for ajax request is missing!");

  let overlayTimeout = setTimeout(() => {
  let overlay = document.getElementById("tinyapp-overlay");
    overlay.style.display = '';
  }, 300);

  let reqSettings = {
    httpMethod: 'GET',
    url: url,
    data: {
      show_body_only: true,
    },
    timeout: 0
  };

  let req = new TB.Request(reqSettings);

  await req.request()  
  .then( data => {
    if (_.get(req, "requestObj.responseURL") != null && _.get(req, "requestObj.responseURL").includes('login.html')) {
      window.location.href = _.get(req, "requestObj.responseURL");
    }

    let domParser = new DOMParser();
    let doc = domParser.parseFromString(data.data, 'text/html');

    let respVersionForJS = getJSVersionFromHTMLResponse(doc);

    if (respVersionForJS != null && respVersionForJS != window.VERSION_FOR_JS) {
      let queryParamPrefix = window.location.search ? "&" : "?";

      window.location.href += `${queryParamPrefix}is_reload_after_update=1`;
      return;
    }

    let contentDiv = doc.querySelector('div.right_col');
    let errorElement = doc.querySelectorAll('div.right_col #error-msg>div:not(.alert-success)');

    if (contentDiv == null) {
      document.body.innerHTML = data.data;
    }
    else {
      document.querySelector('div.right_col').innerHTML = contentDiv.innerHTML;

      window.TB.attachEventListenersForView(view);

      if (errorElement != null && errorElement.length > 0) {
      }
      else {
        window.dispatchEvent(new Event('tb_libs_loaded'));
      } 
    }
  })
  .catch( err => {
    if (_.get(req, "requestObj.responseURL") != null && _.get(req, "requestObj.responseURL").includes('login.html')) {
      window.location.href = _.get(req, "requestObj.responseURL");
    }

    let response = _.get(req, "requestObj.response");

    let domParser = new DOMParser();
    let doc = domParser.parseFromString(response, 'text/html');
  
    let contentDiv = doc.querySelector('div.right_col');
    let errorElement = doc.querySelectorAll('div.right_col #error-msg>div:not(.alert-success)');

    if (contentDiv == null) {
      document.body.innerHTML = response;
    }

    throw err; 
  })
  .finally( () => {
    clearTimeout(overlayTimeout);
    $("#tinyapp-overlay").hide();
  });
}

function getJSVersionFromHTMLResponse(doc) {
  const scriptTags = doc.querySelectorAll('script');
  let versionForJS = null;

  scriptTags.forEach((script) => {
    const scriptContent = script.textContent;
    
    const match = scriptContent.match(/window\.VERSION_FOR_JS\s*=\s*['"](.+?)['"]/);
    
    if (match && match[1]) {
      versionForJS = match[1];
    }
  });

  let saveXerrorsErrorHandlerUiHook = window.TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI;

  try {
    window.TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI = function (err) {
      console.error(err);
    };

    ASSERT(versionForJS != null, "versionForJS is not given from the server");
  } catch (err) {
    console.error(err);
  } finally {
    window.TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI = saveXerrorsErrorHandlerUiHook;
  };

  return versionForJS;
}  

function checkIfFirstLoadedMenuIsDBR() {
  let menuType = getCurrentMenuType();
    
  if (menuType === TB.MENUTYPE.DBR) {
    if ($('div.right_col #error-msg>div:not(.alert-success)').children().length > 0 && ! window.TB.HAS_ERROR_BEFORE_AJAX) {
      window.TB.HAS_ERROR_BEFORE_AJAX = true;
      return;
    }
  }
}

function checkForReloadAfterUpdate() {
  let urlParams = TB.parseQueryParams();

  if (urlParams.is_reload_after_update != null) {
    TB.createNotification("System was successfully updated.", "warning");
    delete urlParams["is_reload_after_update"];

    history.replaceState(null, "", '?' + TB.toQueryString(urlParams));
  }
}

window.addEventListener('tinyapp_loaded', (event) => {
//    if (window.TB != null && window.TB.tinyKor != null) {
//        let deepcopy = JSON.parse(JSON.stringify(window.TB.tinyKor));
//        console.log("TBBB7", deepcopy);
//    }

  window.TB = window.TB || {};

  checkForReloadAfterUpdate();

  checkForChartRendering();

  buildAjaxRequestsForSideMenus();

  let urlParams = TB.parseQueryParams();

  let view = urlParams.custom_report_view || urlParams.p0 || urlParams.view || window.TB.defaultMenuView;

  try {
    TB.attachEventListenersForView(view);
  } catch (err) {
    console.error(err);
  }

  window.dispatchEvent(new Event('tb_libs_loaded'));

/*  window.TB.TinyKor = (function TinyKorSingleton() {
    if (window.TB && window.TB.tinyKor && window.TB.tinyKor.created) {
        return window.TB.TinyKor;
    }

    var instance = null;

    return function() {
      instance = instance ? instance : new TinyKor();
      return instance;
    };
  })();*/

    //Selectize for test modules
//    let modulesTypes = $('#module_type')[0];
    $('#module_type').selectize({
        plugins: ['remove_button'],
    }); 
 
    if ($('#test_user')[0] != null) {
        $('#test_user').selectize({
            create: true
        });
    }


  //Toggle Dark Mode on Body
  function toggleDarkMode() {
	document.body.classList.toggle('tinyapp-dark');
	let theme = document.body.classList.contains('tinyapp-dark') ? "true" : "false";

	console.log("CHECK_THEME:", theme);

	let changeThemeEvent = new Event('change_theme');
	window.dispatchEvent(changeThemeEvent);

	
	let themeJSON = window.localStorage.getItem('tb-theme');
	let currentUser = document.getElementById('dark-theme-username-info').innerText;
	currentUser = currentUser.trim();
	
	if (themeJSON !== null) {
		themeJSON = JSON.parse(themeJSON);
		themeJSON[currentUser] = theme;
	}
	else {
		themeJSON = {};
		themeJSON[currentUser] = theme;
	}

	window.localStorage.setItem('tb-theme', JSON.stringify(themeJSON));

    if ($(`#${EMBED_IFRAME_ID}`)[0] != null) {
        loadIframeTheme(EMBED_IFRAME_ID);
    }
  }

  window.TB.toggleDarkMode = toggleDarkMode;

 

  var p = {};

  TinyKor.prototype = p;

  p.initLegacy = function() {
    // TODO move to DBF
    // manol's init
    // InitDynBuffers();
    initapp();
    initDynSelectObjs();
    callOnLoad();
    // /TODO move to DBF
  };

  p.alertConsume = function() {
    if (this._alert) return;

    this._alert = window.alert;

    window.alert = function(message) {
      TB.createNotification('Alert', message, 'warning');
    };
  }

  p.alertRelease = function() {
    if (!this._alert) return;
    window.alert = this._alert;
    this._alert = null;
  }

  //dbrrrr
  //dbrrrr

  p.toggleFullscreen = function() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullScreen) {
        document.documentElement.webkitRequestFullscreen();
      } else {
        ASSERT_USER(_.isFunction(document.requestFullscreen), { code: '', msg: 'Unable to toggle fullscreen, browser not supported.', suggestUpgrade: true });
      }
    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else {
        ASSERT_USER(_.isFunction(document.exitFullScreen), { code: '', msg: 'Unable to toggle fullscreen, browser not supported.', suggestUpgrade: true });
      }
    }
  };

  p.toggleMenus = function() {
    jQuery('.main_menu').toggleClass('expanded');
  };

  p.getUserPreferences = function() {
    if(!window.localStorage) {
      this.hasLocalStorageSupport = false;
      return {};
    }

    this.hasLocalStorageSupport = true;

    var prefs = localStorage.getItem(this.localPreferencesKey);

    this.userPreferences = prefs ? JSON.parse(prefs) : {};

    console.log(this.userPreferences)
  };

  p.initUserPreferences = function() {
    this.updateMenuType();
  };

  p.updateMenuType = function() {
    console.log(this.userPreferences)
    // this.userPreferences.collapsedMenu = $(document.body).is('.nav-sm');

  };

  p.syncUserPreferences = function() {
    if(!window.localStorage) {
      return;
    }

    var prefs = JSON.stringify(this.userPreferences);

    // localStorage.setItem(this.localPreferencesKey, prefs);
  };

  p.sidebarInit = function($sidebar, $sidebarHeader, $sidebarFooter) {
    var $currPageMenuItem = $sidebar.find('.side-menu > .current-page');
    var $currPageChildItem = $sidebar.find('.child_menu > .current-page');
    var sidebarHeaderHeight = $sidebarHeader.outerHeight();
    var sidebarFooterHeight = $sidebarFooter.outerHeight();
    var currPageMenuOffset = ($currPageMenuItem.length) ? $currPageMenuItem.offset().top - sidebarHeaderHeight : 0;
    var currPageChildOffset = ($currPageChildItem.length) ? $currPageChildItem.offset().top - sidebarHeaderHeight : 0;
    var sidebarHeight = $sidebar.height() - (sidebarFooterHeight + sidebarHeaderHeight);
    var sidebarScroll = (sidebarHeight - currPageChildOffset > 0) ? currPageMenuOffset : currPageChildOffset;

    //sidebarScroll = $currPageChildItem.offset().top;

    sidebarScroll = sidebarScroll || 0;
    var data = {
      autoHideScrollbar: true,
      theme: 'minimal',
      scrollInertia: 50,
      mouseWheel: {
        preventDefault: true,
        scrollAmount: 125,
      },
      scrollbarPosition: 'outside',
      setTop: sidebarScroll + 'px',

    };

    $sidebar.mCustomScrollbar(data);
  };

  p.errorHandlerUI = function(err) {
    if (err.name === TB.CONFIG.ERR_USER) {
      TB.createNotification(err.msg + ' [' + err.code + ']', 'Operation Unsuccessfull!', 'warning');
    } else {
      TB.createNotification('Operation Failed', err.msg + ' [' + err.code + ']', 'error');
    }

  };

  p.notify = function(notifType, notifTitle, notifMsg) {
    notification = TB.createNotification(notifTitle, notifMsg, notifType || 'error');

    this.lastNotification = notification;
    return notification;
  };

  p.filterMenu = function($menu, term, opts) {
      term = term.toLowerCase();
      opts = _.defaults({
        hideUnmatchedParents: true,
      }, opts);

      var $parentMenus = $menu.children('li');
      var $notActiveChildMenus = $menu.find('li:not(.active) .nav.child_menu');
      var $childMenus = $menu.find('.nav.child_menu');

      if (term.length < TB.CONFIG.MIN_MENU_SEARCH_TERM_LENGTH) {
        $notActiveChildMenus.removeClass('show hide');
        $childMenus.children('li').removeClass('show hide');
        $parentMenus.removeClass('show hide');
        return;
      }

      $parentMenus.each(function (index) {
        var $this = jQuery(this);
        var $childMenu = jQuery(this).find('.nav.child_menu');
        var parentMenuTitle = $this.children('a').text().toLowerCase().trim();
        var isTermFoundInParent = (parentMenuTitle.indexOf(term) > -1);

        if (isTermFoundInParent) {
          $this.removeClass('hide');
          $childMenu.children('li').removeClass('hide');
          $childMenu.addClass('show');
          return;
        }

        var shouldShowChildMenu = false;

        $childMenu.children('li')
            .each(function (index) {
              var $thisChildMenu = jQuery(this);
              var menuContent = $thisChildMenu.text().toLowerCase().trim();
              var isTermFound = (menuContent.indexOf(term) > -1);

              $thisChildMenu.toggleClass('hide', !isTermFound);

              shouldShowChildMenu = shouldShowChildMenu || isTermFound;
            });

        if(shouldShowChildMenu) {
          $childMenu.addClass('show');
        }

        if(opts.hideUnmatchedParents) {
          $this.toggleClass('hide', !shouldShowChildMenu);
        }
      });
  };

p.hideMenus = function($sidebar, $sidebarHeader, $sidebarMenu, $searchInput, anchorEl) {
    var $childMenus = jQuery('.nav.child_menu');
    var $anchorParent = jQuery(anchorEl).parent();
    var $anchorUl = $anchorParent.children('ul');

    $childMenus.removeClass('show');
    $childMenus.finish();

    //$sidebarMenu.addClass('expanded');
    //console.log("has expanded", $sidebarMenu.hasClass('expanded'), $searchInput.val().length < TB.CONFIG.MIN_MENU_SEARCH_TERM_LENGTH);
    if ($sidebarMenu.hasClass('expanded')
      && $searchInput.val().length < TB.CONFIG.MIN_MENU_SEARCH_TERM_LENGTH) {
      var sidebarHeaderHeight = $sidebarHeader.outerHeight();

      $sidebarMenu.removeClass('expanded');

      $childMenus.not($anchorUl).addClass('no_expand').slideUp(0, function() {
        jQuery(this).removeClass('no_expand');
      });

      $anchorUl.addClass('show');

      var existsFixedSidebar = $sidebar.length;

      //alert(anchorEl); 

      //if (existsFixedSidebar && !jQuery(anchorEl).is(':mcsInSight')) {
      if (existsFixedSidebar) {
        var scrollbarOffset = $sidebar.offset().top;
        var anchorOffset = ($anchorParent.length) ? $anchorParent.offset().top - scrollbarOffset - sidebarHeaderHeight: 0;

        $sidebar.mCustomScrollbar('scrollTo', "-=" + anchorOffset, { scrollInertia: 0 });
      }
    }
  }

  p.hideSearch = function() {
    // jQuery('.search_input_wrapper').toggleClass('hide');
    jQuery('.search_input_wrapper').toggle();
    jQuery('.left_col.scroll-view').toggleClass('small_top_margin');
  }

  p.logout = function(authapi_apikey) {
    TB.HTTPLogoutNew(authapi_apikey);
  }

  jQuery(function() {
    TB.tinyKor = TinyKorSingleton.getInstance();
  });
});

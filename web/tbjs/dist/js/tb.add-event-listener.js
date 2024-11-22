window.TB = window.TB || {}; 

window.TB.MENUTYPE = {
  JF: 'dbforms',
  CRUD: 'crud',
  DBR: 'dbreports',
  CUSTOM: 'custom',
}


let currentScriptSrc = null;

function setCurrentScriptSrc (scriptSrc) {
  currentScriptSrc = scriptSrc;
}

window.TB.addEventListener = function( params ) {
  ASSERT(params.evt != null, "Missing evt property in window.TB.addEventListener method", params);
  ASSERT(params.cb != null, "Missing cb property in window.TB.addEventListener method", params);

  if (window.TB.isTinyApp) {

    ASSERT(params.eventType != null, "You must provide event_type property with one of the following values: 'jf', 'jf_custom', 'dbr', 'dbr_custom', 'ta'");
        
    console.log("adding event listener:", params.evt);

    let menuType = params.eventType;

    if (currentScriptSrc == null) {
        window.TB.globalEventListeners = window.TB.globalEventListeners || {};

        window.TB.globalEventListeners[menuType] = window.TB.globalEventListeners[menuType] || [];

        window.TB.globalEventListeners[menuType].push({
          ctx: params.ctx,
          selector: params.selector,
          evt: params.evt,
          cb: params.cb,
        });
    }
    else {
      window.TB.scriptSrcToHandlers = window.TB.scriptSrcToHandlers || {};

      window.TB.scriptSrcToHandlers[currentScriptSrc] = window.TB.scriptSrcToHandlers[currentScriptSrc] || [];

      window.TB.scriptSrcToHandlers[currentScriptSrc].push({
          ctx: params.ctx,
          selector: params.selector,
          evt: params.evt,
          cb: params.cb,
      });
    }
  }
  else {

    window.addEventListener(params.evt, params.cb);

  }

}             
    
window.TB.attachEventListenersForView = function (view) {
  ASSERT(view != null, "Missing view");

  if (window.TB.brokenViews[view]) {
    let viewErr = window.TB.brokenViews[view];
    ASSERT(0, viewErr.message, viewErr);
  }

  let menuType = window.TB.allMenus[view];

  ASSERT(menuType != null, "This view doesn't have menu type!", window.TB.allMenus);

  window.globalEventListeners = window.TB.globalEventListeners || {};
  window.TB.globalEventListeners[menuType] = window.TB.globalEventListeners[menuType] || [];

  window.TB.globalEventListeners[menuType].forEach( eventData => {
    $(eventData.ctx).on(eventData.evt, eventData.selector, eventData.cb);
    console.log("ATTACH_EVENT_LISTENER_TO:", eventData.ctx);
  });

  window.TB.customEventListeners = window.TB.customEventListeners || {};
  window.TB.customEventListeners[view] = window.TB.customEventListeners[view] || [];

  window.TB.customEventListeners[view].forEach( eventData => {
    console.log("VIEW_IS:", view);
    $(eventData.ctx).on(eventData.evt, eventData.selector, eventData.cb);
    console.log("ATTACH_CUSTOM_EVENT_LISTENER_TO:", eventData.ctx);
  }); 
} 

window.TB.detachCustomEventListenersForView = function (view) {
  ASSERT(view != null, "Missing view");

  window.TB.customEventListeners = window.TB.customEventListeners || {};
  window.TB.customEventListeners[view] = window.TB.customEventListeners[view] || [];

  window.TB.customEventListeners[view].forEach( eventData => {
    console.log(`DETACHING ${eventData.evt} event FROM ${eventData.ctx}`);
    $(eventData.ctx).off(eventData.evt, eventData.selector, eventData.cb);
  });
}

window.TB.detachEventListenersForMenuType = function (menuType) {
  ASSERT(menuType != null, "Missing menu type");

  window.TB.globalEventListeners = window.TB.globalEventListeners || {};
  window.TB.globalEventListeners[menuType] = window.TB.globalEventListeners[menuType] || [];

  console.log("STARTING_DETACHING_ALL_MENUS_FROM_TYPE:", menuType);

  window.TB.globalEventListeners[menuType].forEach( eventData => {
    console.log(`DETACHING ${eventData.evt} event FROM ${eventData.ctx}`);
    $(eventData.ctx).off(eventData.evt, eventData.selector, eventData.cb);
  });
}


  var supportedMobile=/(ipad|ipod|iphone|android)/i;

  function EventEmitter() {
    this.listeners = []; // hash by type of function arrays
  }
  EventEmitter.prototype.addListener = function( eventType, functionPointer ) {
    if ( typeof functionPointer != "function" )
      return;
    if ( this.listeners[eventType] == undefined )
      this.listeners[eventType] = [];
    this.listeners[eventType].push(functionPointer);
  }
  EventEmitter.prototype.removeListener = function( eventType, functionPointer ) {
    if ( this.listeners[eventType] == undefined )
      return;
    for (var i=0; i<this.listeners[eventType].length; i++) {
      if ( this.listeners[eventType][i] === functionPointer ) {
        this.listeners[eventType].splice(i, 1);
        i = i-1;
      }
    }
  }
  EventEmitter.prototype.emit = function( event, data ) {
    if ( typeof( event ) == "string" ) {
      if ( this.listeners[event] == undefined )
        return;
      for (var i=0; i<this.listeners[event].length; i++)
        try {
          this.listeners[event][i]( data );
        } catch ( error ) { alert( error.message ) }
      return;
    }
    if ( event.type == undefined )
      return;
    if ( this.listeners[event.type] == undefined )
      return;
    for (var i=0; i<this.listeners[event.type].length; i++)
      try {
        this.listeners[event.type][i]( event );
      } catch ( error ) { alert( error.message ) }
  }



  UIManager.prototype = new EventEmitter;
  UIManager.constructor = UIManager;
  //  ui inits
  function UIManager()
  {
    this.keyboard = []; // keyboard state
    this.mouseButton = [false, false, false];
    this.mousePos = [0, 0];
    this.mousePrev = [0, 0];
    this.mouseDownPos = [0, 0];
    this.mouseLastClickTime = new Date();
  }
  UIManager.prototype.mouseUp = function(event) {
    this.mouseButton[event.button] = false;
    this.mousePos[0] = event.clientX;
    this.mousePos[1] = event.clientY;
    this.emit( event );
  }
  UIManager.prototype.mouseDown = function(event) {
    this.mouseButton[event.button] = true;
    this.mousePos[0] = event.clientX;
    this.mousePos[1] = event.clientY;
    this.mouseDownPos = this.mousePos.slice();
    this.emit( event );
    this.mouseLastClickTime = new Date();
  }
  UIManager.prototype.mouseMove = function(event) {
    this.mousePrev = this.mousePos.slice();
    this.mousePos[0] = event.clientX;
    this.mousePos[1] = event.clientY;
    this.emit( event );
  }
  UIManager.prototype.keyUp = function(event) {
    this.keyboard[event.which] = false;
    // deal with combinations of shift+alt keys
    if ( event.which==224 )
      this.keyboard[18] = false;
    this.emit( event );
  }
  UIManager.prototype.keyDown = function(event) {
    this.keyboard[event.which] = true;
    // deal with combinations of shift+alt keys
    if ( event.which==224 )
      this.keyboard[18] = true;
    this.emit( event );
  }
  UIManager.prototype.onResize = function(event)
  {
    this.emit( event );
  }
  UIManager.prototype.onLoad = function(event)
  {
    this.emit( event );
  }

  var ui = new UIManager();
  window.onkeydown=function(event){ui.keyDown(event);};
  window.onkeyup=function(event){ui.keyUp(event);};
  window.onmousedown=function(event){ui.mouseDown(event);};
  window.onmouseup=function(event){ui.mouseUp(event);};
  window.onmousemove=function(event){ui.mouseMove(event);};
  window.onresize=function(event){ui.onResize(event);};
  document.onload=function(event){ui.onLoad(event);};

  function loadScript(filename, key, callback)
  {
    // see if we've already got a script with corresponding key
    var allscripts=document.getElementsByTagName("script");
    var prevscript = 0;
    for (var i=allscripts.length; i>=0; i--)
    {
      if (allscripts[i]!=undefined && allscripts[i].getAttribute("key")==key )
      {
        prevscript = allscripts[i];
        break;
      }
    }
    var fileref=document.createElement('script')
    fileref.setAttribute("type","text/javascript");
    fileref.setAttribute("src", filename);
    fileref.setAttribute("key", key);
    if ( callback!=undefined )
      fileref.onload = callback;//setTimeout( callback, 10000 );
    var head = document.head;
    if ( head==undefined )  // this is for IE
    {
      head = document.getElementsByTagName('head')[0];
      head.appendChild(fileref);
    }
    else
    {
      if ( prevscript==0 )
        head.appendChild(fileref);
      else
        head.replaceChild(prevscript, fileref);
    }
  }

  // I have to raise the scope of the callback specified here, in order to invoke it on the event
  var ui_autoCompleteCallback = function(){};
  function ui_autoComplete( element, suggestions, callback, childFrameId )
  {
    // find a div to use as a hover, creating one if none is found
    var hoverdiv = document.getElementById('hover');
    if ( hoverdiv==undefined )
    {
      hoverdiv = document.createElement('div');
      hoverdiv.setAttribute('id', 'hover');
      hoverdiv.style.position = 'absolute';
      hoverdiv.style.backgroundColor = 'transparent';
      hoverdiv.style.color = '#ffffff';
      hoverdiv.style.opacity = '0.9';
      document.body.appendChild(hoverdiv);
    }
    // disable if null or empty
    if ( typeof(suggestions)=='undefined' || !suggestions.length )
    {
      hoverdiv.innerHTML = "";
      hoverdiv.style.display = 'none';
      return;
    }
    // bump callback scope
    if ( typeof(callback)=='function' )
      ui_autoCompleteCallback = function(){  callback(); };
    // find object position on the page
    var obj = element;
    var oTop = obj.clientHeight,
        oLeft = 0;
    do {
        oLeft += obj.offsetLeft;
        oTop += obj.offsetTop;
    } while (obj = obj.offsetParent);
    // apply extra frame offset
    var iframeAccessString = "";
    if ( typeof(childFrameId)=='string' )
    {
      var thisIFrame = document.getElementById(childFrameId);
      oLeft += parseInt(thisIFrame.offsetLeft);
      oTop += parseInt(thisIFrame.offsetTop);
      iframeAccessString = "document.getElementById('"+childFrameId+"').contentWindow."
    }
    // set the position
    hoverdiv.style.top  = (oTop+4) + 'px';
    hoverdiv.style.left = (oLeft) + 'px';
    // setup contents
    hoverdiv.style.display = 'block';
    hoverdiv.innerHTML = "";
    for ( var i=0; i<suggestions.length&&i<10; i++ )
    {
      hoverdiv.innerHTML += "<div style='background-color:#520205;margin-top:1px' onmouseover=\"this.style.backgroundColor='#000000';\" onmouseout=\"this.style.backgroundColor='#520205';\" onclick=\""+iframeAccessString+"document.getElementById('"+element.getAttribute('id')+"').value='"+suggestions[i].fill+"'; ui_autoCompleteCallback();  ui_autoComplete(); return false;\">"+suggestions[i].display+"</div>";
    }
    
  }

  var ui_notification_list = [];
  var ui_render_notification_timer;
  function ui_render_notification()
  {
    clearTimeout( ui_render_notification_timer );

    var notifydiv = document.getElementById('notification');
      notifydiv.innerHTML = "";
      for ( var i=0; i<ui_notification_list.length; i++ )
      {
        if ( ui_notification_list[i].opacity<=.1 )
        {
          ui_notification_list.splice( i, 1 );
          i-=1;
          continue;
        }
		ui_notification_list[i].opacity -= .1;
        notifydiv.innerHTML += "<div style='background-color:#520205;margin:2px;opacity:"+ui_notification_list[i].opacity+"'>"+ui_notification_list[i].text+"</div>";
      }

    ui_render_notification_timer = setTimeout( function(){ui_render_notification()}, 100 );
  }
  function ui_notification( type, text )
  {
    document.getElementById ("message_sound").play();
    // find a div to use as, creating one if none is found
    var notifydiv = document.getElementById('notification');
    if ( notifydiv==undefined )
    {
      notifydiv = document.createElement('div');
      notifydiv.setAttribute('id', 'notification');
      notifydiv.style.position = 'absolute';
      notifydiv.style.backgroundColor = 'transparent';
      notifydiv.style.color = '#ffffff';
      notifydiv.style.opacity = '0.9';
      notifydiv.style.bottom = '0px';
      notifydiv.style.right = '0px';
      document.body.appendChild(notifydiv);
    }
    ui_notification_list.unshift( {'type':type,'text':text,'opacity':4} );
    ui_render_notification(true);
  }


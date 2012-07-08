
  // IE hacks
/*  if ( !Array.prototype.indexOf )
  {
    Array.prototype.indexOf = function(obj)
    {
      for ( var i=0; i<this.length; i++ )
      {
        if ( this[i]===obj )
          return i;
      }
      return -1;
    }
  }*/

  var supportedMobile=/(ipad|ipod|iphone|android)/i;

  var ui = new UIManager();
  //  ui inits
  function UIManager()
  {
    this.modulesRegistered = [];
    this.keyboard = [];
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
    for ( var i=0; i<this.modulesRegistered.length; i++ )
      if ( this.modulesRegistered[i]!=undefined && typeof(this.modulesRegistered[i].onMouseUp) == 'function' )
        try {
        this.modulesRegistered[i].onMouseUp(event);
        } catch(err) { alert("error on modulesRegistered[i]"+this.modulesRegistered[i]+"_onMouseUp(event)"+err.name+": "+err.message); }
  }

  UIManager.prototype.mouseDown = function(event) {
    this.mouseButton[event.button] = true;
    this.mousePos[0] = event.clientX;
    this.mousePos[1] = event.clientY;
    this.mouseDownPos = this.mousePos.slice();
    for ( var i=0; i<this.modulesRegistered.length; i++ )
      if ( this.modulesRegistered[i]!=undefined && typeof(this.modulesRegistered[i].onMouseUp) == 'function' )
        try {
        this.modulesRegistered[i].onMouseDown(event);
        } catch(err) { alert("error on modulesRegistered[i]"+this.modulesRegistered[i]+"_onMouseDown(event)"+err.name+": "+err.message); }
    this.mouseLastClickTime = new Date();
  }

  UIManager.prototype.mouseMove = function(event) {
    this.mousePrev = this.mousePos.slice();
    this.mousePos[0] = event.clientX;
    this.mousePos[1] = event.clientY;
    for ( var i=0; i<this.modulesRegistered.length; i++ )
      if ( this.modulesRegistered[i]!=undefined && typeof(this.modulesRegistered[i].onMouseMove) == 'function' )
//        try {
        this.modulesRegistered[i].onMouseMove(event);
//        } catch(err) { alert("error on modulesRegistered[i]"+this.modulesRegistered[i]+"_onMouseMove(event)"+err.name+": "+err.message); }
  }

  UIManager.prototype.keyUp = function(event) {
    this.keyboard[event.which] = false;
    // deal with combinations of shift+alt keys
    if ( event.which==224 )
      this.keyboard[18] = false;
    for ( var i=0; i<this.modulesRegistered.length; i++ )
      if ( this.modulesRegistered[i]!=undefined && typeof(this.modulesRegistered[i].onKeyUp) == 'function' )
        try {
        this.modulesRegistered[i].onKeyUp(event);
        } catch(err) { alert("error on modulesRegistered[i]"+this.modulesRegistered[i]+"_onKeyUp(event)"+err.name+": "+err.message); }
  }

  UIManager.prototype.keyDown = function(event) {
    this.keyboard[event.which] = true;
    // deal with combinations of shift+alt keys
    if ( event.which==224 )
      this.keyboard[18] = true;
    for ( var i=0; i<this.modulesRegistered.length; i++ )
      if ( this.modulesRegistered[i]!=undefined && typeof(this.modulesRegistered[i].onKeyDown) == 'function' )
        try {
        this.modulesRegistered[i].onKeyDown(event);
        } catch(err) { alert("error on modulesRegistered[i]"+this.modulesRegistered[i]+"_onKeyDown(event)"+err.name+": "+err.message); }
  }

  UIManager.prototype.onResize = function()
  {
    for ( var i=0; i<this.modulesRegistered.length; i++ )
      if ( this.modulesRegistered[i]!=undefined && typeof(this.modulesRegistered[i].onResize) == 'function' )
        this.modulesRegistered[i].onResize();
  }
 
  UIManager.prototype.onLoad = function()
  {
    this.windowResize();
  }

window.onkeydown=function(event){ui.keyDown(event);};
window.onkeyup=function(event){ui.keyUp(event);};
window.onmousedown=function(event){ui.mouseDown(event);};
window.onmouseup=function(event){ui.mouseUp(event);};
window.onmousemove=function(event){ui.mouseMove(event);};
window.onresize=function(){ui.onResize();};
document.onload=function(){ui.onLoad();};

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


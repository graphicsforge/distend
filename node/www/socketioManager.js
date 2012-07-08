    // remember to make a connection to the server this way
    // var socket = new io.Socket('<? echo $_SERVER['SERVER_NAME']?>', {port:3000, connectTimeout:3000});
var socketIOManager = new SocketIOManager();
function SocketIOManager()
{
  this.modulesRegistered = [];
}

SocketIOManager.prototype.onConnect = function()
{
  for ( var i=0; i<this.modulesRegistered.length; i++ )
    if ( this.modulesRegistered[i]!=undefined && typeof(this.modulesRegistered[i].onConnect) == 'function' )
      this.modulesRegistered[i].onConnect();
}

SocketIOManager.prototype.onMessage = function(line)
{
  var parts = line.split('\t');
  // send the message to handler function, checking if it exists first
  if ( parts[0].charAt(0)!="/" )
  {
    for ( var i=0; i<this.modulesRegistered.length; i++ )
      if ( this.modulesRegistered[i]!=undefined && typeof(this.modulesRegistered[i].onMessage) == 'function' )
        this.modulesRegistered[i].onMessage(line.replace(/\\/g,"\\\\").replace(/\"/g));
  }
  else if ( parts[1]!=undefined && parts[2]!=undefined )
  {
    for ( var i=0; i<this.modulesRegistered.length; i++ )
      if ( this.modulesRegistered[i]!=undefined && typeof(this.modulesRegistered[i].onMessage) == 'function' )
        this.modulesRegistered[i].onMessage(parts.slice(2).join('\t'), parts[0].slice(1), parts[1]);
  }
}

socket.on('connect', function(){
  document.body.style.backgroundColor=("#ffffff");
  socketIOManager.onConnect();
});

socket.on('connect_failed', function(){
  document.body.style.backgroundColor=("#100000");
  alert('The connection to the server failed.');
});

socket.on('message', function(message){
  var lines = message.split(/[\n\r]/g);
  for ( var i=0; i<lines.length; i++ )
    socketIOManager.onMessage( lines[i] );
});

socket.on('disconnect', function(client){ 
  document.body.style.backgroundColor=("#f00000");
  if ( supportedMobile.test(navigator.userAgent) )
    alert('The connection to the server lost!');
});

// send a message to the server
function sendMessage(message){
  var msg = message; 
  if(msg.length > 0)
    socket.emit('message', msg); // send the message
}


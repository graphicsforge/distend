
SocketIOManager.prototype = new EventEmitter;
SocketIOManager.constructor = SocketIOManager;
function SocketIOManager()
{
  this.listeners = []; // hash by type of function arrays
}
var socketIOManager = new SocketIOManager();

var socket = io.connect();
socket.on('connect', function(){
  document.body.style.backgroundColor=("#ffffff");
  socketIOManager.emit("connect");
});
socket.on('connect_failed', function(){
  document.body.style.backgroundColor=("#100000");
  alert('The connection to the server failed.');
  socketIOManager.emit("connect_failed");
});
socket.on('message', function(message){
  var lines = message.split(/[\n\r]/g);
  for ( var i=0; i<lines.length; i++ )
  {
    var parts = lines[i].split('\t');
    if ( parts[0].charAt(0)!="/" )
      socketIOManager.emit("message", line);
    else
      socketIOManager.emit(parts[0].substring(1), parts.slice(1));
  }
});
socket.on('disconnect', function(client){ 
  document.body.style.backgroundColor=("#f00000");
  socketIOManager.emit("disconnect");
  if ( supportedMobile.test(navigator.userAgent) )
    alert('The connection to the server lost!');
});

// send a message to the server
function sendMessage(message){
  var msg = message; 
  if(msg.length > 0)
    socket.emit('message', msg); // send the message
}


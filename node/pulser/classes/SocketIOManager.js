
SocketIOManager.prototype = new EventEmitter;
SocketIOManager.constructor = SocketIOManager;
function SocketIOManager()
{
  var self = this;
  this.listeners = []; // assoc array by type of function arrays
  this.socket = io.connect();
  this.socket.on('connect', function(){
    document.body.style.backgroundColor=("#000000");
    self.emit("connect");
  });
  this.socket.on('connect_failed', function(){
    document.body.style.backgroundColor=("#100000");
    alert('The connection to the server failed.');
    self.emit("connect_failed");
  });
  this.socket.on('message', function(message){
console.log('got message ['+message+']');
    var lines = message.split(/[\n\r]/g);
    for ( var i=0; i<lines.length; i++ )
    {
      if( !lines[i].length ) continue;
      var parts = lines[i].split(/[\t ]/g);
      if ( parts[0].charAt(0)!="/" )
        self.emit("message", lines[i]);
      else
        self.emit(parts[0].substring(1), parts.slice(1));
    }
  });
  this.socket.on('disconnect', function(client){ 
    document.body.style.backgroundColor=("#f00000");
    self.emit("disconnect");
    if ( supportedMobile.test(navigator.userAgent) )
      alert('The connection to the server lost!');
  });
}
// send a message to the server
SocketIOManager.prototype.sendMessage = function(message){
  var msg = message; 
  if(msg.length > 0)
    this.socket.emit('message', msg); // send the message
}
var socketIOManager = new SocketIOManager();



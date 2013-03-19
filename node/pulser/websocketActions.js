
var net = require('net');
var fs = require('fs');
var spawn = require ('child_process').spawn;
var io = require('socket.io'); // socket.io git://github.com/LearnBoost/socket.io.git
// socket.io-client git://github.com/LearnBoost/socket.io-client.git

var blenderScripts = require('./blenderScripts/blenderScripts');

var PATH = ".";
var chatserver;
var db;

function startServer(httpServer)
{
  console.log("launching web chat server");
  var msgwebSocket = io.listen(httpServer);
  msgwebSocket.set('log level', 1);

  // on a connection, do stuff
  msgwebSocket.sockets.on('connection', function(webClient)
  {
    // listen to msgServer
    var msgServerNotifier = new net.Socket();
    msgServerNotifier.connect(chatserver.getPort(), "localhost", function(){
      msgServerNotifier.write("/nick anon"+webClient.id+"\n/join webclient\n");
    });
    webClient.nick = "anon"+webClient.id;
    msgServerNotifier.setEncoding('ascii');
    msgServerNotifier.on("data", function(data) {
      webClient.emit('message', data);
    });
    msgServerNotifier.on("error", function(err) {
      console.log("msgServerNotifier "+err.code);
    });
    // handle webpage data requests
    var webClientRequestCallback = function(type, args) {
      if ( type=="nick" )
      {
        if ( args[0]==undefined || args[0]=='' )
          args[0] = webClient.nick;
        args[0] = args[0].replace(/[^a-zA-Z0-9-_+@\[\]]/g, '');
        msgServerNotifier.write("/nick "+args[0]+"\n");
        webClient.nick = args[0];
        webClient.emit('message', '/nick '+args[0]);
        // check to see if we have a model to load
        var filename = 'output/'+args[0]+'.json';
        fs.exists( PATH+'/'+filename, function(exists) {
          if ( exists )
            webClient.emit('message', '/updatemodel preview '+filename+"\n" );
        });
      }
      if ( type=="modifier" )
      {
        var operations = [];
        // start off with our load modifier
        blenderScripts.pushLoadSTLOperation(operations, webClient.nick, args[0]);
        operations.push( args.slice(1) );
        blenderScripts.pushExportOperations(operations, webClient.nick, args[0]);
var scriptWriter = fs.createWriteStream('debug.txt', {flags:'w'});
blenderScripts.streamScript( scriptWriter, operations );

        blenderScripts.apply(operations, webClient.nick, args[0]);
      }
      else if ( type=="combine" )
      {
        var operations = [];
        blenderScripts.pushLoadSTLOperation(operations, webClient.nick, parseInt(args[3])+1);
        blenderScripts.pushLoadSTLOperation(operations, webClient.nick, parseInt(args[4])+1);
        var operation = args.slice(2);
        if ( args[3]<args[4] )
        {
          operation[1] = "bpy.data.objects[0]";
          operation[2] = "bpy.data.objects[1]";
        } else {
          operation[1] = "bpy.data.objects[1]";
          operation[2] = "bpy.data.objects[0]";
        }
        operations.push( operation );
        blenderScripts.pushExportOperations(operations, webClient.nick, args[0]);
var scriptWriter = fs.createWriteStream('debug.txt', {flags:'w'});
blenderScripts.streamScript( scriptWriter, operations );
        blenderScripts.apply(operations, webClient.nick, args[0]);
      }
    }

    webClient.on('message', function(msg)
    {
console.log('msg '+msg);
      var lines = msg.split("\n");
      var delimited = lines[0].split("\t");
      if ( delimited.length<2 )
        delimited = lines[0].split(" ");
      if ( delimited[0][0]=="/" )
        webClientRequestCallback( delimited[0].slice(1), delimited.slice(1) );
      else
      {
        try {
            msgServerNotifier.write("/me "+lines[0]+'\n');
        } catch (error) {}
      }
      // deal with subsquent lines, eating an endline if needed
      if( lines.length>1 && lines[1].length>1 )
      {
        webClient.emit( "message", lines.slice(1).join("\n") );
      }
    });
    webClient.on('disconnect', function()
    {
      msgServerNotifier.end();
    });
  });

}

module.exports = {
  setBasePath: function( basePath ) {
    PATH = basePath;
    blenderScripts.setBasePath( PATH );
  },
  setChatServer: function( server ) {
    chatserver = server;
    blenderScripts.setChatServer( server );
  },
  setDatabase: function( database ) {
    db = database;
  },
  startServer: startServer
}

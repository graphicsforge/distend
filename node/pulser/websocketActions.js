
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
args[0] = "graphicsforge";
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
        var script = '';
        var envVars = new Object();
        // see which script to run
        if ( args[1]=="remesh" )
        {
          script = 'remesh.py';
          envVars.mode = args[2];
          envVars.octree = args[3];
        }
        else if ( args[1]=="lap_smooth" )
        {
          script = 'lap_smooth.py';
          envVars.factor = args[2];
        }
        else if ( args[1]=="simple_deform" )
        {
          script = 'simple_deform.py';
          envVars.mode = args[2];
          envVars.factor = args[3];
          envVars.pivotx = args[4];
          envVars.pivoty = args[5];
          envVars.pivotz = args[6];
        }
        else if ( args[1]=="decimate" )
        {
          script = 'decimate.py';
          envVars.verts = args[2];
        }
        else if ( args[1]=="wireframe" )
        {
          script = 'wireframe.py';
          envVars.thickness = args[2];
        }

        // apply our modifier
        blenderScripts.apply(script, {
          chatServer: chatserver,
          webPath:PATH,
          nick:webClient.nick,
          slot:args[0],
        }, envVars );

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
  },
  setChatServer: function( server ) {
    chatserver = server;
  },
  setDatabase: function( database ) {
    db = database;
  },
  startServer: startServer
}

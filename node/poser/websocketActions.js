
var net = require('net');
var io = require('socket.io'); // socket.io git://github.com/LearnBoost/socket.io.git
// socket.io-client git://github.com/LearnBoost/socket.io-client.git

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
    msgServerNotifier.connect(chatserver.getPort(), "localhost", function(){msgServerNotifier.write("/nick anon"+webClient.id+"\n/join webclient\n")});
    msgServerNotifier.setEncoding('ascii');
    msgServerNotifier.on("data", function(data) {
      webClient.emit('message', data);
    });
    msgServerNotifier.on("error", function(err) {
      console.log("msgServerNotifier "+err.code);
    });
    // handle webpage data requests
    var webClientRequestCallback = function(type, args) {
      if ( type=="statusBox" )
      {
        if ( args[0]=="join" )
          msgServerNotifier.write("/join statusBox\n");
        var response=chatserver.getClientAliases();
        webClient.emit('message', "/"+type+"\tresponse\t"+response);
      }
      else if ( type=="login" )
      {
        if ( args[0]=="FB" )
        {
          db.FBSignIn("FB_"+args[1], args[2], args[3], args[4], function(err, response, result){
            if ( err )
              webClient.emit('message', "/login\tfail");
            else
            {
              webClient.authenticatedUsername = args[1];
              msgServerNotifier.write("/nick "+webClient.authenticatedUsername.replace(/ /g,"_")+"\n");
              webClient.emit('message', "/login\t{\"username\":\""+webClient.authenticatedUsername+"\",\"img\":\""+args[2]+"\"}\n");
            }
          });
        }
      }
      else if ( type=="chat" )
      {
        if ( args[0]=="post" )
        {
          if ( !webClient.authenticatedUsername )
            return;
          db.postChat( webClient.authenticatedUsername, args[1], function(posts){
            webClient.emit('message', "/chat\tupdate\t"+JSON.stringify(posts));
            msgServerNotifier.write("/chat\tupdate\t"+JSON.stringify(posts)+"\n");  // update everyone else
          });
        }
        else
        {
          db.grabChat( function(posts){
            webClient.emit('message', "/chat\tinit\t"+JSON.stringify(posts));
          });
        }
      }
    }

    webClient.on('message', function(msg)
    {
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
  //    webClient.broadcast.send( webClient.id + ' is no longer available' );
      msgServerNotifier.end();
    });
  });

}

module.exports = {
  setChatServer: function( server ) {
    chatserver = server;
  },
  setDatabase: function( database ) {
    db = database;
  },
  startServer: startServer
}

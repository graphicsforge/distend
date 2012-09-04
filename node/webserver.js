

var http = require('http'), // HTTP server
    net = require('net'),
    os = require('os'),
    spawn = require ('child_process').spawn;
var io = require('socket.io'); // socket.io git://github.com/LearnBoost/socket.io.git
// socket.io-client git://github.com/LearnBoost/socket.io-client.git
var util = require('util'),
    fs = require('fs'); // File System
var colors = require('colors'); // colors git://github.com/Marak/colors.js.git
var    websocket = require('node-http-proxy/vendor/websocket'), // node-http-proxy https://github.com/nodejitsu/node-http-proxy.git 
// pkginfo git://github.com/indexzero/node-pkginfo.git
    httpProxy = require('node-http-proxy/lib/node-http-proxy');


var db = require ("db.js");
var chatserver = require ("chatserver.js");

var MSG_SERVER_PORT=8000;
var HTTP_PORT=3000;
var NODE_WWW_PATH="./www";
chatserver.setPort(MSG_SERVER_PORT);
chatserver.startServer();

function sendMainSite(req, res)
{
  // render main page
  res.writeHead(200, {'Content-Type': 'text/html'});
  try {
  var output = ""+
    "<meta http-equiv=\"X-UA-Compatible\" content=\"chrome=1\">"+
    "<meta name=\"viewport\" content=\"width=device-width; initial-scale=1.0; maximum-scale=1.0;\">"+
    "\n<title>Distend</title>"+
    "\n<script src=\"http://"+req.headers.host+"/socket.io/socket.io.js\"></script>"+
    "\n<script key=\"miscUtils\">"+
        fs.readFileSync(NODE_WWW_PATH+'/uiManager.js', 'utf8')+
    "\n</script>"+
    "\n<script key=\"socketUtils\">"+
        fs.readFileSync(NODE_WWW_PATH+'/socketioManager.js', 'utf8')+
    "\n</script>"+
    "<body style=\"background-color:#ffd0d0;font-family: Veranda;overflow:hidden\">"+
        fs.readFileSync(NODE_WWW_PATH+'/header.html', 'utf8')+
        fs.readFileSync(NODE_WWW_PATH+'/statusBox.html', 'utf8')+
        "<div style='position:relative'>"+
          fs.readFileSync(NODE_WWW_PATH+'/chat.html', 'utf8')+
        "</div>"+
        fs.readFileSync(NODE_WWW_PATH+'/shaders.inc', 'utf8')+
        fs.readFileSync(NODE_WWW_PATH+'/render.html', 'utf8')+
    "</body>";
  } catch ( error ) { console.log( error.toString() ) }
  res.end(output);
}

function launchWebChatServer()
{
  console.log("launching http server");
  // make a standard http server
  httpServer = httpProxy.createServer(function(req, res, proxy){
    // respond to web requests
    if ( req.url=="/test" )
    {
      res.writeHead(200, {'Content-Type': 'text/html'});
      try {
      var output = "";
      if ( req.headers['user-agent'].match(/msie/i) || req.headers['user-agent'].match(/chromeframe/i) )
      {
        output += "<script> var IEBrowser = true;  </script>\n";
      }
      output += ''+
            fs.readFileSync(NODE_WWW_PATH+'/shaders.inc', 'utf8')+
            fs.readFileSync(NODE_WWW_PATH+'/render.html', 'utf8');
      } catch ( error ) { console.log( error.toString() ) }
      res.end(output);
      return;
    }
    else
    {
      if ( req.url[req.url.length-1]=='/' )
      {
        sendMainSite(req, res);
        return;
      }
      req.url = req.url.replace(/%20/g,'\ ').replace(/%28/g,'(').replace(/%29/g,')');
      fs.exists(NODE_WWW_PATH+req.url, function(exists) {  
        if(!exists) {  
          res.writeHead(404, {"Content-Type": "text/plain"});  
          res.end("404 Not Found\n");  
          return;
        }
        try {
          var fileStream = fs.createReadStream(NODE_WWW_PATH+req.url, {start:0});
          fileStream.on("data", function(data) {
            res.write(data, 'binary');
          });
          fileStream.on("end", function() {
            res.end();
          });
        } catch ( error ) { res.end(error) }
      });
      return;
    }
    sendMainSite(req, res);
});
httpServer.on("error", function(err) {
  console.log("httpServer "+err.code);
});
httpServer.listen(HTTP_PORT);
console.log("launching web chat server");
var msgwebSocket = io.listen(httpServer);
msgwebSocket.set('log level', 1);

// on a connection, do stuff
msgwebSocket.sockets.on('connection', function(webClient)
{
  // listen to msgServer
  var msgServerNotifier = new net.Socket();
  msgServerNotifier.connect(MSG_SERVER_PORT, "localhost", function(){msgServerNotifier.write("/nick anon"+webClient.id+"\n/join webclient\n")});
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
  console.log(util.inspect(posts));
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
setTimeout(launchWebChatServer, 1000);


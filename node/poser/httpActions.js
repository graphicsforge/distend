
var http = require('http'); // HTTP server
var util = require('util'),
    fs = require('fs'); // File System
var httpProxy = require('node-http-proxy/lib/node-http-proxy'); // node-http-proxy https://github.com/nodejitsu/node-http-proxy.git 
// pkginfo git://github.com/indexzero/node-pkginfo.git



var NODE_WWW_PATH = "./";
var HTTP_PORT = 80;
var httpServer;

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
        fs.readFileSync(NODE_WWW_PATH+'/UIManager.js', 'utf8')+
    "\n</script>"+
    "\n<script key=\"socketUtils\">"+
        fs.readFileSync(NODE_WWW_PATH+'/SocketIOManager.js', 'utf8')+
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

function startServer()
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
}

module.exports = {
  setBasePath: function( basePath ) {
    NODE_WWW_PATH = basePath;
  },
  setPort: function( port ) {
    HTTP_PORT = port;
  },
  startServer: startServer,
  getHttpServer: function() { return httpServer; }
}

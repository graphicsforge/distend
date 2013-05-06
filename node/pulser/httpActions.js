
var http = require('http'); // HTTP server
var util = require('util');
var fs = require('fs'); // File System
var spawn = require ('child_process').spawn;
var querystring = require('querystring');
var httpProxy = require('node-http-proxy/lib/node-http-proxy'); // node-http-proxy https://github.com/nodejitsu/node-http-proxy.git 
var formidable = require('formidable');

var blenderScripts = require('./blenderScripts/blenderScripts');

var PATH = ".";
var HTTP_PORT = 80;
var httpServer;
var chatServer;


function sendAppPage(req, res, access_token)
{
  // render main page
  res.writeHead(200, {'Content-Type': 'text/html'});
  try {
  var output = ""+
    "<meta http-equiv=\"X-UA-Compatible\" content=\"chrome=1\">"+
    "<meta name=\"viewport\" content=\"width=device-width; initial-scale=1.0; maximum-scale=1.0;\">"+
    "\n<title>Pulser</title>"+
    "\n<script src=\"/socket.io/socket.io.js\"></script>"+
    "\n<script key=\"miscUtils\" src=\"classes/UIManager.js\"></script>"+
    "\n<script key=\"socketUtils\" src=\"classes/SocketIOManager.js\"></script>"+
    "\n"+fs.readFileSync(PATH+'/shaders.inc', 'utf8')+
    "\n<body style='color: #ffffff'>\n"+
        fs.readFileSync(PATH+'/pulser.html', 'utf8')+
    "</body>";
  } catch ( error ) { console.log( error.toString() ) }
  res.end(output);
}

function handleUpload(req, res)
{
  var form = new formidable.IncomingForm(),
      files = [],
      fields = [];

  form.uploadDir = 'tmp';

  form
    .on('field', function(field, value) {
      console.log(field, value);
      fields.push([field, value]);
    })
    .on('file', function(field, file) {
      console.log(field, file);
      files.push([field, file]);
    })
    .on('end', function() {
      console.log('-> upload done');
    });
  form.parse(req, function(err, fields, files) {
    // bail if we didn't get a file
    if ( files.upload==undefined )
    {
      console.log('upload attempted without a file');
      return;
    }
    if ( fields['slot']==undefined )
      fields['slot'] = 0;
    // extract our extension
    var extension = files.upload.name.substring(files.upload.name.lastIndexOf('.')+1);
    if ( extension=='stl' )
    {
        var operations = [];
        // start off with our load modifier
        blenderScripts.pushLoadSTLOperation(operations, fields['nick'], 0, files.upload.path);
        blenderScripts.pushExportOperations(operations, fields['nick'], fields['slot']);

        res.writeHead(200, {'content-type': 'application/octet-stream'});
        res.end('upload complete');
        blenderScripts.apply(operations, fields['nick'], fields['slot'], function() {
          fs.unlink(files.upload.path);
        });
    }
    else if ( extension=='svg' )
    {
        res.writeHead(200, {'content-type': 'application/octet-stream'});
        res.end('upload complete');
        blenderScripts.apply('import_svg.py', {
          chatServer: chatServer,
          webPath:PATH,
          nick:fields['nick'],
          slot:fields['slot'],
        },{
          inputfile:files.upload.path
        });
    }
    else if ( false )
    {
      fs.readFile(files.upload.path, function (err, file) {
          res.writeHead(200, {'content-type': 'application/octet-stream'});
          res.end('upload complete');
          chatServer.write('upload complete, doing ffmpeg transcode', fields['nick']  )
          var outputfile='output/'+files.upload.name.substring(0,files.upload.name.lastIndexOf('.')).replace(/[:#\?&@%+\'\"~]/g, "")+'.mp3';
          ffmpeg = spawn('ffmpeg',['-y','-i',files.upload.path, '-acodec','libmp3lame',PATH+'/'+outputfile]);
          ffmpeg.stdout.on('data', function(data){
            chatServer.write(data.toString(), fields['nick']  )
          });
          ffmpeg.stderr.on('data', function(data){
            chatServer.write(data.toString(), fields['nick']  )
          });
          ffmpeg.on('exit', function(code, signal){
            chatServer.write('/outputurl '+outputfile, fields['nick']  )
            // clean up the input file
            fs.unlink(files.upload.path);
          });
      });
    }
  });
}

function handleAPIUpload(req, res)
{
  var form = new formidable.IncomingForm();

  form.uploadDir = 'tmp';

  form
    .on('end', function() {
      console.log('-> upload done');
    });
  try { form.parse(req, function(err, fields, files) {
      // bail if we didn't get a file
      if ( !files.file_0 )
      {
        res.writeHead(200, {'content-type': 'text/html'});
        res.end('error: no file_0');
        return;
      }
      var outputFile = files.file_0.path+'_apioutput.stl';
      var operations = [];
      // start off with our load modifier
      operations.push( ['loadSTL', '"'+files.file_0.path+'"'] );
      operations.push( ['outputModel', '"'+outputFile+'"'] );

      blenderScripts.apply(operations, fields['nick'], fields['slot'], function() {
        fs.readFile(outputFile, function (err, file) {
            res.writeHead(200, {
                'content-type': 'application/octet-stream',
                'content-disposition': 'attachment; filename=pulsed_'+files.file_0.name});
            res.end(file);
            fs.unlink(outputFile);
        });
        for ( var name in files )
          fs.unlink(files[name].path);
      });

    }); } catch (error) {
    res.writeHead(200, {'content-type': 'text/html'});
    res.end("error: "+error.toString());
  }
}


function startServer()
{
  console.log("launching http server");
  // make a standard http server
  httpServer = httpProxy.createServer(function(req, res, proxy){
    // respond to web requests
    if ( req.url[req.url.length-1]=='/' )
    {
      sendAppPage(req, res, undefined);
      return;
    }
    // see if this is an authorization redirect
    if ( req.url.substr(0,2)=="/?" )
    {
      sendAppPage(req, res, undefined);
      return;
    }
    if (req.url == '/upload') {
      handleUpload(req, res);
      return;
    }
    if (req.url == '/api') {
      handleAPIUpload(req, res);
      return;
    }
    // otherwise see if this is a resource request
    req.url = decodeURI(req.url);
    fs.exists(PATH+req.url, function(exists) {  
      if(!exists) {  
        res.writeHead(404, {"Content-Type": "text/plain"});  
        res.end("404 Not Found\n");  
        return;
      }
      try {
        fs.stat(PATH+req.url, function( error, stat ) {
          if ( error ) { throw error; }
          res.writeHead(200, {
            'Content-Length' : stat.size
          });
          var fileStream = fs.createReadStream(PATH+req.url, {start:0});
          fileStream.on("data", function(data) {
            res.write(data, 'binary');
          });
          fileStream.on("end", function() {
            res.end();
          });
        });
      } catch ( error ) { res.end(error) }
    });
    return;
  });
  httpServer.on("error", function(err) {
    console.log("httpServer "+err.code);
  });
  httpServer.listen(HTTP_PORT);
}

module.exports = {
  setBasePath: function( basePath ) {
    PATH = basePath;
    blenderScripts.setBasePath( PATH );
  },
  setPort: function( port ) {
    HTTP_PORT = port;
  },
  setChatServer: function( server ) {
    chatServer = server;
    blenderScripts.setChatServer( server );
  },
  startServer: startServer,
  getHttpServer: function() { return httpServer; }
}

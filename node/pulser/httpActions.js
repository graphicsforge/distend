
var http = require('http'); // HTTP server
var util = require('util');
var fs = require('fs'); // File System
var spawn = require ('child_process').spawn;
var querystring = require('querystring');
var httpProxy = require('http-proxy/lib/node-http-proxy'); // node-http-proxy https://github.com/nodejitsu/node-http-proxy.git 
var formidable = require('formidable');
var async = require('async');

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
  var form = new formidable.IncomingForm();

  form.uploadDir = 'tmp';

  form.parse(req, function(err, fields, files) { try {
    // create our files object
    var fileArray = [];
    for (file in files) {
      if (!files.hasOwnProperty(file)) continue;
      fileArray.push({name:file,file:files[file]});
    }
    // TODO look through fields for file urls
    // and add them to the array here
    // define our pre-process function (conversion/download)
    var filePreProcess = function(fileArrayElement, callback) {

      if ( fileArrayElement.file!=undefined )
      {
        var file = fileArrayElement.file;
        var extension = file.name.substring(file.name.lastIndexOf('.')+1).toString();
        var acceptedExtensions = new RegExp('^stl$|^obj$|^svg$');
        if ( extension.match(acceptedExtensions) )
        {
          callback(undefined, fileArrayElement);
        }
        else // assume image and convert to svg
        {
          var convertedFile = fs.createWriteStream(file.path+'_converted', {flags:'w'});
          var blacklevel = 0.5;
          if ( fields['image_blacklevel']!==undefined )
            blacklevel = parseFloat(fields['image_blacklevel']);
          var potrace = spawn('./runPotrace.sh',[file.path,blacklevel]);
          potrace.stdout.on('data', function(data){
            convertedFile.write(data);
          });
          potrace.stderr.on('data', function(data){
            console.error(data.toString('utf8'));
          });
          potrace.on('exit', function(code, signal){
            convertedFile.end();
            fs.unlink(file.path);
            fileArrayElement.file.path = file.path+'_converted';
            fileArrayElement.file.name = file.name.substring(0,file.name.lastIndexOf('.'))+'.svg';
            callback(undefined, fileArrayElement);
          });
        }
      }
    }; // function filePreProcess

    async.map(fileArray, filePreProcess, function(err, resultArray){
      // bail if we didn't get a file
      if ( !resultArray.length )
      {
        res.writeHead(200, {'content-type': 'text/html'});
        res.end('error: no files');
        return;
      }
      // remember which file came first
      var defaultFile = resultArray[0].file;
      var outputFile = new Date().getTime()+'_apioutput.stl';
      // re-create file object from converted fileArray
      files = {};
      for ( var i=0; i<resultArray.length; i++ )
        files[resultArray[i].name] = resultArray[i].file;

      // grab our actions
      var modifiers = undefined;
      var operations = [];
      if ( typeof(fields['modifiers'])=='string' )
      {
        modifiers = JSON.parse(fields.modifiers);
        for ( var i=0; i<modifiers.length; i++ )
        {
          // point our file actions agains the relevant paths
          if ( modifiers[i][0].substring(0, 4)=='load')
          {
            if ( files[modifiers[i][1]]!=undefined )
              modifiers[i][1] = '"'+files[modifiers[i][1]].path+'"';
            else
              throw "load operation referenced unknown file \""+modifiers[i][1]+"\"";
          }
          if ( modifiers[i][0].substring(0, 6)=='output')
            modifiers[i][1] = '"'+outputFile+'"';
          operations.push(modifiers[i]);
        }
console.log(operations);
        // TODO make operations look something like:
        //operations.push( ['loadSTL', '"'+files[0].path+'"'] );
        //operations.push( ['outputModel', '"'+outputFile+'"'] );

        blenderScripts.apply(operations, undefined, undefined, function() {
          fs.readFile(outputFile, function (err, file) {
              res.writeHead(200, {
                  'content-type': 'application/octet-stream',
                  'content-disposition': 'attachment; filename=pulsed_'+defaultFile.name});
              res.end(file);
              fs.unlink(outputFile);
              // clean up after ourselves
              for ( var name in files )
                fs.unlink(files[name].path);
          });
        });
      }
      else if ( fields['nick']!==undefined && fields['slot']!==undefined )
      {
        // this is a call from our main app
        blenderScripts.pushLoadOperation(operations, fields['nick'], 0, defaultFile.path);
        blenderScripts.pushExportOperations(operations, fields['nick'], fields['slot']);

        res.writeHead(200, {'content-type': 'application/octet-stream'});
        res.end('upload complete');
        blenderScripts.apply(operations, fields['nick'], fields['slot'], function() {
          for ( var name in files )
            fs.unlink(files[name].path);
        });
      }
      else
      {
        // if not told to do anything, just give back the default file?
        fs.readFile(defaultFile.path, function (err, file) {
            res.writeHead(200, {
                'content-type': 'application/octet-stream',
                'content-disposition': 'attachment; filename=pulsed_'+defaultFile.name});
            res.end(file);
            // clean up after ourselves
            for ( var name in files )
              fs.unlink(files[name].path);
        });
      }

    }); } catch (error) {
      res.writeHead(200, {'content-type': 'text/html'});
      res.end("error: "+error.toString());
    } /* async map file pre-process */
  });
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
      handleUpload(req, res);
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


var fs = require('fs');
var spawn = require ('child_process').spawn;

var blender = './blender';
var scriptPath = './pulser/blenderScripts/';
var tmpPath = './tmp/';
var PATH = '';
var chatServer = undefined;

streamScript = function( stream, operations )
{
  // grab function definitions
  fs.readFile(scriptPath+'startCode.py', function(err, data) {
    if (err) {console.log(err);};
    stream.write(data);

    for ( var i=0; i<operations.length; i++ )
    {
      stream.write(operations[i][0]+"(");
      for ( var j=1; j<operations[i].length; j++ )
      {
        if ( j>1 )
          stream.write(",");
        stream.write(operations[i][j]);
      }
      stream.write(")\n");
    }
    stream.end();
  });
}

pushLoadSTLOperation = function( operations, nick, slot, inputfile )
{
  var basefile = '';
  if ( slot>0 )
    basefile = PATH+'/input/'+nick+'_'+(slot-1)+'.stl';
  if ( inputfile!=undefined )
    operations.push( ['loadSTL', "'"+inputfile+"'", "'"+basefile+"'"] );
  else
    operations.push( ['loadSTL', "'"+basefile+"'"] );
}

pushExportOperations = function( operations, nick, slot )
{
  var outputSTL = PATH+'/input/'+nick+'_'+slot+'.stl';
  var outputJSON = PATH+'/output/'+nick+'.json';
  operations.push( ['outputModel', "'"+outputSTL+"'"] );
  operations.push( ['outputVArray', "'"+outputJSON+"'"] );
}


module.exports = {
  streamScript: streamScript,
  pushLoadSTLOperation: pushLoadSTLOperation,
  pushExportOperations: pushExportOperations,
  setBasePath: function( basePath ) {
    PATH = basePath;
  },
  setChatServer: function( server ) {
    chatServer = server;
  },
  apply: function( script, nick, slot, callback )
  {
// debug:
var scriptWriter = fs.createWriteStream('debug.txt', {flags:'w'});
streamScript( scriptWriter, script );
    if ( nick==undefined )
      nick = 'anon';
    if ( slot==undefined )
      slot = 0;
    var scriptPipe = tmpPath+nick;
    // kill any previous blenderings
    var killBlender = spawn( './cleanBlenders.sh', [scriptPipe] );
    killBlender.on('exit', function(code, signal){
      // make sure we have a fifo for this
      var mkfifo = spawn('mkfifo',  [scriptPipe]);
      mkfifo.on('exit', function (code) {
        // set up blender call
        blender = spawn('./blender',['-b',scriptPath+'blank.blend', '-P',scriptPipe]);
        blender.stdout.on('data', function(data){
          if ( chatServer!=undefined )
          {
            var message = data.toString().split(/[\n\r]/);
            for ( var i=0; i<message.length; i++ )
              chatServer.write( '/modstatus '+slot+' '+message[i]+'\n', nick  )
          }
        });
        blender.stderr.on('data', function(data){
          if ( chatServer!=undefined )
          {
            var message = data.toString().split(/[\n\r]/);
            for ( var i=0; i<message.length; i++ )
              chatServer.write( '/modstatus '+slot+' '+message[i]+'\n', nick  )
          }
        });
        blender.on('exit', function(code, signal){
          if ( chatServer!=undefined )
          {
            var outputJSON = 'output/'+nick+'.json';
            var outputSTL = 'input/'+nick+'_'+slot+'.stl';
            var inputSTL = 'input/'+nick+'_'+(slot-1)+'.stl';
            chatServer.write( '/updatemodel preview '+outputJSON+"\n", nick  );
            chatServer.write( '/modstatus '+slot+' status 100%\n', nick  )
            chatServer.write( '/outputurl '+outputSTL+'\n', nick  )
          }
          if ( typeof(callback)=='function' )
            callback();
        });
        // do it
        var scriptWriter = fs.createWriteStream(scriptPipe, {flags:'a'});
        try {
          streamScript(scriptWriter, script);
        } catch(err) {
          if ( chatServer!=undefined )
            chatServer.write( 'error in script', options.nick  );
          // cleanup after errors
          if ( typeof(callback)=='function' )
            callback();
        }

      }); // mkfifo
    }); // killBlender
    killBlender.on('error', function(data){
      console.log(data);
    });

  }
}

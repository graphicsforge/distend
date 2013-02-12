
var fs = require('fs');
var spawn = require ('child_process').spawn;

var blender = './blender';
var scriptPath = './pulser/blenderScripts/';
var path;
var chatServer;

module.exports = {
  apply: function( script, options, vars )
  {
    if ( options.nick==undefined )
      options.nick = 'anon';
    if ( options.slot==undefined )
      options.slot = 0;
    if ( options.webPath==undefined )
      options.webPath = '';

    var outputJSON = 'output/'+options.nick+'.json';
    var outputSTL = 'input/'+options.nick+'_'+options.slot+'.stl';
    var inputSTL = 'input/'+options.nick+'_'+(options.slot-1)+'.stl';
    var envars = vars;
    envars.outputstl = options.webPath+'/'+outputSTL;
    envars.basestl = '';
    // see if we had a file in our previous slot
    if ( fs.existsSync(options.webPath+'/'+inputSTL) )
    {
      envars.basestl = options.webPath+'/'+inputSTL;
    };
    envars.json = options.webPath+'/'+outputJSON;
    // print debug info
    var envarString = ""
    for ( name in envars )
      envarString+= name+'='+envars[name]+' ';
    console.log('running: '+envarString+'./blender -P '+scriptPath+script);
    // do it
    blender = spawn('./blender',['-b',scriptPath+'blank.blend', '-P',scriptPath+script], { env: envars });
    blender.stdout.on('data', function(data){
      if ( options.chatServer!=undefined )
        options.chatServer.write( '/modstatus '+options.slot+' '+data.toString(), options.nick  )
    });
    blender.stderr.on('data', function(data){
      if ( options.chatServer!=undefined )
        options.chatServer.write( data.toString(), options.nick  )
    });
    blender.on('exit', function(code, signal){
      if ( options.chatServer!=undefined )
      {
        options.chatServer.write( '/updatemodel preview '+outputJSON+"\n", options.nick  );
        options.chatServer.write( '/modstatus '+options.slot+' status 100%', options.nick  )
      }
      if ( options.inputFile!=undefined )
        fs.unlink(options.inputFile);
    });


  }  
}

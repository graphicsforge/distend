
var System = require('cassandra-client').System;
var sys = new System('localhost:9160');
var uuid = new require('uuid-js');

var PooledConnection = require('cassandra-client').PooledConnection;
var hosts = ['localhost:9160'];
var connection_pool = new PooledConnection({'hosts': hosts, 'keyspace': 'distend'});

function initUsers( callback )
{
  // initialize user table if we don't have one yet
  connection_pool.execute('CREATE COLUMNFAMILY users ('+
    'username text PRIMARY KEY,'+
    'img text,'+
    'firstName text,'+
    'lastName text)'
    , [], function(err) {
      callback();
    }
  );
}

function initChat( callback )
{
  // initialize user table if we don't have one yet
  connection_pool.execute('CREATE COLUMNFAMILY chat ('+
    'time uuid PRIMARY KEY,'+
    'username text,'+
    'msg text)'
    , [], function(err) {
      callback();
    }
  );
}


function FBSignIn( username, img, firstName, lastName, callback )
{
  initUsers( function(){
    var connection_pool = new PooledConnection({'hosts': hosts, 'keyspace': 'distend'});
    connection_pool.execute('UPDATE users SET img=?, firstName=?, lastName=? WHERE username=?',
      [img, firstName, lastName, username],
      function(err) {
        callback();
      }
    );
  });
}

function postChat( username, message, callback )
{
  initChat( function(){
    var connection_pool = new PooledConnection({'hosts': hosts, 'keyspace': 'distend'});
    var keynow = uuid.create(1);
    connection_pool.execute('INSERT INTO chat (time, username, msg) VALUES (?, ?, ?)',
      [keynow, username, message],
      function(err) {
        if ( err ) { console.log("postchat "+err); return; }
        var post = new Object();
        post['username'] = username;
        post['msg'] = message;
        callback( new Array(post) );
      }
    );

  });
}

function grabChat( callback )
{
  initChat( function(){
    var connection_pool = new PooledConnection({'hosts': hosts, 'keyspace': 'distend'});
    var keynow = uuid.create(1);
    connection_pool.execute("SELECT 'username', 'msg' FROM chat",
      [],
      function(err, rows) {
        if ( err ) { console.log("grabchat: "+err); return; }
        callback(rows.map(function(row){
          return row.colHash;
        }));
      }
    );
  });
}

module.exports = {
  FBSignIn: FBSignIn,
  postChat: postChat,
  grabChat: grabChat
}

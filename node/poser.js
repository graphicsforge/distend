

var os = require('os');
var spawn = require ('child_process').spawn;
var util = require('util');
var fs = require('fs');
var colors = require('colors'); // colors git://github.com/Marak/colors.js.git

var chatserver = require ("chatserver.js");
var db = require ("./poser/databaseActions.js");
var httpActions = require ("./poser/httpActions.js");
var websocketActions = require ("./poser/websocketActions.js");

httpActions.setBasePath("./poser");
httpActions.setPort(3000);
chatserver.setPort(8000);
chatserver.startServer();
websocketActions.setChatServer(chatserver);
websocketActions.setDatabase(db);

function launchWebChatServer()
{
  httpActions.startServer();
  websocketActions.startServer( httpActions.getHttpServer() );
}
setTimeout(launchWebChatServer, 0);




var os = require('os');
var util = require('util');
var fs = require('fs');

var chatserver = require ("chatserver.js");
var httpActions = require ("./pulser/httpActions.js");
var websocketActions = require ("./pulser/websocketActions.js");

httpActions.setBasePath("./pulser");
websocketActions.setBasePath("./pulser");
httpActions.setPort(3000);
chatserver.setPort(8000);
chatserver.startServer();
httpActions.setChatServer(chatserver);
websocketActions.setChatServer(chatserver);

function launchWebChatServer()
{
  httpActions.startServer();
  websocketActions.startServer( httpActions.getHttpServer() );
}
setTimeout(launchWebChatServer, 0);


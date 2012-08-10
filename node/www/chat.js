
function Chat()
{ }

Chat.prototype.adjustNewPostOffset = function(){}

function chat_new_post( element )
{
  if ( element==null || element.value==undefined || !element.value.length )
    return;
  var text = element.value.replace(/\n/g,'<br>').replace(/\t/g,'  ');
  sendMessage('/chat\tpost\t'+text+'\t');
  element.value = "";
}

socketIOManager.addListener("chat", function(data){
  var element = document.getElementById('chat_log');
  var posts = JSON.parse(data[1]);
  if ( data[0]=="init" )
  {
    // TODO use a templater like mustache.js?
    element.innerHTML = "";
  }
  if ( data[0]=="init" || data[0]=="update" )
  {
    var html = "";
    for ( var i=0; i<posts.length; i++ )
    {
      if ( posts[i]==undefined )
        continue;
      html = "<div>"+posts[i].username+": "+posts[i].msg+"</div>"+html;
    }
    element.innerHTML = html+element.innerHTML;
  }

});

Decimate.prototype = new Modifier;
Decimate.constructor = Decimate;
function Decimate()
{
  this.uid = 'Modifier'+IdGenerator.getNext();  // get a unique identifier
  this.name = 'Decimate Model';
}

Decimate.prototype.drawControls = function()
{
  var self = this;
  var controls = document.createElement('div');
  //numVerts
  this.numVerts = document.createElement('input');
  this.numVerts.setAttribute('id', this.uid+'_numVerts');
  this.numVerts.setAttribute('type', 'text');
  this.numVerts.setAttribute('value', 'desired # of verts');
  this.numVerts.setAttribute('onclick', 'if(this.value==\'desired # of verts\'){this.value=\'\';}');
  this.numVerts.setAttribute('onkeydown', 'Modifier.changed("'+this.uid+'")');
  this.numVerts.setAttribute('onchange', 'Modifier.apply("'+this.uid+'")');
  controls.appendChild(this.numVerts);
  return controls;
}

Decimate.prototype.onapply = function() {
  var numVerts = document.getElementById(this.numVerts.getAttribute('id')).value;
  numVerts = parseFloat(numVerts);
  socketIOManager.sendMessage('/modifier '+this.index+' decimate '+numVerts);
}




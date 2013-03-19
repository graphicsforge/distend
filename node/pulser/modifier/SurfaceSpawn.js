SurfaceSpawn.prototype = new Modifier;
SurfaceSpawn.constructor = SurfaceSpawn;
function SurfaceSpawn()
{
  this.uid = 'Modifier'+IdGenerator.getNext();  // get a unique identifier
  this.name = 'SurfaceSpawn Model';
  this.type = 'combine';
  this.shadowColor = '#a0a000';
}

SurfaceSpawn.prototype.drawControls = function()
{
  var self = this;
  var controls = document.createElement('div');
  //scale
  this.scale = document.createElement('input');
  this.scale.setAttribute('id', this.uid+'_factor');
  this.scale.setAttribute('type', 'range');
  this.scale.setAttribute('min', '.001');
  this.scale.setAttribute('max', '2');
  this.scale.setAttribute('value', '0.05');
  this.scale.setAttribute('step', '0.001');
  this.scale.setAttribute('onchange', 'Modifier.changed("'+this.uid+'")');
  controls.appendChild(this.scale);
  //num spawned
  this.spawn = document.createElement('input');
  this.spawn.setAttribute('id', this.uid+'_spawn');
  this.spawn.setAttribute('type', 'text');
  this.spawn.setAttribute('value', 'desired # of spawn');
  this.spawn.setAttribute('onclick', 'if(this.value==\'desired # of spawn\'){this.value=\'\';}');
  this.spawn.setAttribute('onkeydown', 'Modifier.changed("'+this.uid+'")');
  this.spawn.setAttribute('onchange', 'Modifier.apply("'+this.uid+'")');
  controls.appendChild(this.spawn);
  return controls;
}

SurfaceSpawn.prototype.onapply = function() {
  // clear out previous output
  var scale = document.getElementById(this.scale.getAttribute('id')).value;
  var spawn = document.getElementById(this.spawn.getAttribute('id')).value;
  var slot1 = this.selectSlot1.childNodes[document.getElementById(this.selectSlot1.getAttribute('id')).selectedIndex].value;
  var slot2 = this.selectSlot2.childNodes[document.getElementById(this.selectSlot2.getAttribute('id')).selectedIndex].value;
  socketIOManager.sendMessage('/combine '+this.index+' 2 surfaceSpawn '+slot1+' '+slot2+' '+scale+' '+spawn);
}


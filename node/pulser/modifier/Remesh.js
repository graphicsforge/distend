Remesh.prototype = new Modifier;
Remesh.constructor = Remesh;
function Remesh()
{
  this.uid = 'Modifier'+IdGenerator.getNext();  // get a unique identifier
  this.name = 'Remesh Model';
  this.shadowColor = '#00ffff';
}

Remesh.prototype.drawControls = function()
{
  var self = this;
  var controls = document.createElement('div');
  //mode
  this.mode = document.createElement('select');
  this.mode.setAttribute('id', this.uid+'_mode');
  this.mode.name = 'mode';
  var mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'SMOOTH';
  this.mode.appendChild(mode_option);
  mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'SHARP';
  this.mode.appendChild(mode_option);
  mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'BLOCKS';
  this.mode.appendChild(mode_option);
  this.mode.setAttribute('onchange', 'Modifier.apply("'+this.uid+'")');
  controls.appendChild(this.mode);
  //octree
  this.octree = document.createElement('input');
  this.octree.setAttribute('id', this.uid+'_octree');
  this.octree.setAttribute('type', 'range');
  this.octree.setAttribute('min', '1');
  this.octree.setAttribute('max', '6');
  this.octree.setAttribute('value', '4');
  this.octree.setAttribute('onchange', 'Modifier.changed("'+this.uid+'")');
  this.octree.setAttribute('onmouseup', 'Modifier.apply("'+this.uid+'")');
  controls.appendChild(this.octree);
  return controls;
}

Remesh.prototype.onapply = function() {
  // clear out previous output
  document.getElementById('console').innerHTML = 'Remeshing...<br>';
  var mode = this.mode.childNodes[document.getElementById(this.mode.getAttribute('id')).selectedIndex].value;
  var octree = document.getElementById(this.octree.getAttribute('id')).value;
  octree = parseInt(octree);
  socketIOManager.sendMessage('/modifier '+this.index+' remesh '+mode+' '+octree);
}




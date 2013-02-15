
Wireframe.prototype = new Modifier;
Wireframe.constructor = Wireframe;
function Wireframe()
{
  this.uid = 'Modifier'+IdGenerator.getNext();  // get a unique identifier
  this.name = 'Wireframe Model';
  this.shadowColor = '#00ffff';
}

Wireframe.prototype.drawControls = function()
{
  var self = this;
  var controls = document.createElement('div');
  //thickness
  this.thickness = document.createElement('input');
  this.thickness.setAttribute('id', this.uid+'_thickness');
  this.thickness.setAttribute('type', 'range');
  this.thickness.setAttribute('min', '0.01');
  this.thickness.setAttribute('max', '3');
  this.thickness.setAttribute('value', '1');
  this.thickness.setAttribute('step', '0.01');
  this.thickness.setAttribute('onchange', 'Modifier.changed("'+this.uid+'")');
  this.thickness.setAttribute('onmouseup', 'Modifier.apply("'+this.uid+'")');
  controls.appendChild(this.thickness);
  return controls;
}

Wireframe.prototype.onapply = function() {
  // clear out previous output
  document.getElementById('console').innerHTML = 'wireframing...<br>';
  var thickness = document.getElementById(this.thickness.getAttribute('id')).value;
  thickness = parseFloat(thickness);
  socketIOManager.sendMessage('/modifier '+this.index+' wireframe '+thickness);
}




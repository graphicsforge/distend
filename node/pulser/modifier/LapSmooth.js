LapSmooth.prototype = new Modifier;
LapSmooth.constructor = Remesh;
function LapSmooth()
{
  this.uid = 'Modifier'+IdGenerator.getNext();  // get a unique identifier
  this.name = 'Lapacian Smooth';
}

LapSmooth.prototype.drawControls = function()
{
  var self = this;
  var controls = document.createElement('div');
  //factor
  this.factor = document.createElement('input');
  this.factor.setAttribute('id', this.uid+'_factor');
  this.factor.setAttribute('type', 'range');
  this.factor.setAttribute('min', '-100');
  this.factor.setAttribute('max', '100');
  this.factor.setAttribute('value', '0');
  this.factor.setAttribute('steps', '0.1');
  this.factor.setAttribute('onchange', 'Modifier.changed("'+this.uid+'")');
  this.factor.setAttribute('onmouseup', 'Modifier.apply("'+this.uid+'")');
  controls.appendChild(this.factor);
  return controls;
}

LapSmooth.prototype.onapply = function() {
  // clear out previous output
  document.getElementById('console').innerHTML = 'LapSmoothing...<br>';
  var factor = document.getElementById(this.factor.getAttribute('id')).value;
  factor = parseFloat(factor);
  socketIOManager.sendMessage('/modifier '+this.index+' lapSmooth '+factor);
}




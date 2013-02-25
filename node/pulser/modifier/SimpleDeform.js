
SimpleDeform.prototype = new Modifier;
SimpleDeform.constructor = SimpleDeform;
function SimpleDeform()
{
  this.uid = 'Modifier'+IdGenerator.getNext();  // get a unique identifier
  this.name = 'Simple Deform';
}

SimpleDeform.prototype.drawControls = function()
{
  var self = this;
  var controls = document.createElement('div');
  //mode
  this.mode = document.createElement('select');
  this.mode.setAttribute('id', this.uid+'_mode');
  this.mode.name = 'mode';
  var mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'TWIST';
  this.mode.appendChild(mode_option);
  mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'BEND';
  this.mode.appendChild(mode_option);
  mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'TAPER';
  this.mode.appendChild(mode_option);
  mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'STRETCH';
  this.mode.appendChild(mode_option);
  this.mode.setAttribute('onchange', 'Modifier.apply("'+this.uid+'")');
  controls.appendChild(this.mode);
  //factor
  this.factor = document.createElement('input');
  this.factor.setAttribute('id', this.uid+'_factor');
  this.factor.setAttribute('type', 'range');
  this.factor.setAttribute('min', '-2');
  this.factor.setAttribute('max', '2');
  this.factor.setAttribute('step', '0.05');
  this.factor.setAttribute('value', '0');
  this.factor.setAttribute('onchange', 'Modifier.changed("'+this.uid+'")');
  this.factor.setAttribute('onmouseup', 'Modifier.apply("'+this.uid+'")');
  controls.appendChild(this.factor);
  //pivot
  this.pivot = document.createElement('div');
  this.pivot.setAttribute('id', this.uid+'_pivot');
  var dim = document.createElement('input');
  dim.setAttribute('type', 'range');
  dim.setAttribute('min', '-2');
  dim.setAttribute('max', '2');
  dim.setAttribute('step', '0.1');
  dim.setAttribute('value', '0');
  dim.setAttribute('onchange', 'Modifier.changed("'+this.uid+'")');
  dim.setAttribute('onmouseup', 'Modifier.apply("'+this.uid+'")');
  this.pivot.appendChild(dim);
  dim = document.createElement('input');
  dim.setAttribute('type', 'range');
  dim.setAttribute('min', '-2');
  dim.setAttribute('max', '2');
  dim.setAttribute('step', '0.1');
  dim.setAttribute('value', '0');
  dim.setAttribute('onchange', 'Modifier.changed("'+this.uid+'")');
  dim.setAttribute('onmouseup', 'Modifier.apply("'+this.uid+'")');
  this.pivot.appendChild(dim);
  dim = document.createElement('input');
  dim.setAttribute('type', 'range');
  dim.setAttribute('min', '-2');
  dim.setAttribute('max', '2');
  dim.setAttribute('step', '0.1');
  dim.setAttribute('value', '0');
  dim.setAttribute('onchange', 'Modifier.changed("'+this.uid+'")');
  dim.setAttribute('onmouseup', 'Modifier.apply("'+this.uid+'")');
  this.pivot.appendChild(dim);
  controls.appendChild(this.pivot);

  return controls;
}

SimpleDeform.prototype.onapply = function() {
  // clear out previous output
  document.getElementById('console').innerHTML = 'SimpleDeforming...<br>';
  var mode = this.mode.childNodes[document.getElementById(this.mode.getAttribute('id')).selectedIndex].value;
  var factor = document.getElementById(this.factor.getAttribute('id')).value;
  factor = parseFloat(factor);
  var pivot = document.getElementById(this.pivot.getAttribute('id'));
  socketIOManager.sendMessage('/modifier '+this.index+' simple_deform '+mode+' '+factor+' '+pivot.childNodes[0].value+' '+pivot.childNodes[1].value+' '+pivot.childNodes[2].value);
}




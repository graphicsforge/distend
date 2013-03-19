Boolean.prototype = new Modifier;
Boolean.constructor = Boolean;
function Boolean()
{
  this.uid = 'Modifier'+IdGenerator.getNext();  // get a unique identifier
  this.name = 'Boolean Model';
  this.type = 'combine';
  this.shadowColor = '#a0a000';
}

Boolean.prototype.drawControls = function()
{
  var self = this;
  var controls = document.createElement('div');
  //mode
  this.mode = document.createElement('select');
  this.mode.setAttribute('id', this.uid+'_mode');
  this.mode.name = 'mode';
  var mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'DIFFERENCE';
  this.mode.appendChild(mode_option);
  mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'UNION';
  this.mode.appendChild(mode_option);
  mode_option = document.createElement('option');
  mode_option.innerHTML = mode_option.value = 'INTERSECT';
  this.mode.appendChild(mode_option);
  this.mode.setAttribute('onchange', 'Modifier.apply("'+this.uid+'")');
  controls.appendChild(this.mode);
  return controls;
}

Boolean.prototype.onapply = function() {
  // clear out previous output
  var mode = this.mode.childNodes[document.getElementById(this.mode.getAttribute('id')).selectedIndex].value;
  var slot1 = this.selectSlot1.childNodes[document.getElementById(this.selectSlot1.getAttribute('id')).selectedIndex].value;
  var slot2 = this.selectSlot2.childNodes[document.getElementById(this.selectSlot2.getAttribute('id')).selectedIndex].value;
  socketIOManager.sendMessage('/combine '+this.index+' 2 boolean '+slot1+' '+slot2+' "'+mode+'"');
}


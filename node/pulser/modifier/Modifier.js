
Modifier.prototype = new EventEmitter;
Modifier.constructor = Modifier;
function Modifier()
{
  this.index = 0; // if in a list, this is the index of the modifier
  // these get overridden by child classes
  this.name = 'Unknown Modifier';
  this.backgroundColor = '#fff';
  this.shadowColor = '#a00000';
}

Modifier.prototype.drawApply = function()
{
  // TODO clean this up
  this.applyButton = document.createElement('input');
  this.applyButton.setAttribute('id', this.uid+'_submit_button');
  this.applyButton.setAttribute('type', 'button');
  this.applyButton.setAttribute('value', 'Apply');
  this.applyButton.setAttribute('onclick', 'Modifier.apply("'+this.uid+'")');
  this.applyButton.style.display='none';
  return this.applyButton;
}

// return an HTML element, using the provided one if existing
Modifier.prototype.draw = function(element)
{
  // draw into specified element,
  if ( element!==undefined )
    this.element = element;
  // create one if needed
  if ( this.element===undefined )
  {
    var self = this;
    this.element = document.createElement('div');
    this.element.setAttribute('id', this.uid);
    this.element.setAttribute('class', "modifier");
    this.element.style.boxShadow = "inset 0px 0px 15px "+this.shadowColor;
    this.element.style.backgroundColor = this.backgroundColor;
    // add toggle expand link
    this.toggleExpand = document.createElement('a');
    this.toggleExpand.setAttribute('id', this.uid+'_toggle_expand');
    this.toggleExpand.setAttribute('class', "toggle_expand expanded");
    this.toggleExpand.innerHTML = "&Delta;";
    this.element.appendChild(this.toggleExpand);
    this.toggleExpand.onclick = function(){
      if ( self.element.getAttribute('slimview')=="1" )
        self.element.setAttribute('slimview', "0");
      else
        self.element.setAttribute('slimview', "1");
    };
    // add close buton
    var closeButton = document.createElement('button');
    closeButton.innerHTML = 'X';
    closeButton.setAttribute('class', 'close_button');
    closeButton.setAttribute('onclick', 'modifierList.remove(\''+this.uid+'\')');
    this.element.appendChild(closeButton);
    // add name
    var name = document.createElement('span');
    name.innerHTML = this.name;
    this.element.appendChild(name);
    this.progressBar = document.createElement('span');
    this.progressBar.setAttribute('class', 'progress_bar');
    this.progressBar.setAttribute('id', this.uid+'_progress_bar');
    this.element.appendChild(this.progressBar);
    // add controls
    if ( typeof(this.drawControls)=='function' )
    {
      var controls = this.drawControls();
      controls.setAttribute('class', 'controls');
      this.element.appendChild(controls);
    }
    // add the apply button
    if ( typeof(this.drawApply)=='function' )
    {
      this.element.appendChild(this.drawApply());
    }
  }
  return this.element;
}

Modifier.prototype.onmessage = function(messageArray)
{
  if ( messageArray[0]=='status' )
  {
    var progressBar = document.getElementById(this.progressBar.getAttribute('id'));
    progressBar.innerHTML = messageArray.slice(1).join(' ');
    return;
  }
  document.getElementById('console').innerHTML+=messageArray.join(' ')+'<br/>';
}

// static helper function that calls the specific apply
Modifier.apply = function(uid)
{
  // grab our modifier
  var self = modifierList.getById(uid);
  if ( typeof(self.onapply)=='function' )
    self.onapply();
  var progressBar = document.getElementById(self.progressBar.getAttribute('id'));
  progressBar.innerHTML = 'starting';
  document.getElementById(self.applyButton.id).style.display="none";
}

// static helper to call changed
Modifier.changed = function(uid)
{
  // grab our modifier
  var self = modifierList.getById(uid);
  if ( typeof(self.onchange)=='function' )
    self.onchange();
  var progressBar = document.getElementById(self.progressBar.getAttribute('id'));
  progressBar.innerHTML = '';
  document.getElementById(self.applyButton.id).style.display="block";
}



// have a way of referencing specific modifiers on the client
if ( typeof(IdGenerator)=='undefined' )
{
  var IdGenerator = new Object();
  IdGenerator.seed = 0;
  IdGenerator.getNext = function(){
    IdGenerator.seed += 1;
    return IdGenerator.seed;
  }
}

function ModifierList(element)
{
  this.modifiers = [];
  this.element = element;
}
ModifierList.prototype.setTarget = function(element)
{
  this.element = element;
}
ModifierList.prototype.appendModifier = function(modifier)
{
  modifier.index = this.modifiers.length;
  this.modifiers[modifier.index] = modifier;
  this.element.appendChild(modifier.draw());
}
ModifierList.prototype.refresh = function()
{
  this.element.innerHTML = '';
  for ( var i=0; i<this.modifiers.length; i++ )
    this.element.appendChild(this.modifiers[i].draw());
}
ModifierList.prototype.getIndexById = function(uid)
{
  for ( var i=0; i<this.modifiers.length; i++ )
    if ( uid==this.modifiers[i].uid )
      return i;
  return -1;
}
ModifierList.prototype.getById = function(uid)
{
  return this.modifiers[this.getIndexById(uid)];
}
ModifierList.prototype.remove = function(uid)
{
  for ( var i=0; i<this.modifiers.length; i++ )
    if ( uid==this.modifiers[i].uid )
    {
      this.modifiers.splice(i,1);
      break;
    }
  this.refresh();
}

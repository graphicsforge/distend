ImportUpload.prototype = new Modifier;
ImportUpload.constructor = ImportUpload;
function ImportUpload()
{
  this.uid = 'Modifier'+IdGenerator.getNext();  // get a unique identifier
  this.name = 'Upload Model';
  this.shadowColor = '#00ff00';
  this.type = 'import';
}

ImportUpload.prototype.drawApply = function()
{
  this.applyButton = document.createElement('input');
  this.applyButton.setAttribute('id', this.uid+'_submit_button');
  this.applyButton.setAttribute('type', 'button');
  this.applyButton.setAttribute('value', 'Upload');
  this.applyButton.setAttribute('onclick', 'Modifier.apply("'+this.uid+'")');
  this.applyButton.style.display='none';
  return this.applyButton;
}

ImportUpload.prototype.drawControls = function()
{
  var controls = document.createElement('div');
  // TODO clean this up
  this.uploadform = document.createElement('form');
  this.uploadform.setAttribute('id', this.uid+'_form');
  this.uploadform.setAttribute('action', '/upload');
  this.uploadform.setAttribute('enctype', 'multipart/form-data');
  this.uploadform.setAttribute('method', 'post');
  var uploadfile = document.createElement('input');
  uploadfile.setAttribute('type', 'file');
  uploadfile.setAttribute('name', 'upload');
  uploadfile.setAttribute('onchange', 'Modifier.apply("'+this.uid+'")');
  this.uploadform.appendChild(uploadfile);
  controls.appendChild(this.uploadform);
  return controls;
}

ImportUpload.prototype.onapply = function() {
  document.getElementById('console').innerHTML = 'Uploading file...<br>';
  var form = document.getElementById(this.uploadform.getAttribute('id'));
  // submit the form
console.log(form);
  var formData = new FormData(form);
console.log(formData);
  formData.append('nick', chatServerNick.toString());
  formData.append('slot', modifierList.getIndexById(this.uid));
  var xhr = new XMLHttpRequest();
  xhr.open('POST', form.getAttribute('action'), true);
  xhr.send(formData);
}

// static function called from upload button
ImportUpload.submitForm = function(form, uid) {
  // clear out previous output
  document.getElementById('console').innerHTML = 'Uploading file...<br>';
  document.getElementById(uid+'_upload_button').style.display = 'none';
  // submit the form
  var formData = new FormData(form);
  formData.append('nick', chatServerNick.toString());
  formData.append('slot', modifierList.getIndexById(uid));
  var xhr = new XMLHttpRequest();
  xhr.open('POST', form.getAttribute('action'), true);
  xhr.send(formData);
}

// static function called from file upload
// unhides the relevant submit button
ImportUpload.showUploadButton = function(uid) {
  if ( chatServerNick!='undefined')
    document.getElementById(uid+'_upload_button').style.display = 'block';
}



function Hand(renderer)
{
  this.renderer = renderer;
  var self = this;
  this.renderer.addListener("initgl", function(gl){
    if ( self.renderer.models['test']==undefined )
      self.renderer.models['test'] = new Model(gl, '/hand.json', function(){self.rigVertexes();});
    if ( self.renderer.textures['test']==undefined )
      self.renderer.textures['test'] = new Texture(gl, '/test.jpg');
    if ( self.renderer.textures['vertex']==undefined )
      self.renderer.textures['vertex'] = new Texture(gl, '/vertex.png');
  }, self );
  this.rigPoints = [];
  renderer.addListener('mousedown', function(event){self.onMouseDown(event)});
}

Hand.prototype.onMouseDown = function(event)
{
  for ( var i=0; i<this.rigPoints.length; i=i+1 )
    this.rigPoints[i].selected = this.rigPoints[i].checkHitbox( this.renderer.mousePos );
}


Hand.prototype.rigVertexes = function()
{
  this.rigPoints.length = 0;
  for ( var i=0; i<this.renderer.models['test'].numFaces; i=i+1 )
    this.rigPoints.push( new RigPoint(this.renderer, this.renderer.models['test'].getCoord(i)) );
}

Hand.prototype.draw = function()
{
  var camera = this.renderer.camera;
  var gl = this.renderer.gl;
  var canvas = this.renderer.canvas;
  var prMatrix = this.renderer.prMatrix;
  var mvMatrix = this.renderer.mvMatrix;
  var posLoc = this.renderer.posLoc;
  var normLoc = this.renderer.normLoc;
  var texLoc = this.renderer.texLoc;
  var viewport = new Viewport(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);

  prMatrix.makeIdentity();
  prMatrix.perspective(camera.vfov, canvas.width/canvas.height*camera.pixelAspectRatio, camera.frustrumNear, camera.frustrumFar);
  gl.uniformMatrix4fv( this.renderer.vs_basic_prMatrix, false, new Float32Array(prMatrix.getAsArray()) );
  mvMatrix.makeIdentity();
  mvMatrix.rotate(90, 1,0,0);
  mvMatrix.multRight(camera.extrinsic);
  gl.uniformMatrix4fv( this.renderer.vs_basic_mvMatrix, false, new Float32Array(mvMatrix.getAsArray()) );

  this.renderer.textures['test'].bind(gl);
  this.renderer.models['test'].draw(gl, posLoc, normLoc, texLoc);
  gl.bindTexture(gl.TEXTURE_2D, null);

  gl.clear( gl.DEPTH_BUFFER_BIT )

  for ( var i=0; i<this.rigPoints.length; i=i+1 )
    this.rigPoints[i].draw(gl);
}


function RigPoint(renderer, position) {
  this.renderer = renderer;
  this.worldPos = position;
  this.canvasPos = undefined;
  this.scale = 10;
/*
  if ( renderer.textures['square']==undefined )
    renderer.models['square'] = new Model(renderer.gl, '/square.json');
  if ( renderer.textures['vertex']==undefined )
    renderer.textures['vertex'] = new Texture(renderer.gl, '/vertex.png');
*/
  this.selected = false;
  this.hover = false;
}

RigPoint.prototype.checkHitbox = function( canvasCoords )
{
  if ( this.canvasPos==undefined || canvasCoords==undefined )
    return false;
  return ( Math.abs(canvasCoords[0]-this.canvasPos[0])<this.scale>>1 ) && ( Math.abs(canvasCoords[1]-this.canvasPos[1])<this.scale>>1 );
}

RigPoint.prototype.draw = function(gl)
{
  this.hover = this.checkHitbox( this.renderer.mousePos );
  if ( this.selected )
  {
    if ( renderer.textures['vertex_selected']==undefined )
      renderer.textures['vertex_selected'] = new Texture(gl, '/vertex_selected.png');
    else
      this.renderer.textures['vertex_selected'].bind(gl);
  }
  else if ( this.hover )
  {
    if ( renderer.textures['vertex_hover']==undefined )
      renderer.textures['vertex_hover'] = new Texture(gl, '/vertex_hover.png');
    else
      this.renderer.textures['vertex_hover'].bind(gl);
  }
  else
  {
    if ( renderer.textures['vertex']==undefined )
      renderer.textures['vertex'] = new Texture(gl, '/vertex.png');
    else
      this.renderer.textures['vertex'].bind(gl);
  }

  var prMatrix = new CanvasMatrix4();
  var mvMatrix = new CanvasMatrix4();
  var viewport = new Viewport(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
  var camera = this.renderer.camera;

  prMatrix.makeIdentity();
  prMatrix.perspective(camera.vfov, viewport.width/viewport.height*camera.pixelAspectRatio, camera.frustrumNear, camera.frustrumFar);
  mvMatrix.makeIdentity();
  mvMatrix.rotate(90, 1,0,0);
  mvMatrix.multRight(camera.extrinsic);
  var transform = new CanvasMatrix4(mvMatrix);
  transform.multRight(prMatrix);
  var deviceCoords = transform.apply(this.worldPos);
  // convert normalized device coords to canvas space
  this.canvasPos = [(deviceCoords[0]/deviceCoords[3]*.5+.5)*viewport.width,
                    (-deviceCoords[1]/deviceCoords[3]*.5+.5)*viewport.height,
                    0, 1];

  prMatrix.makeIdentity();
  prMatrix.ortho(0, viewport.width, viewport.height, 0, -1, 1);
  gl.uniformMatrix4fv( this.renderer.vs_basic_prMatrix, false, new Float32Array(prMatrix.getAsArray()) );
  mvMatrix.makeIdentity();
  mvMatrix.translate(-.5, -.5, 0);
  mvMatrix.scale( this.scale, this.scale, this.scale );
  mvMatrix.translate(this.canvasPos[0], this.canvasPos[1], 0);
  gl.uniformMatrix4fv( this.renderer.vs_basic_mvMatrix, false, new Float32Array(mvMatrix.getAsArray()) );
  this.renderer.models['square'].draw(gl, this.renderer.posLoc, this.renderer.normLoc, this.renderer.texLoc);

}

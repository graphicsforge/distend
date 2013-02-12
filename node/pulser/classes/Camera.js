
function Camera(vfov)
{
  this.vfov = 45;
  if ( vfov!=null )
    this.vfov = vfov;
  this.pixelAspectRatio = 1.0;
  this.frustrumNear = 0.1;
  this.frustrumFar = 100;
  this.extrinsic = new CanvasMatrix4();
  this.extrinsic.translate( 0, 0, -5 );
  this.target = [0, 0, 0];
  // attempt to apply ui listeners
  if ( typeof(uiManager)!='undefined' )
  {
    var self = this;
    uiManager.addListener('mousewheel', function(event) {
      var scale = .2;
      scale *= (event.detail<0 || event.wheelDelta>0) ? 1 : -1;
      self.extrinsic.translate( 0, 0, scale );
    });
    uiManager.addListener('mousemove', function(event) {
      // odd but where selectors look like a move
      if ( event.target.tagName=="HTML" )
        return;
      // shift for translate
      if ( uiManager.keyboard[16] )
      {
        if ( uiManager.mouseButton[0] )
        {
          var scale = 0.005;
          self.extrinsic.translate( scale*(uiManager.mousePos[0]-uiManager.mousePrev[0]), -scale*(uiManager.mousePos[1]-uiManager.mousePrev[1]), 0 );
        }
        else if ( uiManager.mouseButton[2] )
        {
          var scale = 0.01;
          self.extrinsic.translate( 0, 0, -scale*(uiManager.mousePos[1]-uiManager.mousePrev[1]) );
        }
      }
      // alt for rotate
      if ( uiManager.keyboard[18] )
      {
        var scale = -0.2;
        if ( uiManager.mouseButton[0] )
        {
          var rotation = [scale*(uiManager.mousePos[1]-uiManager.mousePrev[1]), scale*(uiManager.mousePos[0]-uiManager.mousePrev[0]), 0];
          self.rotate( rotation );
        }
        else if ( uiManager.mouseButton[2] )
        {
          var rotation = [0, 0, scale*(uiManager.mousePos[0]-uiManager.mousePrev[0])];
          self.rotate( rotation );
        }
      }
      // otherwise turntable around target
      if ( !uiManager.keyboard[16] && !uiManager.keyboard[18] )
      {
        if ( uiManager.mouseButton[0] )
        {
          var scale = 1;
          self.updateInfo();
          var cameraUp = self.info['up'];
          var rotationmat = new CanvasMatrix4();
          rotationmat.rotate( scale*(uiManager.mousePos[0]-uiManager.mousePrev[0]), cameraUp[0], cameraUp[1], cameraUp[2] );
          self.extrinsic.multLeft(rotationmat);
          var cameraRight = HomoVect.cross( self.info['up'], self.info['position'] );
          rotationmat.makeIdentity();
          rotationmat.rotate( scale*(uiManager.mousePos[1]-uiManager.mousePrev[1]), cameraRight[0], cameraRight[1], cameraRight[2] );
          self.extrinsic.multLeft(rotationmat);
        }
      }
    });
  }
}

Camera.prototype.updateInfo = function()
{
  this.info = [];
  var translate = [this.extrinsic.m30, this.extrinsic.m31, this.extrinsic.m32, 1];
  var rotation = new CanvasMatrix4(this.extrinsic);
  rotation.m30=0; rotation.m31=0; rotation.m32=0;
  rotation.transpose();
  translate = rotation.apply(translate);
  this.info['position'] = [-translate[0], -translate[1], -translate[2], 1];
  this.info['up'] = rotation.apply([0, 1, 0]);
}

Camera.prototype.rotate = function( relativeRotation )
{
  var pitchmat = new CanvasMatrix4();
  pitchmat.rotate( relativeRotation[0], 1, 0, 0 );
  var yawmat = new CanvasMatrix4();
  yawmat.rotate( relativeRotation[1], 0, 1, 0 );
  var rollmat = new CanvasMatrix4();
  rollmat.rotate( relativeRotation[2], 0, 0, 1 );
  this.extrinsic.multRight(pitchmat);
  this.extrinsic.multRight(yawmat);
  this.extrinsic.multRight(rollmat);
}

Camera.prototype.translate = function ( relativeDisplacement )
{
  this.extrinsic.translate( relativeDisplacement[0], relativeDisplacement[1], relativeDisplacement[2]);
}

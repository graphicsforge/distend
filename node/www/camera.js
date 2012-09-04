
function Camera(vfov)
{
  this.vfov = 45;
  if ( vfov!=null )
    this.vfov = vfov;
  this.pixelAspectRatio = 1.0;
  this.frustrumNear = 0.1;
  this.frustrumFar = 100;
  this.extrinsic = new CanvasMatrix4();
  this.rotate([-80, 0, 0]);
  this.extrinsic.translate( 0, 0, -1 );
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

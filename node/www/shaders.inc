<script id="vs-basic" type="x-shader/x-vertex"> 
  attribute vec3 aPos;
  attribute vec3 aNorm;
  attribute vec2 aTexCoord;
  uniform mat4 mvMatrix;
  uniform mat4 prMatrix;
  varying vec2 vTexCoord;
  varying float i;
  const vec4 dirDif = vec4(0., 0., 1., 0.);
//  const vec4 dirHalf = vec4(-.4034, .259, .8776, 0.);
void main(void) {
   vTexCoord = aTexCoord;
   gl_Position = prMatrix * mvMatrix * vec4(aPos, 1.);
   vec4 rotNorm = mvMatrix * vec4(aNorm, .0);
   i = .5*max( 0., dot(rotNorm, dirDif) ) + .6;
//   i += pow( max( 0., dot(rotNorm, dirHalf) ), 40.);
}
</script> 
 
<script id="fs-basic" type="x-shader/x-fragment"> 
#ifdef GL_ES
precision highp float;
#endif
  uniform sampler2D uTexSamp;
  uniform float alpha;
  varying vec2 vTexCoord;
  varying float i;
void main(void) {
   vec4 c = texture2D(uTexSamp, vTexCoord);
   gl_FragColor = vec4(i * c.rgb, alpha);
}
</script> 
let vertexShader = `
attribute vec4 a_Position;
attribute vec3 a_Normal;


uniform mat4 u_Model;
uniform mat4 u_View;
uniform mat4 u_Projection;

varying vec4 v_Color;

void main(){
  v_Color = vec4(abs(a_Normal), 1.0);
  gl_PointSize = 10.0;
  gl_Position = u_Projection * u_View * u_Model * a_Position;
}`;

var fragmentShader = `
precision mediump float;
varying vec4 v_Color;
void main(){
  gl_FragColor = v_Color;
}`;



var createCube = function(gl, program){
  var cube = {
      vertices : new Float32Array([
        // front face
         1,  1,  1,    0,  0,  1,
        -1,  1,  1,    0,  0,  1,
        -1, -1,  1,    0,  0,  1,

         1,  1,  1,    0,  0,  1,
        -1, -1,  1,    0,  0,  1,
         1, -1,  1,    0,  0,  1,

        // right face
         1,  1, -1,    1,  0,  0,
         1,  1,  1,    1,  0,  0,
         1, -1,  1,    1,  0,  0,

         1,  1, -1,    1,  0,  0,
         1, -1,  1,    1,  0,  0,
         1, -1, -1,    1,  0,  0,

        // back face
        -1,  1, -1,    0,  0, -1,
         1,  1, -1,    0,  0, -1,
         1, -1, -1,    0,  0, -1,

        -1,  1, -1,    0,  0, -1,
         1, -1, -1,    0,  0, -1,
        -1, -1, -1,    0,  0, -1,

        // left face
        -1,  1,  1,   -1,  0,  0,
        -1,  1, -1,   -1,  0,  0,
        -1, -1, -1,   -1,  0,  0,

        -1,  1,  1,   -1,  0,  0,
        -1, -1, -1,   -1,  0,  0,
        -1, -1,  1,   -1,  0,  0,

        // top face
         1,  1, -1,    0,  1,  0,
        -1,  1, -1,    0,  1,  0,
        -1,  1,  1,    0,  1,  0,

         1,  1, -1,    0,  1,  0,
        -1,  1,  1,    0,  1,  0,
         1,  1,  1,    0,  1,  0,

        // bottom face
         1, -1,  1,    0, -1,  0,
        -1, -1,  1,    0, -1,  0,
        -1, -1, -1,    0, -1,  0,

         1, -1,  1,    0, -1,  0,
        -1, -1, -1,    0, -1,  0,
         1, -1, -1,    0, -1,  0,

      ]),

      dimensions: 3,
      numVertices : 36 // six faces, two triangles per

    };
  cube.size = cube.vertices.BYTES_PER_ELEMENT;
  cube.vertexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);


  return function(){
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
    // associate it with our position attribute
    gl.vertexAttribPointer(program.a_Position, cube.dimensions, gl.FLOAT, false, cube.size * 6,0);

    // associate it with our normal attribute
    gl.vertexAttribPointer(program.a_Normal, cube.dimensions, gl.FLOAT, false, cube.size * 6, cube.size * 3);

    gl.drawArrays(gl.TRIANGLES, 0, cube.numVertices);
  };
};




var generateSpherePoints = function(steps){
  numSteps = steps; // the number of samples per circle
  var step = 2*Math.PI/numSteps; // angular different beteen samples

  vertices = [];
  indices = [];
  // push north pole since it is only a single point
  vertices.push(0.0);
  vertices.push(1.0);
  vertices.push(0.0);

  // create the points for the sphere
  // t is an angle that sketches out a circle (0 - 2PI)
  // s controls the height and the radius of the circle slices
  // we only need 0 - PI
  // x = cos(t) * sin(s)
  // y = cos(s)
  // z = sin(t) * sin(s)
  for (var s= 1; s < numSteps; s++){
      for (var t = 0; t < numSteps; t++){
          var tAngle = t*step;
          var sAngle = s*step/2;
          vertices.push(Math.cos(tAngle)*Math.sin(sAngle));
          vertices.push(Math.cos(sAngle));
          vertices.push(Math.sin(tAngle)*Math.sin(sAngle));

      }
  }


  // push south pole -- again just a single point
  vertices.push(0.0);
  vertices.push(-1.0);
  vertices.push(0.0);

  //convert to the flat form
  vertices = new Float32Array(vertices);



  // north pole
  // this is going to form a triangle fan with the pole and the first circle slice
  indices.push(0);
  for (var i = 1; i <= numSteps; i++){
      indices.push(i);
  }
  indices.push(1);

  // south pole
  // another triangle fan, we grab the last point and the last circle slice
  indices.push(vertices.length/3 - 1);
  for (var i = 1; i <= numSteps; i++){
      indices.push(vertices.length/3 - 1 - i);
  }
  indices.push(vertices.length/3 - 2);


  // the bands
  // The rest of the skin is made up of triangle strips that connect two neighboring slices
  // the outer loop controls which slice we are on and the inner loop iterates around it

  for (var j = 0; j < numSteps-2; j++){

       for (var i = j*numSteps + 1; i <= (j+1)*numSteps; i++){
          indices.push(i);
          indices.push(i+numSteps);
      }

      // grab the first two points on the slices again to close the loop
      indices.push(j*numSteps +1);
      indices.push(j*numSteps +1 + numSteps);

  }


  // convert to our flat form
  indices = new Uint16Array(indices);

  return {
    vertices: vertices,
    indices: indices,
    steps: steps,
    dimensions: 3,
    size: vertices.BYTES_PER_ELEMENT
  }

};


var createSphere = function(gl, program, steps){
  sphere = generateSpherePoints(steps);

  sphere.vertexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW);

  sphere.indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);


  return function(type){
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexBuffer);
    // associate it with our position attribute
    gl.vertexAttribPointer(program.a_Position, sphere.dimensions, gl.FLOAT, false, 0,0);

    // associate it with our normal attribute
    // since this is a unit sphere, the normals and the position are nthe same thing
    gl.vertexAttribPointer(program.a_Normal, sphere.dimensions, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

    if (type === 'point') {
      // points
      // to just draw the points, we can just tell WebGL to draw all of the vertices
      // as points - no index array needed
       gl.drawArrays(gl.POINTS, 0, sphere.vertices.length/3);


    }else{
      // the skin
      var offset = 0; // keep track of how far into the index list we are
      // draw the north pole traignel fan
      gl.drawElements(gl.TRIANGLE_FAN, sphere.steps + 2, gl.UNSIGNED_SHORT,0);
      offset = (sphere.steps+2) * sphere.indices.BYTES_PER_ELEMENT;

      // draw the second triangle fan for the south pole
      gl.drawElements(gl.TRIANGLE_FAN, sphere.steps + 2, gl.UNSIGNED_SHORT,offset);
      offset+=(sphere.steps + 2) * sphere.indices.BYTES_PER_ELEMENT;


      // loop through the bands
      for (var i = 0; i < sphere.steps-2; i++){
          gl.drawElements(gl.TRIANGLE_STRIP, sphere.steps * 2 + 2, gl.UNSIGNED_SHORT,offset);
          offset += (sphere.steps * 2 + 2) * sphere.indices.BYTES_PER_ELEMENT;
      }
    }
  };
};


window.onload = function(){
  let canvas = document.getElementById('canvas');
  let gl;
  // catch the error from creating the context since this has nothing to do with the code
  try{
    gl = middUtils.initializeGL(canvas);
  } catch (e){
    alert('Could not create WebGL context');
    return;
  }

  // don't catch this error since any problem here is a programmer error
  let program = middUtils.initializeProgram(gl, vertexShader, fragmentShader);

  // load referneces to the vertex attributes as properties of the program
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  if (program.a_Position < 0) {
      console.log('Failed to get storage location');
      return -1;
  }
  gl.enableVertexAttribArray(program.a_Position);

 // specify the association between the VBO and the a_Normal attribute
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  if (program.a_Normal < 0) {
      console.log('Failed to get storage location');
      return -1;
  }
  gl.enableVertexAttribArray(program.a_Normal);


  // get uniform locations
  let u_Model = gl.getUniformLocation(program, 'u_Model');
  let u_View = gl.getUniformLocation(program, 'u_View');
  let u_Projection = gl.getUniformLocation(program, 'u_Projection');

  // set up the view
  let view = mat4.create();

  let eye = vec3.fromValues(0, 3, 7);
  let up = vec3.fromValues(0,1,0);
  let at = vec3.fromValues(0,0,0);

  mat4.lookAt(view, eye, at, up);
  gl.uniformMatrix4fv(u_View, false, view);

  // set up the projection
  let projection = mat4.create();
  mat4.perspective(projection, Math.PI/6, canvas.width / canvas.height, 0.5, 10.0);
  gl.uniformMatrix4fv(u_Projection, false, projection);



  let drawCube = createCube(gl, program);
  let drawSphere = createSphere(gl, program, 20);

  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0,0,0,1);

  let last;
  let transform = mat4.create();

  let render = (now)=> {

    // find the new angle based on the elapsed time
    if (now && last){
      var elapsed = now -last;
      mat4.rotateY(transform, transform, (Math.PI/4) * elapsed/1000);
    }
    last = now;

    gl.uniformMatrix4fv(u_Model, false, transform);

    // clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawCube();
    //drawSphere('point');
    requestAnimationFrame(render);
  };

  render();


};

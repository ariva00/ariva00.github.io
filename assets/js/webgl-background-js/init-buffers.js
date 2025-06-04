import { parseOBJ } from "./io.js";

function initBuffers(gl, obj) {
  let data = parseOBJ(obj, true)
  console.log(data)

  const positionBuffer = initPositionBuffer(gl, data.positions);

  //const colorBuffer = initColorBuffer(gl, colors);

  const baricentricCoordinatesBuffer = initBaricentricCoordinatesBuffer(gl, data.positions)

  const indexBuffer = initIndexBuffer(gl, data.indices);

  return {
    position: positionBuffer,
    //color: colorBuffer,
    baricentricCoordinates: baricentricCoordinatesBuffer,
    indices: indexBuffer,
    indicesLength: data.indices.length
  };
}

function initPositionBuffer(gl, positions) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function initBaricentricCoordinatesBuffer(gl, positions) {
  const baricentricCoordsBuffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, baricentricCoordsBuffer)

  var bcoord=[]
  for(var i = 0; i<positions.length / 9; i++) {
    bcoord=bcoord.concat([
      0.0, 0.0, 1.0, // First vertex
      0.0, 1.0, 0.0, // Second vertex
      1.0, 0.0, 0.0, // Third vertex
    ])
  }
  bcoord = bcoord.flat()

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bcoord), gl.STATIC_DRAW)
  return baricentricCoordsBuffer
}

function initColorBuffer(gl) {
  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // Front face: white
    [1.0, 0.0, 0.0, 1.0], // Back face: red
    [0.0, 1.0, 0.0, 1.0], // Top face: green
    [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // Right face: yellow
    [1.0, 0.0, 1.0, 1.0], // Left face: purple
  ];

  // Convert the array of colors into a table for all the vertices.

  var colors = [];

  for (var j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];
    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
}

function initIndexBuffer(gl, indices) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  indexBuffer.length = indices.length;

  return indexBuffer;
}

export { initBuffers };

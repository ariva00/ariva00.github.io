import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

import "https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js"

let deltaTime = 0;
let rotating = true;
let rotation = mat4.create();
let translation = mat4.create();
let transform = mat4.create();
let translation_vec = vec3.fromValues((Math.random() - 0.5)*0.01, (Math.random() - 0.5)*0.01, (Math.random() - 0.5)*0.01);
let pos_x = 0;
let pos_y = 0;

//
// start here
//
function background3D(obj, color) {
  const canvas = document.getElementById("webgl-background-js")
  canvas.style.opacity = color[3] //TODO: understand why alpha in glFragColor is not enough
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight

  document.addEventListener("mousemove", (event)=>{
    console.log(event.pageX)
    pos_x = event.clientX
    pos_y = event.clientY
    let width = document.body.clientWidth
    let height = document.body.clientHeight
    pos_x = (pos_x - (width/2))/(width/2)
    pos_y = (pos_y - (height/2))/(height/2)
    console.log(pos_x)
    console.log(rotation)

  })

  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    return;
  }

  // Set clear color to black, fully transparent
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aBaricentricCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec3 vBaricentricCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vBaricentricCoord = aBaricentricCoord;
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying lowp vec3 vBaricentricCoord;
    uniform lowp vec4 uWireframeColor;

    void main(void) {
      gl_FragColor = float((vBaricentricCoord[0] < 0.01) || (vBaricentricCoord[1] < 0.01) || (vBaricentricCoord[2] < 0.01))*uWireframeColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      //vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      baricentricPosition: gl.getAttribLocation(shaderProgram, "aBaricentricCoord")
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      wireframeColor: gl.getUniformLocation(shaderProgram, "uWireframeColor"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl, obj);

  let then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    mat4.rotateY(rotation, rotation, deltaTime * pos_x/2)
    vec3.rotateX(translation_vec, translation_vec, vec3.fromValues(0,0,0), deltaTime * (Math.random() - 0.5))
    vec3.rotateY(translation_vec, translation_vec, vec3.fromValues(0,0,0), deltaTime * (Math.random() - 0.5))
    vec3.rotateZ(translation_vec, translation_vec, vec3.fromValues(0,0,0), deltaTime * (Math.random() - 0.5))

    mat4.translate(translation, translation, translation_vec)
    mat4.multiply(transform, translation, rotation)

    if(Math.random()>0.99) {
      translation_vec = vec3.fromValues((Math.random() - 0.5)*0.01, (Math.random() - 0.5)*0.01, (Math.random() - 0.5)*0.01);
    }


    drawScene(gl, programInfo, buffers, transform, color);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export { background3D }
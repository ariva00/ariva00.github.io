import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

import "https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js"

//
// start here
//
class background3D {

  #deltaTime = 0;
  #rotation = mat4.create();
  #translation = mat4.create();
  #transform = mat4.create();
  #translation_vec = vec3.fromValues((Math.random() - 0.5)*0.01, (Math.random() - 0.5)*0.01, (Math.random() - 0.5)*0.01);
  #pos_x = 0;
  #pos_y = 0;
  canvas = null;
  color = null;
  threshold = null;
  #then = 0;
  #gl = null;
  #shaderProgram = null;

  setTheme = (theme) => {}

      // Vertex shader program

  #vsSource = `
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

  #fsSource = `
      varying lowp vec3 vBaricentricCoord;
      uniform lowp vec4 uWireframeColor;
      uniform lowp float uWireframeThreshold;

      void main(void) {
        gl_FragColor = float((vBaricentricCoord[0] < uWireframeThreshold) || (vBaricentricCoord[1] < uWireframeThreshold) || (vBaricentricCoord[2] < uWireframeThreshold))*uWireframeColor;
      }
    `;

  loadShader(type, source) {
    const gl = this.#gl
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

  initCanvas() {
    this.canvas.width = this.canvas.clientWidth
    this.canvas.height = this.canvas.clientHeight

    // Initialize the GL context
    this.#gl = this.canvas.getContext("webgl");
    const gl = this.#gl;

    // Only continue if WebGL is available and working
    if (gl === null) {
      return;
    }

    // Set clear color to black, fully transparent
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.CULL_FACE)

  }

  initShaderProgram() {
    const gl = this.#gl
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, this.#vsSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, this.#fsSource);

    // Create the shader program

    this.#shaderProgram = gl.createProgram();
    gl.attachShader(this.#shaderProgram, vertexShader);
    gl.attachShader(this.#shaderProgram, fragmentShader);
    gl.linkProgram(this.#shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(this.#shaderProgram, gl.LINK_STATUS)) {
      this.#shaderProgram = null
    }
  }

  constructor(obj, canvas, color = [1.0, 1.0, 1.0, 0.5], threshold = 0.01, context) {
    this.canvas = canvas
    if (!context) {
      context = canvas
    }
    context.background3DObject = this

    this.color = color
    this.threshold = threshold
    //this.canvas.style.opacity = this.color[3] //TODO: understand why alpha in glFragColor is not enough
    window.addEventListener("resize", (event) => {
      this.initCanvas()
      this.initShaderProgram()
    })
    this.initCanvas()
    this.initShaderProgram()
    const gl = this.#gl

    document.addEventListener("mousemove", (event)=>{
      console.log(event.pageX)
      this.#pos_x = event.clientX
      this.#pos_y = event.clientY
      let width = this.canvas.clientWidth
      let height = this.canvas.clientHeight
      this.#pos_x = (this.#pos_x - (width/2))/(width/2)
      this.#pos_y = (this.#pos_y - (height/2))/(height/2)
    })

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVertexColor and also
    // look up uniform locations.
    const programInfo = {
      program: this.#shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(this.#shaderProgram, "aVertexPosition"),
        //vertexColor: gl.getAttribLocation(this.#shaderProgram, "aVertexColor"),
        baricentricPosition: gl.getAttribLocation(this.#shaderProgram, "aBaricentricCoord")
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(
          this.#shaderProgram,
          "uProjectionMatrix"
        ),
        modelViewMatrix: gl.getUniformLocation(this.#shaderProgram, "uModelViewMatrix"),
        wireframeColor: gl.getUniformLocation(this.#shaderProgram, "uWireframeColor"),
        wireframeThreshold: gl.getUniformLocation(this.#shaderProgram, "uWireframeThreshold"),
      },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl, obj);

    this.#then = 0;

    // Draw the scene repeatedly
    
    requestAnimationFrame((now) => this.#render(now, programInfo, buffers));
  }

  #render(now, programInfo, buffers) {
    now *= 0.001; // convert to seconds
    this.#deltaTime = now - this.#then;
    this.#then = now;

    mat4.rotateY(this.#rotation, this.#rotation, this.#deltaTime * this.#pos_x/2)
    vec3.rotateX(this.#translation_vec, this.#translation_vec, vec3.fromValues(0,0,0), this.#deltaTime * (Math.random() - 0.5))
    vec3.rotateY(this.#translation_vec, this.#translation_vec, vec3.fromValues(0,0,0), this.#deltaTime * (Math.random() - 0.5))
    vec3.rotateZ(this.#translation_vec, this.#translation_vec, vec3.fromValues(0,0,0), this.#deltaTime * (Math.random() - 0.5))

    mat4.translate(this.#translation, this.#translation, this.#translation_vec)
    mat4.multiply(this.#transform, this.#translation, this.#rotation)

    if(Math.random()>0.99) {
      this.#translation_vec = vec3.fromValues((Math.random() - 0.5)*0.01, (Math.random() - 0.5)*0.01, (Math.random() - 0.5)*0.01);
    }

    drawScene(this.#gl, programInfo, buffers, this.#transform, this.color, this.threshold);

    requestAnimationFrame((now) => this.#render(now, programInfo, buffers));
  }
}

export { background3D }
const vertex = `
        attribute vec4 a_position;
        uniform vec2 u_resolution;
        varying vec4 v_color;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main(){
            // 从像素坐标转换到 0.0 到 1.0
            vec2 zeroToOne = a_position.xy / u_resolution;

            // 从 0->1 转换到 0->2
            vec2 zeroToTwo = zeroToOne * 2.0;

            // 从 0->2 转换到 -1->+1 (裁剪空间)
            vec2 clipSpace = zeroToTwo - 1.0;

            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            v_color = gl_Position + 0.2;
            v_texCoord = a_texCoord;
        }`;
const fragment = `
        precision mediump float;
        varying vec4 v_color;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;
        void main() {
          gl_FragColor = texture2D(u_image,v_texCoord); 
        }
        `;
function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.error("Shader compilation failed:", gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertex: WebGLShader,
  fragment: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) {
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.error("Program linking failed:", gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}
function activeLocation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  position: string
) {
  const positionAttributeLocation = gl.getAttribLocation(program, position);
  gl.enableVertexAttribArray(positionAttributeLocation);
  return positionAttributeLocation;
}

function main(img: HTMLImageElement): void {
  console.log(img);
  const canvas = document.querySelector<HTMLCanvasElement>("#c");
  if (!canvas) {
    alert("Canvas element not found");
    return;
  }

  const gl = canvas.getContext("webgl");
  if (!gl) {
    alert("你不能使用 WebGL");
    return;
  }

  const vertexShaderSource = vertex || "";
  const fragmentShaderSource = fragment || "";

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  if (!vertexShader || !fragmentShader) {
    return;
  }

  const program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) {
    return;
  }

  // 设置位置属性
  let positionAttributeLocation = activeLocation(gl, program, "a_position");
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  let positions = [
    // left column
    0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

    // top rung
    30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

    // middle rung
    30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // 设置纹理坐标
  var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
  var texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

  // 为F形状的每个顶点设置纹理坐标（0-1范围）
  var texCoords = [
    // left column
    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,
    // top rung
    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,
    // middle rung
    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 设置参数，让我们可以绘制任何尺寸的图像
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // 将图像上传到纹理
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  // 设置分辨率 uniform
  const resolutionUniformLocation = gl.getUniformLocation(
    program,
    "u_resolution"
  );
  gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

  // 绘制
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 18;
  gl.drawArrays(primitiveType, offset, count);
}

function requestImage() {
  let image = new Image();
  image.src = "http://127.0.0.1:8080/image/index.jpeg";
  if (image) {
    image.onload = function () {
      main(image);
    };
  }
}
requestImage();

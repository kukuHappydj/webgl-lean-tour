const vertex = `
        attribute vec4 a_position;
        uniform vec2 u_resolution;
        varying vec4 v_color;
        void main(){
            // 从像素坐标转换到 0.0 到 1.0
            vec2 zeroToOne = a_position.xy / u_resolution;

            // 从 0->1 转换到 0->2
            vec2 zeroToTwo = zeroToOne * 2.0;

            // 从 0->2 转换到 -1->+1 (裁剪空间)
            vec2 clipSpace = zeroToTwo - 1.0;

            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            v_color = gl_Position + 0.2;
        }`;
const fragment = `
        precision mediump float;
        varying vec4 v_color;
        void main() {
          gl_FragColor = v_color; 
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

function main(): void {
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

  let positionAttributeLocation = activeLocation(gl, program, "a_position");

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // 三个二维点坐标
  // var positions = [0, 0, -1, 0.5, 1, 0];
  let positions = [
    // left column
    0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

    // top rung
    30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

    // middle rung
    30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

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

  // 告诉属性如何从 positionBuffer（ARRAY_BUFFER）中读取数据
  var size = 2; // 每次迭代读取 2 个分量
  var type = gl.FLOAT; // 数据类型是 32 位浮点数
  var normalize = false; // 不对数据进行归一化
  var stride = 0; // 0 = 每次迭代向前移动 size * sizeof(type) 个字节来获取下一个位置
  var offset = 0; // 从缓冲区的起始位置开始读取
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 18;
  gl.drawArrays(primitiveType, offset, 18);

  // const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // const positionBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // // 三个二维点坐标
  // const positions = [0, 0, 0, 0.5, 0.7, 0];
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // // 调整画布大小
  // canvas.width = canvas.clientWidth;
  // canvas.height = canvas.clientHeight;

  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // // 清空画布
  // gl.clearColor(0, 0, 0, 0);
  // gl.clear(gl.COLOR_BUFFER_BIT);

  // // 使用程序
  // gl.useProgram(program);

  // // 启用属性
  // gl.enableVertexAttribArray(positionAttributeLocation);

  // // 绑定缓冲区
  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // // 告诉属性如何从 positionBuffer 中读取数据
  // const size = 2;          // 每次迭代运行提取两个单位数据
  // const type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
  // const normalize = false; // 不需要归一化数据
  // const stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
  // const offset = 0;        // 从缓冲起始位置开始读取
  // gl.vertexAttribPointer(
  //   positionAttributeLocation,
  //   size,
  //   type,
  //   normalize,
  //   stride,
  //   offset
  // );

  // // 绘制
  // const primitiveType = gl.TRIANGLES;
  // const drawOffset = 0;
  // const count = 3;
  // gl.drawArrays(primitiveType, drawOffset, count);
}

main();

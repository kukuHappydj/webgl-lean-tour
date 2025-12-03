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

  const vertexShaderElement = document.querySelector("#vertex-shader-2d");
  const fragmentShaderElement = document.querySelector("#fragment-shader-2d");

  if (!vertexShaderElement || !fragmentShaderElement) {
    alert("Shader scripts not found");
    return;
  }

  const vertexShaderSource = vertexShaderElement.textContent || "";
  const fragmentShaderSource = fragmentShaderElement.textContent || "";

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
  var positions = [0, 0, -1, 0.5, 1, 0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );


    // // Compute the matrix
    // var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    // matrix = m3.translate(matrix, translation[0], translation[1]);
    // matrix = m3.rotate(matrix, angleInRadians);
    // matrix = m3.scale(matrix, scale[0], scale[1]);
    // gl.uniformMatrix3fv(matrixLocation, false, matrix);

  // Draw the geometry.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 3;
  gl.drawArrays(primitiveType, offset, count);

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

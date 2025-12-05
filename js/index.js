"use strict";
// 顶点着色器代码
const vertexShaderSource = `
attribute vec4 a_position;
uniform mat4 u_matrix;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
}
`;
// 片段着色器代码
const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
`;
// 4x4 矩阵工具函数
const m4 = {
    // 创建投影矩阵
    projection: function (width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 2 / depth, 0,
            -1, 1, 0, 1,
        ];
    },
    // 矩阵相乘
    multiply: function (a, b) {
        const a00 = a[0 * 4 + 0];
        const a01 = a[0 * 4 + 1];
        const a02 = a[0 * 4 + 2];
        const a03 = a[0 * 4 + 3];
        const a10 = a[1 * 4 + 0];
        const a11 = a[1 * 4 + 1];
        const a12 = a[1 * 4 + 2];
        const a13 = a[1 * 4 + 3];
        const a20 = a[2 * 4 + 0];
        const a21 = a[2 * 4 + 1];
        const a22 = a[2 * 4 + 2];
        const a23 = a[2 * 4 + 3];
        const a30 = a[3 * 4 + 0];
        const a31 = a[3 * 4 + 1];
        const a32 = a[3 * 4 + 2];
        const a33 = a[3 * 4 + 3];
        const b00 = b[0 * 4 + 0];
        const b01 = b[0 * 4 + 1];
        const b02 = b[0 * 4 + 2];
        const b03 = b[0 * 4 + 3];
        const b10 = b[1 * 4 + 0];
        const b11 = b[1 * 4 + 1];
        const b12 = b[1 * 4 + 2];
        const b13 = b[1 * 4 + 3];
        const b20 = b[2 * 4 + 0];
        const b21 = b[2 * 4 + 1];
        const b22 = b[2 * 4 + 2];
        const b23 = b[2 * 4 + 3];
        const b30 = b[3 * 4 + 0];
        const b31 = b[3 * 4 + 1];
        const b32 = b[3 * 4 + 2];
        const b33 = b[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    },
    // 创建平移矩阵
    translation: function (tx, ty, tz) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1,
        ];
    },
    // 创建X轴旋转矩阵
    xRotation: function (angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ];
    },
    // 创建Y轴旋转矩阵
    yRotation: function (angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ];
    },
    // 创建Z轴旋转矩阵
    zRotation: function (angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    },
    // 创建缩放矩阵
    scaling: function (sx, sy, sz) {
        return [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ];
    },
    // 应用平移
    translate: function (m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    },
    // 应用X轴旋转
    xRotate: function (m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
    },
    // 应用Y轴旋转
    yRotate: function (m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
    },
    // 应用Z轴旋转
    zRotate: function (m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
    },
    // 应用缩放
    scale: function (m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
    },
};
// 工具函数：角度转弧度
function radToDeg(r) {
    return (r * 180) / Math.PI;
}
function degToRad(d) {
    return (d * Math.PI) / 180;
}
// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        // left column
        0, 0, 0,
        30, 0, 0,
        0, 150, 0,
        0, 150, 0,
        30, 0, 0,
        30, 150, 0,
        // top rung
        30, 0, 0,
        100, 0, 0,
        30, 30, 0,
        30, 30, 0,
        100, 0, 0,
        100, 30, 0,
        // middle rung
        30, 60, 0,
        67, 60, 0,
        30, 90, 0,
        30, 90, 0,
        67, 60, 0,
        67, 90, 0
    ]), gl.STATIC_DRAW);
}
// 主函数
function main() {
    // Get A WebGL context
    const canvas = document.querySelector("#canvas");
    if (!canvas) {
        console.error("Canvas element not found");
        return;
    }
    const gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("WebGL not supported");
        return;
    }
    // setup GLSL program
    const program = webglUtils.createProgramFromSources(gl, [
        vertexShaderSource,
        fragmentShaderSource
    ]);
    if (!program) {
        console.error("Failed to create program");
        return;
    }
    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, "a_position");
    // lookup uniforms
    const colorLocation = gl.getUniformLocation(program, "u_color");
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");
    // Create a buffer to put positions in
    const positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put geometry data into buffer
    setGeometry(gl);
    const translation = [45, 150, 0];
    const rotation = [
        degToRad(40),
        degToRad(25),
        degToRad(325)
    ];
    const scale = [1, 1, 1];
    const color = [
        Math.random(),
        Math.random(),
        Math.random(),
        1
    ];
    drawScene();
    // Setup a ui.
    webglLessonsUI.setupSlider("#x", {
        value: translation[0],
        slide: updatePosition(0),
        max: gl.canvas.width
    });
    webglLessonsUI.setupSlider("#y", {
        value: translation[1],
        slide: updatePosition(1),
        max: gl.canvas.height
    });
    webglLessonsUI.setupSlider("#z", {
        value: translation[2],
        slide: updatePosition(2),
        max: gl.canvas.height
    });
    webglLessonsUI.setupSlider("#angleX", {
        value: radToDeg(rotation[0]),
        slide: updateRotation(0),
        max: 360
    });
    webglLessonsUI.setupSlider("#angleY", {
        value: radToDeg(rotation[1]),
        slide: updateRotation(1),
        max: 360
    });
    webglLessonsUI.setupSlider("#angleZ", {
        value: radToDeg(rotation[2]),
        slide: updateRotation(2),
        max: 360
    });
    webglLessonsUI.setupSlider("#scaleX", {
        value: scale[0],
        slide: updateScale(0),
        min: -5,
        max: 5,
        step: 0.01,
        precision: 2
    });
    webglLessonsUI.setupSlider("#scaleY", {
        value: scale[1],
        slide: updateScale(1),
        min: -5,
        max: 5,
        step: 0.01,
        precision: 2
    });
    webglLessonsUI.setupSlider("#scaleZ", {
        value: scale[2],
        slide: updateScale(2),
        min: -5,
        max: 5,
        step: 0.01,
        precision: 2
    });
    function updatePosition(index) {
        return function (_event, ui) {
            translation[index] = ui.value;
            drawScene();
        };
    }
    function updateRotation(index) {
        return function (_event, ui) {
            const angleInDegrees = ui.value;
            const angleInRadians = (angleInDegrees * Math.PI) / 180;
            rotation[index] = angleInRadians;
            drawScene();
        };
    }
    function updateScale(index) {
        return function (_event, ui) {
            scale[index] = ui.value;
            drawScene();
        };
    }
    // Draw the scene.
    function drawScene() {
        // TypeScript needs reassurance that these are not null
        if (!canvas || !gl)
            return;
        webglUtils.resizeCanvasToDisplaySize(canvas);
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, canvas.width, canvas.height);
        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT);
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);
        // Turn on the attribute
        gl.enableVertexAttribArray(positionLocation);
        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 3; // 3 components per iteration
        const type = gl.FLOAT; // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);
        // set the color
        gl.uniform4fv(colorLocation, color);
        // Compute the matrices
        let matrix = m4.projection(canvas.clientWidth, canvas.clientHeight, 400);
        matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
        matrix = m4.xRotate(matrix, rotation[0]);
        matrix = m4.yRotate(matrix, rotation[1]);
        matrix = m4.zRotate(matrix, rotation[2]);
        matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, new Float32Array(matrix));
        // Draw the geometry.
        const primitiveType = gl.TRIANGLES;
        const drawOffset = 0;
        const count = 18; // 6 triangles in the 'F', 3 points per triangle
        gl.drawArrays(primitiveType, drawOffset, count);
    }
}
// 页面加载后启动
main();
//# sourceMappingURL=index.js.map
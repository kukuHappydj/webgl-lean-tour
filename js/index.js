"use strict";
const vertex = `
        attribute vec4 a_position;
        attribute vec2 a_translation;
        attribute vec2 a_scale;
        attribute float a_rotation;
        uniform vec2 u_resolution;
        varying vec4 v_color;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main(){
            // 1. 先应用缩放
            vec2 scaledPosition = a_position.xy * a_scale;

            // 2. 然后应用旋转
            float cosAngle = cos(a_rotation);
            float sinAngle = sin(a_rotation);
            vec2 rotatedPosition = vec2(
                scaledPosition.x * cosAngle - scaledPosition.y * sinAngle,
                scaledPosition.x * sinAngle + scaledPosition.y * cosAngle
            );

            // 3. 最后应用平移
            vec2 transformedPosition = rotatedPosition + a_translation;

            // 从像素坐标转换到 0.0 到 1.0
            vec2 zeroToOne = transformedPosition / u_resolution;

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
function createShader(gl, type, source) {
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
function createProgram(gl, vertex, fragment) {
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
function activeLocation(gl, program, position) {
    const positionAttributeLocation = gl.getAttribLocation(program, position);
    gl.enableVertexAttribArray(positionAttributeLocation);
    return positionAttributeLocation;
}
function createAndSetupTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 设置材质，这样我们可以对任意大小的图像进行像素操作
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
}
// 创建2D平移矩阵 (3x3)
function translate(tx, ty) {
    return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1
    ];
}
// 创建2D旋转矩阵 (3x3)
// angle 单位为弧度
function rotate(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
        c, s, 0,
        -s, c, 0,
        0, 0, 1
    ];
}
// 创建2D缩放矩阵 (3x3)
function scale(sx, sy) {
    return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1
    ];
}
function main(img) {
    console.log(img);
    const canvas = document.querySelector("#c");
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
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) {
        return;
    }
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
        return;
    }
    // 设置位置属性
    // let positionAttributeLocation = activeLocation(gl, program, "a_position");
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
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
    gl.enableVertexAttribArray(positionAttributeLocation);
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
    // 设置平移 attribute
    var translationLocation = gl.getAttribLocation(program, "a_translation");
    var translationBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
    // 为每个顶点设置相同的平移量 (例如: x平移100像素, y平移50像素)
    var translations = new Array(18 * 2).fill(0).map((_, i) => {
        return i % 2 === 0 ? 100 : 0; // x: 100, y: 50
    });
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(translations), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(translationLocation);
    gl.vertexAttribPointer(translationLocation, 2, gl.FLOAT, false, 0, 0);
    // 设置缩放 attribute
    var scaleLocation = gl.getAttribLocation(program, "a_scale");
    var scaleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, scaleBuffer);
    // 为每个顶点设置相同的缩放量 (例如: x缩放1.5倍, y缩放1.5倍)
    var scales = new Array(18 * 2).fill(0).map((_, i) => {
        return i % 2 === 0 ? 1 : 1; // x: 1.5, y: 1.5
    });
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scales), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(scaleLocation);
    gl.vertexAttribPointer(scaleLocation, 2, gl.FLOAT, false, 0, 0);
    // 设置旋转 attribute
    var rotationLocation = gl.getAttribLocation(program, "a_rotation");
    var rotationBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rotationBuffer);
    // 为每个顶点设置相同的旋转角度 (例如: 旋转45度 = Math.PI / 4 弧度)
    var rotations = new Array(18).fill(0); // 45度
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rotations), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(rotationLocation);
    gl.vertexAttribPointer(rotationLocation, 1, gl.FLOAT, false, 0, 0);
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
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    // 绘制
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
}
function requestImage() {
    let image = new Image();
    image.src = "http://127.0.0.1:8082/image/index.jpeg";
    if (image) {
        image.onload = function () {
            main(image);
        };
    }
}
requestImage();
//# sourceMappingURL=index.js.map
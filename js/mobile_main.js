// Author: Matthew Anderson
// CSC 385 Computer Graphics
// Version: Winter 2018

// This is the main JS file.
window.onload = init;

let mobile = null, canvas, gl;

let camera_mode = 0;
let camera_pos = vec3(0, -4, 8);
let cameraNormal = vec4(0, 0, -1, 0);
let keys = new Set();
let step = 0.2;

// Renders the frame.
function render() {
    setTimeout(function () {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        fly();
        mobile.evolve(1);
        mobile.render();

        requestAnimFrame(render);
    }, 10);

}

// Handles click on drawing mode menu.
// Resets object points if mode changes.
function view_mode_listener() {
    if (this.selectedIndex === DRAW_FILL) {
        mobile.set_draw_filled()
    } else {
        mobile.set_draw_wireframe()
    }
}


function camera_mode_listener() {
    let camera = document.getElementById("CameraMode");
    let pendant = document.getElementById("PendantIndex");
    camera_mode = camera.selectedIndex;
    if (camera_mode === CAMERA_FREE) {
        mobile.set_proj_ortho(-8, 8, -8, 8, -8, 8);
        mobile.set_camera_free(vec3(3, -8, 3), vec3(0, 1, 0), vec3(3, -1, 3));
    } else if (camera_mode === CAMERA_TRACKING) {
        if (pendant.value) {
            mobile.set_proj_ortho(-8, 8, -8, 8, -8, 8);
            mobile.set_camera_tracking(vec3(3, -1, 3), vec3(0, 1, 0), pendant.value);
        }
    } else if (camera_mode === CAMERA_FIXED) {
        if (pendant.value) {
            mobile.set_proj_perspective(90, 1, 2, -4);
            let dist = document.getElementById("Dist");
            mobile.set_camera_fixed(vec3(3, -1, 3), vec3(0, 1, 0), pendant.value, dist.value)
        }
    } else if (camera_mode === CAMERA_FLY) {
        keys.clear();
        mobile.set_proj_perspective(90, 1, 2, -4);
        camera_pos = vec3(0, -4, 8);
        cameraNormal = vec4(0, 0, -1, 0);
        mobile.set_camera_free(camera_pos, vec3(0, 1, 0), vec3(cameraNormal));
    }
}

function key_press_listener(event) {
    if (camera_mode === CAMERA_FLY) {
        if (!keys.has(event.key)) {
            keys.add(event.key);
        }
    }
}

function key_up_listener() {
    if (camera_mode === CAMERA_FLY) {
        if (keys.has(event.key)) {
            keys.delete(event.key);
        }
    }
}

function fly() {
    if (camera_mode === CAMERA_FLY) {
        for (let key of keys) {
            if (key === "w") camera_pos = add(camera_pos, vec3(0, 0, -step));
            if (key === "s") camera_pos = add(camera_pos, vec3(0, 0, step));
            if (key === "a") camera_pos = add(camera_pos, vec3(-step, 0, 0));
            if (key === "d") camera_pos = add(camera_pos, vec3(step, 0, 0));
            if (key === "e") camera_pos = add(camera_pos, vec3(0, -step, 0));
            if (key === "q") camera_pos = add(camera_pos, vec3(0, step, 0));
            if (key === 'i') cameraNormal = mult(rotateX(1), cameraNormal);
            if (key === 'j') cameraNormal = mult(rotateY(1), cameraNormal);
            if (key === 'k') cameraNormal = mult(rotateX(-1), cameraNormal);
            if (key === 'l') cameraNormal = mult(rotateY(-1), cameraNormal);
        }
        mobile.set_camera_free(camera_pos, vec3(0, 1, 0), vec3(cameraNormal));
    }
}

// Install event listeners for UI elements.
function init_listeners() {
    let view_menu = document.getElementById("ViewMode");
    view_menu.addEventListener("click", view_mode_listener);
    let camera = document.getElementById("CameraMode");

    camera.addEventListener("click", camera_mode_listener);
    let pendant = document.getElementById("PendantIndex");
    pendant.oninput = camera_mode_listener;

    let dist = document.getElementById("Dist");
    dist.onchange = camera_mode_listener;

    document.addEventListener('keydown', key_press_listener);
    document.addEventListener('keyup', key_up_listener);
}


function init() {
    // Initialize WebGL.
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Initialize shaders and attribute pointers.
    const program = initShaders(gl, "vertex-shader", "fragment-shader");

    // Initialize event listeners for UI changes.
    init_listeners();

    mobile = new Mobile(vec4(0, 0, 0, 1), gl, program);
    mobile.set_camera_free(vec3(3, -8, 3), vec3(0, 1, 0), vec3(3, -1, 3));
    mobile.set_proj_ortho(-8, 8, -8, 8, -8, 8);

    // Start rendering.
    render();
}



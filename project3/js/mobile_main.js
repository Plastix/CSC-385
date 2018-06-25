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


function createMesh(gl, program) {

    const SMOOTH_CUBE_MESH = new Mesh(
        [[vec4(-0.275, -0.35, -0.35, 0.9999999999999998), vec4(0.22499999999999998, 0.15, 0.15, 0.9999999999999998)], [vec4(0.3125, -0.3125, -0.3125, 1), vec4(0.8125, 0.1875, 0.1875, 1)], [vec4(0.35, 0.275, -0.35, 0.9999999999999998), vec4(0.8499999999999999, 0.7749999999999999, 0.15, 0.9999999999999998)], [vec4(-0.35, 0.35, -0.275, 0.9999999999999998), vec4(0.15, 0.8499999999999999, 0.22499999999999998, 0.9999999999999998)], [vec4(-0.35, -0.275, 0.35, 0.9999999999999998), vec4(0.15, 0.22499999999999998, 0.8499999999999999, 0.9999999999999998)], [vec4(0.35, -0.35, 0.275, 0.9999999999999998), vec4(0.8499999999999999, 0.15, 0.7749999999999999, 0.9999999999999998)], [vec4(0.275, 0.35, 0.35, 0.9999999999999998), vec4(0.7749999999999999, 0.8499999999999999, 0.8499999999999999, 0.9999999999999998)], [vec4(-0.3125, 0.3125, 0.3125, 1), vec4(0.1875, 0.8125, 0.8125, 1)], [vec4(0, 0, -0.5, 1), vec4(0.5, 0.5, 0, 1)], [vec4(0.375, -0.125, -0.375, 1), vec4(0.875, 0.375, 0.125, 1)], [vec4(0.125, -0.375, -0.375, 1), vec4(0.625, 0.125, 0.125, 1)], [vec4(-0.375, 0, -0.375, 1), vec4(0.125, 0.5, 0.125, 1)], [vec4(0, 0.375, -0.375, 1), vec4(0.5, 0.875, 0.125, 1)], [vec4(0.5, 0, 0, 1), vec4(1, 0.5, 0.5, 1)], [vec4(0.375, -0.375, -0.125, 1), vec4(0.875, 0.125, 0.375, 1)], [vec4(0.375, 0, 0.375, 1), vec4(0.875, 0.5, 0.875, 1)], [vec4(0.375, 0.375, 0, 1), vec4(0.875, 0.875, 0.5, 1)], [vec4(0, 0.5, 0, 1), vec4(0.5, 1, 0.5, 1)], [vec4(-0.375, 0.375, 0.125, 1), vec4(0.125, 0.875, 0.625, 1)], [vec4(-0.125, 0.375, 0.375, 1), vec4(0.375, 0.875, 0.875, 1)], [vec4(-0.375, -0.375, 0, 1), vec4(0.125, 0.125, 0.5, 1)], [vec4(-0.5, 0, 0, 1), vec4(0, 0.5, 0.5, 1)], [vec4(-0.375, 0.125, 0.375, 1), vec4(0.125, 0.625, 0.875, 1)], [vec4(0, -0.5, 0, 1), vec4(0.5, 0, 0.5, 1)], [vec4(0, -0.375, 0.375, 1), vec4(0.5, 0.125, 0.875, 1)], [vec4(0, 0, 0.5, 1), vec4(0.5, 0.5, 1, 1)]],
        [[8, 2, 9], [9, 1, 10], [10, 0, 8], [8, 9, 10], [11, 3, 12], [12, 2, 8], [8, 0, 11], [11, 12, 8], [9, 2, 13], [13, 5, 14], [14, 1, 9], [9, 13, 14], [15, 5, 13], [13, 2, 16], [16, 6, 15], [15, 13, 16], [17, 6, 16], [16, 2, 12], [12, 3, 17], [17, 16, 12], [18, 7, 19], [19, 6, 17], [17, 3, 18], [18, 19, 17], [11, 0, 20], [20, 4, 21], [21, 3, 11], [11, 20, 21], [21, 4, 22], [22, 7, 18], [18, 3, 21], [21, 22, 18], [10, 1, 14], [14, 5, 23], [23, 0, 10], [10, 14, 23], [23, 5, 24], [24, 4, 20], [20, 0, 23], [23, 24, 20], [24, 5, 15], [15, 6, 25], [25, 4, 24], [24, 15, 25], [25, 6, 19], [19, 7, 22], [22, 4, 25], [25, 19, 22]],
        gl, program);

    const STAR_MESH = new Mesh([[vec4(-0.5, -0.5, -0.5, 1), vec4(0, 0, 0, 1)], [vec4(0.5, -0.5, -0.5, 1), vec4(1, 0, 0, 1)], [vec4(0.5, 0.5, -0.5, 1), vec4(1, 1, 0, 1)], [vec4(-0.5, 0.5, -0.5, 1), vec4(0, 1, 0, 1)], [vec4(-0.5, -0.5, 0.5, 1), vec4(0, 0, 1, 1)], [vec4(0.5, -0.5, 0.5, 1), vec4(1, 0, 1, 1)], [vec4(0.5, 0.5, 0.5, 1), vec4(1, 1, 1, 1)], [vec4(-0.5, 0.5, 0.5, 1), vec4(0, 1, 1, 1)], [vec4(0, 0, -0.5, 1), vec4(0.5, 0.5, 0, 1)], [vec4(0.375, -0.125, -0.375, 1), vec4(0.875, 0.375, 0.125, 1)], [vec4(0.125, -0.375, -0.375, 1), vec4(0.625, 0.125, 0.125, 1)], [vec4(-0.375, 0, -0.375, 1), vec4(0.125, 0.5, 0.125, 1)], [vec4(0, 0.375, -0.375, 1), vec4(0.5, 0.875, 0.125, 1)], [vec4(0.5, 0, 0, 1), vec4(1, 0.5, 0.5, 1)], [vec4(0.375, -0.375, -0.125, 1), vec4(0.875, 0.125, 0.375, 1)], [vec4(0.375, 0, 0.375, 1), vec4(0.875, 0.5, 0.875, 1)], [vec4(0.375, 0.375, 0, 1), vec4(0.875, 0.875, 0.5, 1)], [vec4(0, 0.5, 0, 1), vec4(0.5, 1, 0.5, 1)], [vec4(-0.375, 0.375, 0.125, 1), vec4(0.125, 0.875, 0.625, 1)], [vec4(-0.125, 0.375, 0.375, 1), vec4(0.375, 0.875, 0.875, 1)], [vec4(-0.375, -0.375, 0, 1), vec4(0.125, 0.125, 0.5, 1)], [vec4(-0.5, 0, 0, 1), vec4(0, 0.5, 0.5, 1)], [vec4(-0.375, 0.125, 0.375, 1), vec4(0.125, 0.625, 0.875, 1)], [vec4(0, -0.5, 0, 1), vec4(0.5, 0, 0.5, 1)], [vec4(0, -0.375, 0.375, 1), vec4(0.5, 0.125, 0.875, 1)], [vec4(0, 0, 0.5, 1), vec4(0.5, 0.5, 1, 1)]],
        [[8, 2, 9], [9, 1, 10], [10, 0, 8], [8, 9, 10], [11, 3, 12], [12, 2, 8], [8, 0, 11], [11, 12, 8], [9, 2, 13], [13, 5, 14], [14, 1, 9], [9, 13, 14], [15, 5, 13], [13, 2, 16], [16, 6, 15], [15, 13, 16], [17, 6, 16], [16, 2, 12], [12, 3, 17], [17, 16, 12], [18, 7, 19], [19, 6, 17], [17, 3, 18], [18, 19, 17], [11, 0, 20], [20, 4, 21], [21, 3, 11], [11, 20, 21], [21, 4, 22], [22, 7, 18], [18, 3, 21], [21, 22, 18], [10, 1, 14], [14, 5, 23], [23, 0, 10], [10, 14, 23], [23, 5, 24], [24, 4, 20], [20, 0, 23], [23, 24, 20], [24, 5, 15], [15, 6, 25], [25, 4, 24], [24, 15, 25], [25, 6, 19], [19, 7, 22], [22, 4, 25], [25, 19, 22]],
        gl, program);

    const PILLOW_MESH = new Mesh([[vec4(-0.25, -0.5, -0.5, 1), vec4(0.25, 0, 0, 1)], [vec4(0.25, -0.5, -0.5, 1), vec4(0.75, 0, 0, 1)], [vec4(0.25, 0.5, -0.5, 1), vec4(0.75, 1, 0, 1)], [vec4(-0.25, 0.5, -0.5, 1), vec4(0.25, 1, 0, 1)], [vec4(-0.25, -0.5, 0.5, 1), vec4(0.25, 0, 1, 1)], [vec4(0.25, -0.5, 0.5, 1), vec4(0.75, 0, 1, 1)], [vec4(0.25, 0.5, 0.5, 1), vec4(0.75, 1, 1, 1)], [vec4(-0.25, 0.5, 0.5, 1), vec4(0.25, 1, 1, 1)], [vec4(0, 0, -0.5, 1), vec4(0.5, 0.5, 0, 1)], [vec4(0.375, -0.125, -0.375, 1), vec4(0.875, 0.375, 0.125, 1)], [vec4(0, -0.5, -0.5, 1), vec4(0.5, 0, 0, 1)], [vec4(-0.375, 0, -0.375, 1), vec4(0.125, 0.5, 0.125, 1)], [vec4(0, 0.5, -0.5, 1), vec4(0.5, 1, 0, 1)], [vec4(0.5, 0, 0, 1), vec4(1, 0.5, 0.5, 1)], [vec4(0.375, -0.375, -0.125, 1), vec4(0.875, 0.125, 0.375, 1)], [vec4(0.375, 0, 0.375, 1), vec4(0.875, 0.5, 0.875, 1)], [vec4(0.375, 0.375, 0, 1), vec4(0.875, 0.875, 0.5, 1)], [vec4(0, 0.5, 0, 1), vec4(0.5, 1, 0.5, 1)], [vec4(0, 0.5, -0.5, 1), vec4(0.5, 1, 0, 1)], [vec4(-0.375, 0.375, 0.125, 1), vec4(0.125, 0.875, 0.625, 1)], [vec4(0, 0.5, 0.5, 1), vec4(0.5, 1, 1, 1)], [vec4(-0.375, -0.375, 0, 1), vec4(0.125, 0.125, 0.5, 1)], [vec4(-0.5, 0, 0, 1), vec4(0, 0.5, 0.5, 1)], [vec4(-0.375, 0.125, 0.375, 1), vec4(0.125, 0.625, 0.875, 1)], [vec4(0, -0.5, -0.5, 1), vec4(0.5, 0, 0, 1)], [vec4(0, -0.5, 0, 1), vec4(0.5, 0, 0.5, 1)], [vec4(0, -0.5, 0.5, 1), vec4(0.5, 0, 1, 1)], [vec4(0, -0.5, 0.5, 1), vec4(0.5, 0, 1, 1)], [vec4(0, 0, 0.5, 1), vec4(0.5, 0.5, 1, 1)], [vec4(0, 0.5, 0.5, 1), vec4(0.5, 1, 1, 1)]],
        [[8, 2, 9], [9, 1, 10], [10, 0, 8], [8, 9, 10], [11, 3, 12], [12, 2, 8], [8, 0, 11], [11, 12, 8], [9, 2, 13], [13, 5, 14], [14, 1, 9], [9, 13, 14], [15, 5, 13], [13, 2, 16], [16, 6, 15], [15, 13, 16], [17, 6, 16], [16, 2, 18], [18, 3, 17], [17, 16, 18], [19, 7, 20], [20, 6, 17], [17, 3, 19], [19, 20, 17], [11, 0, 21], [21, 4, 22], [22, 3, 11], [11, 21, 22], [22, 4, 23], [23, 7, 19], [19, 3, 22], [22, 23, 19], [24, 1, 14], [14, 5, 25], [25, 0, 24], [24, 14, 25], [25, 5, 26], [26, 4, 21], [21, 0, 25], [25, 26, 21], [27, 5, 15], [15, 6, 28], [28, 4, 27], [27, 15, 28], [28, 6, 29], [29, 7, 23], [23, 4, 28], [28, 29, 23]],
        gl, program);

    mobile = new Mobile(vec4(0, 0, 0, 1), gl, program);
    mobile.set_camera_free(vec3(3, -8, 3), vec3(0, 1, 0), vec3(3, -1, 3));
    mobile.set_proj_ortho(-8, 8, -8, 8, -8, 8);

    let rod1 = mobile.add_rod(null, 4, 2, 0, 0.5, 0, 0.75);
    let rod2 = mobile.add_rod(rod1, 4, 2, 2, 0, 0, -0.5);

    mobile.add_pendant(rod1, 1, 4, 120, 2, PILLOW_MESH, mult(rotateZ(45), mult(rotateX(45), scalem(0.5, 1, 2))));
    mobile.add_pendant(rod2, 2.5, 0, 77, -2.5, STAR_MESH, scalem(2, 2, 2));
    mobile.add_pendant(rod1, 6, 0, 90, 1, SMOOTH_CUBE_MESH, scalem(0.5, 3, 0.5));
    mobile.add_pendant(rod2, 4, 4, 45, 0.5, SMOOTH_CUBE_MESH, scalem(0.5, 1.75, 0.5));

    let rod3 = mobile.add_rod(rod1, 4, 1, 3, 4, 30, 0.5);
    mobile.add_pendant(rod3, 0, 0, -50, 0.5, PILLOW_MESH, rotateX(45));
    mobile.add_pendant(rod3, 5, 4, 270, 0, SMOOTH_CUBE_MESH, scalem(0.5, 5, 0.5));

    let rod4 = mobile.add_rod(rod3, 1.5, 0, 2, 1.75, 20, -2.5);
    mobile.add_pendant(rod4, 1, 0, 0, 0, SMOOTH_CUBE_MESH, rotateX(45));
    mobile.add_pendant(rod4, 1, 1.5, 0, 3, STAR_MESH, rotateX(45));
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

    createMesh(gl, program);

    // Start rendering.
    render();
}



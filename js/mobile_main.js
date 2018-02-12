// Author: Matthew Anderson
// CSC 385 Computer Graphics
// Version: Winter 2018

// This is the main JS file.
window.onload = init;

let mobile = null, canvas, gl;

// Renders the frame.
function render() {
    setTimeout(function () {

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
    if (camera.selectedIndex === CAMERA_FREE) {
        mobile.set_proj_ortho(-8, 8, -8, 8, -8, 8);
        mobile.set_camera_free(vec3(3, -8, 3), vec3(0, 1, 0), vec3(3, -1, 3));
    } else if (camera.selectedIndex === CAMERA_TRACKING) {
        if (pendant.value) {
            mobile.set_proj_ortho(-8, 8, -8, 8, -8, 8);
            mobile.set_camera_tracking(vec3(3, -1, 3), vec3(0, 1, 0), pendant.value);
        }
    } else if (camera.selectedIndex === CAMERA_FIXED) {
        if (pendant.value) {
            mobile.set_proj_perspective(90, 1, 2, -4);
            let dist = document.getElementById("Dist");
            mobile.set_camera_fixed(vec3(3, -1, 3), vec3(0, 1, 0), pendant.value, dist.value)
        }
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



// Author: Matthew Anderson
// CSC 385 Computer Graphics
// Version: Winter 2018
// Project 4: Main class for ray tracer.

// This is the main JS file.
window.onload = init;

// Set the pixel dimensions of the painting area.
// Note: You may want to changes these for more
// detail or better performance when testing.
// You may want to turn these into a UI slider.
// TODO (Aidan) change these back
const PIXEL_WIDTH = 128;
const PIXEL_HEIGHT = 128;

// Size of HTML canvas
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;

// Renders the image.
function render() {
    setTimeout(function () {

        pa.render();

    }, 100);

}

// Callback to clear image.
function clear_screen() {
    pa.clear_pixels();
}

// Callback to start ray tracing.
function start_trace() {
    tracer.ray_trace();
}

// Install event listeners for UI elements.
function init_listeners() {

    // Listen for clicks on erase button to call clear_pixels().
    let erase_button = document.getElementById("EraseButton");
    erase_button.addEventListener("click", clear_screen);

    let render_button = document.getElementById("RenderButton");
    render_button.addEventListener("click", start_trace);

}

function init() {

    // Initialize WebGL.
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Initialize PixelArray and RayTracer
    pa = new PixelArray(PIXEL_WIDTH, PIXEL_HEIGHT, gl);

    // Test pattern to check alignment.
    pa.write_pixel(0, 0, COLOR_RED);
    pa.write_pixel(PIXEL_WIDTH - 1, PIXEL_HEIGHT - 1, COLOR_GREEN);
    pa.write_pixel(0, PIXEL_HEIGHT - 1, COLOR_BLUE);
    pa.write_pixel(PIXEL_WIDTH - 1, 0, COLOR_WHITE);

    // Set up camera positioning
    let eye = vec3(0, 0, 0.5);
    let up = vec3(0, 1, 0);
    let at = vec3(0.5, -0.5, -0.5);

    // TODO (Aidan) add projecton type support
    cam = new Camera(eye, up, at, 2 / PIXEL_WIDTH, 2 / PIXEL_HEIGHT, PROJECTION_ORTHO, 1);

    // Set up scene
    let objs = [];
    let infty = 10000; // Big sphere look flat at surface.
    // Build a "room" using spheres which has 4 walls, ceiling, and floor.
    objs.push(new SphereObject(vec3(0, 0, -infty - 1), infty, scale(0.5, COLOR_GREEN), scale(0.5, COLOR_GREEN), COLOR_BLACK, 0));
    objs.push(new SphereObject(vec3(0, 0, -infty + 1), infty, scale(0.5, COLOR_GREEN), scale(0.5, COLOR_GREEN), COLOR_BLACK, 0));
    objs.push(new SphereObject(vec3(0, -infty - 1, 0), infty, scale(0.5, COLOR_BLUE), scale(0.5, COLOR_BLUE), COLOR_BLACK, 0));
    objs.push(new SphereObject(vec3(0, +infty + 1, 0), infty, scale(0.5, COLOR_BLUE), scale(0.5, COLOR_BLUE), COLOR_BLACK, 0));
    objs.push(new SphereObject(vec3(-infty - 1, 0, 0), infty, scale(0.5, COLOR_RED), scale(0.5, COLOR_RED), COLOR_BLACK, 0));
    objs.push(new SphereObject(vec3(+infty + 1, 0, 0), infty, scale(0.5, COLOR_RED), scale(0.5, COLOR_RED), COLOR_BLACK, 0));
    // Two more spheres sitting on floor in room.
    objs.push(new SphereObject(vec3(0.1, -1 + 0.25, -.7), 0.25, scale(0.5, COLOR_YELLOW), scale(0.1, COLOR_YELLOW), scale(0.4, COLOR_YELLOW), 250));
    // objs.push(new SphereObject(vec3(-0.4, -1 + 0.3, -.4), 0.3, COLOR_WHITE, COLOR_BLACK, COLOR_BLACK, 0));
    objs.push(new SphereObject(vec3(-0.4, -1 + 0.3, -.4), 0.3, scale(0.5, COLOR_WHITE), COLOR_WHITE, COLOR_BLACK, 0));


    // One ambient light.
    let lights = [];
    lights.push(new Light(scale(0.5, COLOR_WHITE), null, AMBIENT_LIGHT));
    lights.push(new Light(COLOR_WHITE, vec3(.1, -1 + 0.25, -0.7), POINT_LIGHT)); // Light inside of sphere
    lights.push(new Light(COLOR_WHITE, vec3(0, 0, 0), POINT_LIGHT));
    lights.push(new Light(COLOR_WHITE, vec3(.1, 0, -.7), POINT_LIGHT));

    // Initialize ray tracer to use the PixelArray, Camera and scene created.
    tracer = new RayTracer(pa, cam, objs, lights, COLOR_BLACK);

    // Initialize event listeners for UI changes.
    init_listeners();

    // Start rendering.
    render();
}

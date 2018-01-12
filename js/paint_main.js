// Author: Matthew Anderson
// CSC 385 Computer Graphics
// Version: Winter 2018

// This is the main JS file.
window.onload = init;

// Set the pixel dimensions of the painting area.
const WIDTH = 20;
const HEIGHT = 20;

// Takes an integer x, 0 <= x < WIDTH, an integer y, 0 <= y < HEIGHT,
// and a color given in RGB as a vec3.  Changes the pixel to that color
// in the paint program. Returns 0 if successful, -1 otherwise.
function write_pixel(x, y, color) {

    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {

        // Update color in our model.
        for (var i = 0; i < 6; i++)
            pixel_colors[6 * pixel_to_ix(x, y) + i] = color;

        // Update color in buffer.
        // Use bufferSubData to only make a partial update.
        // Should perform better then update the entire buffer.
        // Have to compute offset into buffer.
        // 6 vertices per square,
        // 3 color channels per vertex, and
        // 4 bytes per color channel.
        gl.bindBuffer(gl.ARRAY_BUFFER, pixel_color_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 6 * 3 * 4 * pixel_to_ix(x, y), flatten([color, color, color, color, color, color]));
        return 0;
    }
    return -1;

}


// Returns the pixel HEIGHT of the painting area.
function get_height() {

    return HEIGHT;
}

// Returns the pixel WIDTH of the painting area.
function get_width() {

    return WIDTH;

}


// Constants for primary colors.
const COLOR_WHITE = vec3(1.0, 1.0, 1.0);
const COLOR_BLACK = vec3(0.0, 0.0, 0.0);
const COLOR_CYAN = vec3(0.0, 1.0, 1.0);
const COLOR_MAGENTA = vec3(1.0, 0.0, 1.0);
const COLOR_YELLOW = vec3(1.0, 1.0, 0.0);
const COLOR_RED = vec3(1.0, 0.0, 0.0);
const COLOR_GREEN = vec3(0.0, 1.0, 0.0);
const COLOR_BLUE = vec3(0.0, 0.0, 1.0);

// A flat array of the colors for all pixel vertices.
// Used to remember colors for read_pixel.
var pixel_colors = [];
var grid_colors = [];

// Compute dimensions of pixels in GL units.
const H_SIZE = 2 / WIDTH;
const V_SIZE = 2 / HEIGHT;
// Fraction to space pixels from grid lines.
const SPACING = 0.1;

// Constants for drawing more
const POINT_MODE = 0;
const LINE_MODE = 1;
const TRI_MODE = 2;
const FILL_MODE = 3;
const ANTI_MODE = 4;
const POLY_MODE = 5;
// Remember current drawing mode.
var edit_mode = POINT_MODE;

// Stores history of points clicked.
var clicks_to_draw = []; // Stores clicks not yet rendered
var clicks_last_drawn = []; // Stores clicks for object last renders.
var gridEnabled = true;

// Renders the frame.
function render() {
    setTimeout(function () {

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw pixels
        gl.bindBuffer(gl.ARRAY_BUFFER, pixel_color_buffer);
        gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, pixel_vert_buffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.drawArrays(gl.TRIANGLES, 0, pixel_colors.length);

        // Draw grid_verts
        if (gridEnabled) {
            gl.bindBuffer(gl.ARRAY_BUFFER, grid_color_buffer);
            gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);
            gl.bindBuffer(gl.ARRAY_BUFFER, grid_vert_buffer);
            gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);
            gl.drawArrays(gl.LINES, 0, grid_colors.length);
        }

        // Draw the click history for debugging.
        if (clicks_last_drawn.length > 0 || clicks_to_draw.length > 0) {

            var click_vert_buffer = gl.createBuffer();
            var click_color_buffer = gl.createBuffer();

            // Decide to drawn in progress object or previous one.
            var clicks = clicks_last_drawn;
            var draw_color = COLOR_BLACK;
            if (clicks_to_draw.length > 1) {
                clicks = clicks_to_draw;
                draw_color = COLOR_MAGENTA;
            }

            // Set up arrays for vertices and colors of clicks
            var click_verts = [];
            var click_colors = [];
            for (var i = 0; i < clicks.length; i++) {
                // Pixel coordinates
                var px = clicks[i][0];
                var py = clicks[i][1];
                // Convert to GL coordinates.
                var glx = (px + 0.5) * H_SIZE - 1;
                var gly = (py + 0.5) * V_SIZE - 1;
                click_verts.push(vec3(glx, gly, -0.1));
                click_colors.push(draw_color);
            }

            // Draw the click history
            gl.bindBuffer(gl.ARRAY_BUFFER, click_color_buffer);
            gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(click_colors), gl.DYNAMIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, click_vert_buffer);
            gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(click_verts), gl.DYNAMIC_DRAW);
            gl.drawArrays(gl.LINE_LOOP, 0, click_verts.length);

        }

        requestAnimFrame(render);
    }, 10);

}


//////////////////////////////////////////////////////////////////////////
//
// You don't need to look below here.
//
// Disclaimer: The code below is poorly designed and documented.
//             Examine or modify it at your own risk.
//
//////////////////////////////////////////////////////////////////////////


// Converts integer pixel coordinates to index in flatten array.
function pixel_to_ix(x, y) {
    return (y * WIDTH + x);
}

// Initializes vertex and color buffer to draw the grid_verts.
function init_grid() {

    grid_colors = [];
    var grid_verts = [];

    // Create horizontal grid_verts lines.
    for (var y = 0; y <= HEIGHT; y++) {
        grid_verts.push(vec3(-1, y * V_SIZE - 1, 0));
        grid_verts.push(vec3(1, y * V_SIZE - 1, 0));
        grid_colors.push(COLOR_BLACK);
        grid_colors.push(COLOR_BLACK);
    }

    // Create vertical grid_verts lines.
    for (var x = 0; x <= WIDTH; x++) {
        grid_verts.push(vec3(x * H_SIZE - 1, -1, 0));
        grid_verts.push(vec3(x * H_SIZE - 1, 1, 0));
        grid_colors.push(COLOR_BLACK);
        grid_colors.push(COLOR_BLACK);
    }

    // Create and fill buffers for colors and vertices of grid_verts.
    grid_color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, grid_color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(grid_colors), gl.STATIC_DRAW);

    grid_vert_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, grid_vert_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(grid_verts), gl.STATIC_DRAW);

}

// Extends arrays verts and colors with a colored rectangle
// with specified corners.
function create_rectangle(verts, colors, lower_left, upper_right, color) {

    // Draws as 2 triangles.
    colors.push(color);
    verts.push(lower_left);
    colors.push(color);
    verts.push(upper_right);
    colors.push(color);
    verts.push(vec3(lower_left[0], upper_right[1], 0));

    colors.push(color);
    verts.push(lower_left);
    colors.push(color);
    verts.push(upper_right);
    colors.push(color);
    verts.push(vec3(upper_right[0], lower_left[1], 0));

}

// Initializes vertex and color buffer to draw the pixels.
function init_pixels() {

    pixel_colors = [];
    var pixel_verts = [];

    // Loop over all the pixel coordinates and create a white square.
    for (var y = 0; y < HEIGHT; y++) {
        for (var x = 0; x < WIDTH; x++) {
            var lower_left = vec3((x + SPACING) * H_SIZE - 1, (y + SPACING) * V_SIZE - 1, 0);
            var upper_right = vec3((x + 1 - SPACING) * H_SIZE - 1, (y + 1 - SPACING) * V_SIZE - 1, 0);
            create_rectangle(pixel_verts, pixel_colors, lower_left, upper_right, COLOR_WHITE);
        }
    }

    // Create and fill buffers for colors and vertices of pixels.
    pixel_color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pixel_color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pixel_colors), gl.STATIC_DRAW);

    pixel_vert_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pixel_vert_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pixel_verts), gl.STATIC_DRAW);

}

// Erase all pixels.  Resets points clicked.
function clear_pixels() {

    // Sets all pixel_colors to white.
    for (var i = 0; i < pixel_colors.length; i++)
        pixel_colors[i] = COLOR_WHITE;

    // Reset the entire color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, pixel_color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pixel_colors), gl.STATIC_DRAW);

    // Reset the click history.
    clicks_last_drawn = [];
    clicks_to_draw = [];

}

// Takes an integer x, 0 <= x < WIDTH, an integer y, 0 <= y < HEIGHT.
// Returns the color of that pixel in RGB as a vec3.  Returns black if
// inputs are out of range.  You're not allowed to use this function
// for Project 1.
function read_pixel(x, y) {

    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT)
        return pixel_colors[6 * pixel_to_ix(x, y)];
    else
        return vec3(0.0, 0.0, 0.0);

}

// Handles mouse clicks.
//
// Depending on current drawing mode this function
// will either save the click to draw an object in
// future, or if sufficient clicks have been made
// to draw the object, it calls the appropriate
// rasterization function.
function mouse_click_listener() {

    // Get the click's position in canvas coordinates.
    // Origin upper left corner of canvas
    // x increases to the right
    // y increases down

    var x = event.clientX - 10; // -10 accounts for padding around canvas.
    var y = event.clientY - 10;

    // Convert the click's position to pixel coordinates
    // These are float point numbers.
    // Origin is lower left corner
    // x increases to the right
    // y increases up
    var pixel_x = x / canvas.width * WIDTH;
    var pixel_y = (canvas.height - y) / canvas.height * HEIGHT;
    var point_clicked = vec2(Math.floor(pixel_x), Math.floor(pixel_y));

    // Set drawing color from the variables set by sliders.
    var draw_color = vec3(b_color_red, b_color_green, b_color_blue);

    // Draw based on editing mode.
    if (edit_mode == POINT_MODE) {

        rasterize_point(point_clicked, draw_color);

    } else {

        // Adds the point clicked to array of points clicked.
        clicks_to_draw.push(point_clicked);

        // If drawing occurs save the points clicked to history so
        // debugging info can be drawn and resets the points clicked.
        if (edit_mode == LINE_MODE && clicks_to_draw.length == 2) {
            // Enough points to draw a line.
            clicks_last_drawn = clicks_to_draw;
            rasterize_line(clicks_last_drawn[0], clicks_last_drawn[1], draw_color);
            clicks_to_draw = [];

        } else if (edit_mode == TRI_MODE && clicks_to_draw.length == 3) {
            // Enough points to draw a triangle.
            clicks_last_drawn = clicks_to_draw;
            rasterize_triangle(clicks_last_drawn[0], clicks_last_drawn[1], clicks_last_drawn[2], draw_color);
            clicks_to_draw = [];

        } else if (edit_mode == FILL_MODE && clicks_to_draw.length == 3) {
            // Enough points to draw a filled triangle.
            clicks_last_drawn = clicks_to_draw;
            rasterize_filled_triangle(clicks_last_drawn[0], clicks_last_drawn[1], clicks_last_drawn[2], draw_color);
            clicks_to_draw = [];

        } else if (edit_mode == ANTI_MODE && clicks_to_draw.length == 2) {
            // Enough points to draw an antialiased line.
            clicks_last_drawn = clicks_to_draw;
            rasterize_antialias_line(clicks_last_drawn[0], clicks_last_drawn[1], draw_color);
            clicks_to_draw = [];

        } else if (edit_mode == POLY_MODE && clicks_to_draw.length == 7) {
            // Enough points to draw a 7-gon.
            clicks_last_drawn = clicks_to_draw;
            rasterize_filled_sevengon(clicks_to_draw, draw_color);
            clicks_to_draw = [];
        }
    }

}

// Handles click on drawing mode menu.
// Resets object points if mode changes.
function edit_mode_listener() {

    if (edit_mode != this.selectedIndex) {
        // Reset the points clicked for
        // drawing the current object.
        clicks_to_draw = [];
    }

    // Sets edit mode based on selection.
    edit_mode = this.selectedIndex;

}

// Install event listeners for UI elements.
function init_listeners() {

    // Listen for mouse clicks.
    canvas.addEventListener("click", mouse_click_listener);
    // Listen for clicks on erase button to call clear_pixels().
    var erase_button = document.getElementById("EraseButton");
    erase_button.addEventListener("click", clear_pixels);
    // Listen for clicks on the drawing mode menu.
    var edit_menu = document.getElementById("EditMode");
    edit_menu.addEventListener("click", edit_mode_listener);
    var grid_button = document.getElementById("GridButton");
    grid_button.addEventListener("click", toggle_grid);

}

function toggle_grid() {
    gridEnabled = !gridEnabled;
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
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    vColor = gl.getAttribLocation(program, "vColor");
    vPosition = gl.getAttribLocation(program, "vPosition");

    // Initialize buffers for grid_verts and pixels.
    init_pixels();
    init_grid();

    // Initialize event listeners for UI changes.
    init_listeners();

    // Start rendering.
    render();
}

// Author: Aidan Pieper
// CSC 385 Computer Graphics
// Version: Winter 2018

// All points are integer pixel coordinates

// Takes a point given as vec2 in pixel coordinates
// and a color given as vec3.  Changes the pixel the
// point lies in to the color.
function rasterize_point(point, color) {

    write_pixel(point[0], point[1], color);

}

// Takes two points given as vec2 in pixel
// coordinates and a color given as vec3.
// Draws line between the points of the color.
// Implemented using Bresenham's Algorithm.
function rasterize_line(point1, point2, color) {
    var x1 = point1[0];
    var x2 = point2[0];
    var y1 = point1[1];
    var y2 = point2[1];

    // Swap X and Y if slope > 1
    var swap = false;
    if (Math.abs(x2 - x1) < Math.abs(y2 - y1)) {
        [x1, y1] = [y1, x1]; // EMCA6 syntax
        [x2, y2] = [y2, x2];
        swap = true;
    }

    // Swap points if first point is further right
    if (x1 > x2) {
        [x1, x2] = [x2, x1];
        [y1, y2] = [y2, y1];
    }

    var dx = x2 - x1;
    var dy = y2 - y1;

    // Move Y down and swap dy if slope is negative
    var step = 1;
    if (dy < 0) {
        step = -1;
        dy = -dy;
    }

    var y = y1;
    var p = (2 * dy) - dx;
    var pixels = [];
    for (var x = x1; x <= x2; x++) {
        if (swap) {
            pixels.push(vec2(y, x));
            write_pixel(y, x, color);
        } else {
            pixels.push(vec2(x, y));
            write_pixel(x, y, color);
        }

        if (p >= 0) {
            y += step;
            p += 2 * (dy - dx);
        } else {
            p += 2 * dy;

        }
    }

    // Returns a list of colored pixels
    return pixels;
}

// Takes two points given as vec2 in pixel
// coordinates and a color given as vec3.
// Draws an antialiased line between them
// of the color.
function rasterize_antialias_line(point1, point2, color) {

    // Extra Credit: Implement me!
    // Remember to cite any sources you reference.

}

// Takes three points given as vec2 in pixel
// coordinates and a color given as vec3.
// Draws triangle between the points of the color.
function rasterize_triangle(point1, point2, point3, color) {
    rasterize_line(point1, point2, color);
    rasterize_line(point2, point3, color);
    rasterize_line(point3, point1, color);
}

// Takes three points given as vec2 in pixel
// coordinates and a color as a vec3.
// Draws a filled triangle between the points
// of the color. Implemented using flood fill.
function rasterize_filled_triangle(point1, point2, point3, color) {

    var points = [];
    var colored = {};

    points = points.concat(rasterize_line(point1, point2, color));
    points = points.concat(rasterize_line(point2, point3, color));
    points = points.concat(rasterize_line(point3, point1, color));

    var flood_fill = function (pixel) {
        var x = pixel[0], y = pixel[1];
        // Base case
        if (colored[pixel] || x < 0 || x > WIDTH || y < 0 || y > WIDTH) {
            return;
        }

        write_pixel(x, y, color);
        colored[pixel] = true;

        // Recursively color
        flood_fill(vec2(x + 1, y));
        flood_fill(vec2(x - 1, y));
        flood_fill(vec2(x, y + 1));
        flood_fill(vec2(x, y - 1));
    };

    var contains_point = function (pixel) {
        // TODO (Aidan)
        return true;
    };

    points.forEach(function (pixel) {
        if (!colored[pixel] && contains_point(pixel)) {
            flood_fill(pixel)
        }
    });
}

// Takes an array of seven points given as vec2 in pixel
// coordinates and a color given as a vec3.
// Draws a filled 7-gon between from the point of the color.
// Implemented using inside-outside test.
function rasterize_filled_sevengon(points, color) {

    // Extra Credit: Implement me!

}

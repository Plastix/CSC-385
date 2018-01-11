// Author: ???
// CSC 385 Computer Graphics
// Version: Winter 2018

// All points are integer pixel coordinates

// Takes a point given as vec2 in pixel coordinates
// and a color given as vec3.  Changes the pixel the
// point lies in to the color.
function rasterize_point(point, color){

    write_pixel(point[0], point[1], color);

}

// Takes two points given as vec2 in pixel
// coordinates and a color given as vec3.
// Draws line between the points of the color.
// Implemented using Bresenham's Algorithm.
function rasterize_line(point1, point2, color){

    // Implement me!

}

// Takes two points given as vec2 in pixel
// coordinates and a color given as vec3.
// Draws an antialiased line between them
// of the color.
function rasterize_antialias_line(point1, point2, color){

    // Extra Credit: Implement me!
    // Remember to cite any sources you reference.

}

// Takes three points given as vec2 in pixel
// coordinates and a color given as vec3.
// Draws triangle between the points of the color.
function rasterize_triangle(point1, point2, point3, color){

    // Implement me!

}

// Takes three points given as vec2 in pixel
// coordinates and a color as a vec3.
// Draws a filled triangle between the points
// of the color. Implemented using flood fill.
function rasterize_filled_triangle(point1, point2, point3, color){

    // Implement me!

}

// Takes an array of seven points given as vec2 in pixel
// coordinates and a color given as a vec3.
// Draws a filled 7-gon between from the point of the color.
// Implemented using inside-outside test.
function rasterize_filled_sevengon(points, color){

    // Extra Credit: Implement me!

}

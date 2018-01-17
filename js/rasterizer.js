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
    let x1 = point1[0];
    let x2 = point2[0];
    let y1 = point1[1];
    let y2 = point2[1];

    // Swap X and Y if slope > 1
    let swap = false;
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

    let dx = x2 - x1;
    let dy = y2 - y1;

    // Move Y down and swap dy if slope is negative
    let step = 1;
    if (dy < 0) {
        step = -1;
        dy = -dy;
    }

    let y = y1;
    let p = (2 * dy) - dx;
    const pixels = [];
    for (let x = x1; x <= x2; x++) {
        if (swap) {
            pixels.push(vec2(y, x));
            // noinspection JSSuspiciousNameCombination
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
    let is_in_bounds = (x, y) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;

    let is_parallel = (par1, par2) => par1[0] * par2[1] - par2[0] * par1[1] === 0;

    let is_colored = (x, y) => colored[x][y];

    let color_pixel = (x, y) => colored[x][y] = true;

    let slope = (p1, p2) => (p2[1] - p1[1]) / (p2[0] - p1[0]);

    let is_on_segment = (p, e1, e2) => Math.max(e1[0], e2[0]) >= p[0] && p[0] >= Math.min(e1[0], e2[0])
        && Math.max(e1[1], e2[1]) >= p[1] && p[1] >= Math.min(e1[1], e2[1]);

    // From Mozilla documentation
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    let get_random = (min, max) => Math.random() * (max - min) + min;

    let get_random_point = () => vec2(
        get_random(WIDTH * 10, WIDTH * 100),
        get_random(-HEIGHT, 0)
    );

    let get_neighboring_pixels = (p) => [
        vec2(p[0] - 1, p[1]),
        vec2(p[0] + 1, p[1]),
        vec2(p[0], p[1] - 1),
        vec2(p[0], p[1] + 1)
    ];

    let get_line_params = (p1, p2) => {
        if (p1[0] === p2[0]) {
            return [1, 0, p1[0]];
        } else if (p1[1] === p2[1]) {
            return [0, 1, p1[1]];
        } else {
            return [-slope(p1, p2), 1, p1[1] - (slope(p1, p2) * p1[0])];
        }
    };

    // Assumes the lines are not parallel
    let get_intersection = function (p1, p2, p3, p4) {
        let params1 = get_line_params(p1, p2);
        let params2 = get_line_params(p3, p4);

        let a1 = params1[0];
        let b1 = params1[1];
        let c1 = params1[2];
        let a2 = params2[0];
        let b2 = params2[1];
        let c2 = params2[2];

        let denom = (a1 * b2 - a2 * b1);
        let x = ((c1 * b2) - (c2 * b1)) / denom;
        let y = ((c1 * a2) - (c2 * a1)) / denom;

        return vec2(x, -y);
    };

    let contains_point = function (point) {
        let contained = false;

        [[point1, point2], [point1, point3], [point2, point3]].forEach(function (line) {
            let p1 = line[0];
            let p2 = line[1];
            let params2 = get_line_params(p1, p2);

            // Generate a random point until we have a non-parallel line segment
            let rand = get_random_point();
            let params = get_line_params(point, rand);
            while (is_in_bounds(rand[0], rand[1]) || is_parallel(params, params2)) {
                console.log("Picking a new random point!");
                rand = get_random_point();
                params = get_line_params(point, rand);
            }

            let intersect = get_intersection(point, rand, p1, p2);
            // console.log(point, rand, p1, p2, "intersect: ", intersect);

            // Check whether intersection is on triangle edge
            if (is_on_segment(intersect, p1, p2) && is_on_segment(intersect, point, rand)) {
                contained = !contained;
            }
        });

        return contained;
    };

    let flood_fill = function (x, y) {
        // Base case
        if (!is_in_bounds(x, y) || is_colored(x, y)) {
            return;
        }

        write_pixel(x, y, color);
        color_pixel(x, y);

        // Recursively color
        flood_fill(x + 1, y);
        flood_fill(x - 1, y);
        flood_fill(x, y + 1);
        flood_fill(x, y - 1);
    };

    const colored = [];
    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            if (!colored[j]) {
                colored[j] = [];
            }
            colored[j][i] = false;
        }
    }

    // Unnecessarily functional JS code booya!
    rasterize_line(point1, point2, color)
        .concat(rasterize_line(point2, point3, color))
        .concat(rasterize_line(point3, point1, color))
        .map(p => {
                color_pixel(p[0], p[1]); // Side effects in a map - ouch
                return get_neighboring_pixels(p);
            }
        )
        .reduce((acc, x) => acc.concat(x)) // Flatten list
        .filter(p => is_in_bounds(p[0], p[1]) && !is_colored(p[0], p[1]) && contains_point(p))
        .forEach(p => write_pixel(p[0], p[1], vec3(0, 1, 1))) // Debug
        // .forEach(p => flood_fill(p[0], p[1]));
}

// Takes an array of seven points given as vec2 in pixel
// coordinates and a color given as a vec3.
// Draws a filled 7-gon between from the point of the color.
// Implemented using inside-outside test.
function rasterize_filled_sevengon(points, color) {

    // Extra Credit: Implement me!

}

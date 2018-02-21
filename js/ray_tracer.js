/**
 * A class for representing rays.
 */
class Ray {

    /**
     *
     * @param pt {vec3} The starting point of the ray.
     * @param dir {vec3} The direction the ray travels in.
     */
    constructor(pt, dir) {

        this.pt = pt;
        this.dir = normalize(dir);

    }

    /**
     * Finds collisions between this ray and sphere object.
     *
     * @param sphere {SphereObject} The sphere to check collisions with.
     *
     * @return null if this is no collision, and [pt, t] where pt is
     * the first collision point with the sphere and t > 0 is the distance
     * along the direction of this ray to the collision.
     */
    find_collision(sphere) {

        var to_sphere = subtract(sphere.pt, this.pt);

        var to_sphere_para = scale(dot(this.dir, to_sphere), this.dir);

        var to_sphere_perp = subtract(to_sphere, to_sphere_para);

        if (length(to_sphere_perp) < sphere.rad) {
            // There is at least one intersection.

            var closest_pt = add(sphere.pt, negate(to_sphere_perp));
            var dist_to_surface_along_dir = Math.sqrt(sphere.rad * sphere.rad
                                                      - length(to_sphere_perp) * length(to_sphere_perp));
            var pt = null;
            var t = 0;
            if (length(to_sphere) < sphere.rad){
                // Start inside of sphere.
                pt = add(closest_pt, scale(dist_to_surface_along_dir, this.dir));
                t = length(subtract(pt, this.pt));
            } else {
                pt = add(closest_pt, scale(-dist_to_surface_along_dir, this.dir));
                t = length(subtract(pt, this.pt));
            }

            return [pt, t];


        }

        return null;

    }

}


/**
 * Main RayTracer class.  Its responsible for tracing ray into a scene to render it.
 */
class RayTracer{

    /**
     * Constructor for RayTracer.
     *
     * @param pa {PixelArray} The place to store the image rendered.
     * @param cam {Camera} An object storing info about the camera position, orientation, and size.
     * @param objs {array} An array of SphereObjects in the scene.
     * @param lights {array} An array of Lights in the scene.
     * @param background_color {vec3} The color to draw when ray stops or doesn't collide.
     */
    constructor(pa, cam, objs, lights, background_color){

        this.pa = pa;
        this.cam = cam;
        this.objs = objs;
        this.lights = lights;
        this.background_color = background_color;

    }


    /**
     * Performs ray tracing using the instance fields of this class.
     */
    ray_trace() {

        // IMPLEMENT ME!
        // Replace the code in this function to complete the ray
        // tracing behavior required by the assignment.  The code currently
        // present in this function is to demonstrate the interaction of
        // various parts of the starter code.  You may want to use this example
        // as a starting point and then slowly modify and extend it.


        // The clear the screen to render a new image.
        this.pa.clear_pixels();

        // Loop over the pixels that need to be render.
        for (var a = 0; a < this.pa.get_width(); a++) {
            for (var b = 0; b < this.pa.get_height(); b++) {

                // Render the pixel at (a,b) in the PixelArray pa.

                // Convert (a,b) to world coordinates of pixels using camera properties.
                var x = this.cam.width_inc * (a + 0.5) - (this.pa.get_width() * this.cam.width_inc) / 2.0;
                var y = this.cam.height_inc * (b + 0.5) - (this.pa.get_height() * this.cam.height_inc) / 2.0;

                // Select a direction to point ray in.  The example is using a hard coded one
                // that produces an oblique projection (the rays are parallel, but not perpendicular
                // to plane of projection).
                var dir = vec3(0.5, -0.5, -1);

                // Generate ray from point and direction.
                var r = new Ray(vec3(x, y, this.cam.eye[2]), dir);

                // Loop over the spheres in the scene and check for collisions with each.
                // Remember the closest sphere collided with.
                var closest_t = -1;
                var closest_obj = null;
                var closest_pt = null;
                for (var i = 0; i < this.objs.length; i++) {
                    var res = r.find_collision(this.objs[i]);
                    if (res != null) {
                        if (closest_t < 0 || closest_t > res[1]) {
                            closest_t = res[1];
                            closest_pt = res[0];
                            closest_obj = this.objs[i];
                        }
                    }
                }

                // There's only one "light" and it's the hard coded ambient light.
                var amb_light = this.lights[0].color;

                // If we collided with a sphere draw it using only ambient lighting.
                if (closest_t < 0)
                    this.pa.write_pixel(a, b, this.background_color);
                else
                    this.pa.write_pixel(a, b, vec3(closest_obj.ka[0]*amb_light[0],
                                                    closest_obj.ka[1]*amb_light[1],
                                                    closest_obj.ka[2]*amb_light[2]));
            }
        }

    }


}

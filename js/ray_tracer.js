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
        let to_sphere = subtract(sphere.pt, this.pt);

        let to_sphere_para = scale(dot(this.dir, to_sphere), this.dir);

        let to_sphere_perp = subtract(to_sphere, to_sphere_para);

        if (length(to_sphere_perp) < sphere.rad) {
            // There is at least one intersection.

            let closest_pt = add(sphere.pt, negate(to_sphere_perp));
            let dist_to_surface_along_dir = Math.sqrt(sphere.rad * sphere.rad
                - length(to_sphere_perp) * length(to_sphere_perp));
            let pt = null;
            let t = 0;
            if (length(to_sphere) < sphere.rad) {
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
class RayTracer {

    /**
     * Constructor for RayTracer.
     *
     * @param pa {PixelArray} The place to store the image rendered.
     * @param cam {Camera} An object storing info about the camera position, orientation, and size.
     * @param objs {array} An array of SphereObjects in the scene.
     * @param lights {array} An array of Lights in the scene.
     * @param background_color {vec3} The color to draw when ray stops or doesn't collide.
     */
    constructor(pa, cam, objs, lights, background_color) {
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
        for (let a = 0; a < this.pa.get_width(); a++) {
            for (let b = 0; b < this.pa.get_height(); b++) {

                // Render the pixel at (a,b) in the PixelArray pa.

                // Convert (a,b) to world coordinates of pixels using camera properties.
                let x = this.cam.width_inc * (a + 0.5) - (this.pa.get_width() * this.cam.width_inc) / 2.0;
                let y = this.cam.height_inc * (b + 0.5) - (this.pa.get_height() * this.cam.height_inc) / 2.0;

                // Select a direction to point ray in.  The example is using a hard coded one
                // that produces an oblique projection (the rays are parallel, but not perpendicular
                // to plane of projection).
                let dir = vec3(0.5, -0.5, -1);

                // Generate ray from point and direction.
                let r = new Ray(vec3(x, y, this.cam.eye[2]), dir);

                // Loop over the spheres in the scene and check for collisions with each.
                // Remember the closest sphere collided with.
                let closest_t = -1;
                let closest_obj = null;
                let closest_pt = null;
                for (let i = 0; i < this.objs.length; i++) {
                    let res = r.find_collision(this.objs[i]);
                    if (res != null) {
                        if (closest_t < 0 || closest_t > res[1]) {
                            closest_t = res[1];
                            closest_pt = res[0];
                            closest_obj = this.objs[i];
                        }
                    }
                }

                // No intersection so draw background color
                if (closest_t < 0) {
                    this.pa.write_pixel(a, b, this.background_color);
                } else {
                    let normal = closest_obj.normal(closest_pt);
                    let reflect = RayTracer.reflect(r.dir, normal);
                    let color = this.phong(r.pt, closest_pt, normal, reflect, closest_obj);
                    this.pa.write_pixel(a, b, color);
                }
            }
        }

    }

    /**
     * Computes the reflection of a specified vector across the normal.
     * @param vector {vec3} Assumed to be normalized
     * @param normal {vec3} Assumed to be normalized
     */
    static reflect(vector, normal) {
        return normalize(subtract(scale(2 * dot(vector, normal), normal), vector));
    }

    phong(ray_pt, point, normal, reflect, object) {
        let result = vec3();
        for (let light of this.lights) {
            if (light.type === AMBIENT_LIGHT) {
                result = add(result, RayTracer.multComponent(object.ka, light.color));
            }
            // TODO (Aidan) check if light is obstructed before computing diffuse and specular
            else {
                // Vector to light source
                let l = normalize(subtract(light.pos, point));
                let attenuation = 1 / Math.pow(RayTracer.dist(point, light.pos), 2);

                // Calculate diffuse component
                let sc = Math.max(dot(l, normal), 0);
                let kd = scale(attenuation * sc, object.kd);
                result = add(result, RayTracer.multComponent(kd, light.color));

                // Calculate specular component
                let view = normalize(subtract(this.cam.eye, point));
                sc = Math.max(Math.pow(dot(reflect, view), object.alpha), 0);
                let ks = scale(attenuation * sc, object.ks);
                result = add(result, RayTracer.multComponent(ks, light.color));
            }
        }
        return result;
    }

    /**
     * Calculates the distance between two points
     * @param point1
     * @param point2
     * @returns {int}
     */
    static dist(point1, point2) {
        return length(subtract(point2, point1))
    }

    /**
     * Calculates component wise multiplication of vectors.
     * @param vec1
     * @param vec2
     */
    static multComponent(vec1, vec2) {
        return vec3(vec1[0] * vec2[0],
            vec1[1] * vec2[1],
            vec1[2] * vec2[2])
    }

}

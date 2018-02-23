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
        let t;
        let pt;
        let dist_to_surface_along_dir;
        let closest_pt_on_ray;
        let to_sphere_perp;
        let to_sphere_para;
        let to_sphere = subtract(sphere.pt, this.pt);

        if (length(to_sphere) <= sphere.rad) {
            // Inside the sphere.  Must collide once to leave.

            to_sphere_para = scale(dot(this.dir, to_sphere), this.dir);
            to_sphere_perp = subtract(to_sphere, to_sphere_para);
            closest_pt_on_ray = subtract(sphere.pt, to_sphere_perp);
            dist_to_surface_along_dir = Math.sqrt(Math.pow(sphere.rad, 2) - Math.pow(length(to_sphere_perp), 2));
            pt = add(closest_pt_on_ray, scale(dist_to_surface_along_dir, this.dir));
            t = length(subtract(pt, this.pt));
            return [pt, t];

        } else {
            // Outside the sphere.
            if (dot(this.dir, to_sphere) < 0) {
                // Pointing away from sphere.  Cannot collide.
                return null;
            }

            to_sphere_para = scale(dot(this.dir, to_sphere), this.dir);
            to_sphere_perp = subtract(to_sphere, to_sphere_para);
            if (length(to_sphere_perp) <= sphere.rad) {
                // Collides at least once.
                closest_pt_on_ray = subtract(sphere.pt, to_sphere_perp);
                dist_to_surface_along_dir = Math.sqrt(Math.pow(sphere.rad, 2) - Math.pow(length(to_sphere_perp), 2));
                pt = add(closest_pt_on_ray, scale(-dist_to_surface_along_dir, this.dir));
                t = length(subtract(pt, this.pt));
                return [pt, t];
            } else {
                // Does not collide.
                return null;
            }
        }
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
        this.MAX_STEPS = 2;
        this.temp_ray = new Ray(vec3(), vec3());
    }


    /**
     * Performs ray tracing using the instance fields of this class.
     */
    ray_trace() {
        // The clear the screen to render a new image.
        this.pa.clear_pixels();

        // Loop over the pixels that need to be render.
        for (let x = 0; x < this.pa.get_width(); x++) {
            for (let y = 0; y < this.pa.get_height(); y++) {
                // Render the pixel at (a,b) in the PixelArray pa.
                let ray = this.cam.get_ray(x, y, this.pa);
                let color = this.trace(ray, 0, null);
                this.pa.write_pixel(x, y, color);
            }
        }
    }

    trace(ray, steps, ignore_obj) {
        if (steps > this.MAX_STEPS) {
            return this.background_color;
        }

        let collision = this.check_collisions(ray, ignore_obj);
        if (collision.closest_t < 0) {
            return this.background_color;
        }

        let pt = collision.closest_pt;
        let obj = collision.closest_obj;
        let normal = obj.normal(pt);
        let local = this.phong(ray.pt, pt, normal, obj);
        steps += 1;
        ray.pt = pt;
        ray.dir = RayTracer.reflect(ray.dir, normal);
        let reflect = this.trace(ray, steps, obj);
        let scatter = RayTracer.multComponent(obj.kd, obj.ks);
        return add(RayTracer.multComponent(scatter, reflect), local);
    }


    /**
     * Loop over the spheres in the scene and check for collisions with each.
     * Remember the closest sphere collided with.
     * @param ray
     * @param ignore_obj sphere object to ignore collisions.
     * @returns {{}}
     */
    check_collisions(ray, ignore_obj) {
        let result = {
            closest_t: -1,
            closest_obj: null,
            closest_pt: null
        };

        for (let i = 0; i < this.objs.length; i++) {
            let obj = this.objs[i];
            // Skip ignored object
            if (obj === ignore_obj) {
                continue;
            }

            let res = ray.find_collision(obj);
            if (res != null) {
                if (result.closest_t < 0 || result.closest_t > res[1]) {
                    result.closest_t = res[1];
                    result.closest_pt = res[0];
                    result.closest_obj = this.objs[i];
                }
            }
        }
        return result;
    }

    /**
     * Computes the reflection of a specified vector across the normal.
     * @param vector {vec3} Assumed to be normalized
     * @param normal {vec3} Assumed to be normalized
     */
    static reflect(vector, normal) {
        return normalize(subtract(scale(2 * dot(vector, normal), normal), vector));
    }

    phong(ray_pt, point, normal, object) {
        let result = vec3();
        for (let light of this.lights) {
            if (light.type === AMBIENT_LIGHT) {
                result = add(result, RayTracer.multComponent(object.ka, light.color));
            } else if (light.type === POINT_LIGHT) {
                // Vector to light source
                let l = normalize(subtract(light.pos, point));
                let light_dot = dot(l, normal);
                let light_dist = RayTracer.dist(point, light.pos);

                // Only render light if not obstructed
                if (!this.is_obstructed(l, light_dist, light_dot, point, object)) {
                    let attenuation = 1 / (1 + Math.pow(light_dist, 2));

                    // Calculate diffuse component
                    let scale_diffuse = Math.max(light_dot, 0) * attenuation;
                    let diffuse = scale(scale_diffuse, RayTracer.multComponent(object.kd, light.color));
                    result = add(result, diffuse);

                    // Calculate specular component
                    let view = normalize(subtract(ray_pt, point));
                    let reflect = RayTracer.reflect(l, normal);
                    let scale_specular = Math.pow(Math.max(dot(reflect, view), 0), object.alpha) * attenuation;
                    let specular = scale(scale_specular, RayTracer.multComponent(object.ks, light.color));
                    result = add(result, specular);
                }
            }
        }

        return result;
    }

    is_obstructed(l, light_dist, light_dot, point, obj) {
        this.temp_ray.pt = point;
        this.temp_ray.dir = l;
        let col = this.check_collisions(this.temp_ray, obj);
        return light_dot < 0 || (col.closest_t > 0 && RayTracer.dist(col.closest_pt, point) <= light_dist);
    }

    /**
     * Calculates the distance between two points
     * @param  point1
     * @param point2
     * @returns {int} Distance
     */
    static dist(point1, point2) {
        return length(subtract(point2, point1))
    }

    /**
     * Calculates component wise multiplication of vectors.
     * @param {vec3} vec1
     * @param {vec3} vec2
     */
    static multComponent(vec1, vec2) {
        return vec3(vec1[0] * vec2[0],
            vec1[1] * vec2[1],
            vec1[2] * vec2[2])
    }

}

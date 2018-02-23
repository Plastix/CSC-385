const PROJECTION_ORTHO = 0;
const PROJECTION_PERSPECTIVE = 1;

/**
 * A very basic camera class.
 */
class Camera {

    /**
     * @param eye {vec3} The origin of the camera's detector.
     * @param up {vec3} The up direction of the camera.
     * @param at {vec3} The position that the camera is looking at.
     * @param width_inc {number} The horizontal distance in world coords between pixels of the camera.
     * @param height_inc {number} The vertical distance in world coords between pixels of the camera.
     * @param projection_type {int} Type of projection to shoot rays using. Either 0 = ortho or 1 = perspective.
     * @param projection_dist {int} Distance to cop. Only used in perspective render mode.
     */
    constructor(eye, up, at, width_inc, height_inc, projection_type, projection_dist) {
        this.eye = eye;
        this.up = up;
        this.at = at;
        this.width_inc = width_inc;
        this.height_inc = height_inc;
        this.projection_type = projection_type;
        this.projection_dist = projection_dist;
    }

    /**
     * Gets the ray associated with the current pixel.
     * @param {int} a X position of pixel.
     * @param {int} b Y position of pixel. the current pixel array
     * @returns {Ray} Generated ray.
     */
    get_ray(a, b) {
        // Pixels start at center
        let pixel_vec = vec4(a + 0.5, b + 0.5, this.eye[2], 1);
        let v = normalize(subtract(this.at, this.eye)); // View plane normal
        let n = normalize(cross(v, this.up)); // perpendicular vector
        let u = normalize(cross(n, v)); // new up vector

        let cam_matrix = transpose(mat4(vec4(n, 0), vec4(u, 0), vec4(v, 0), vec4()));
        let transform = mult(cam_matrix,
            mult(translate(-1, -1, 0), scalem(this.width_inc, this.height_inc, 1)));

        pixel_vec = mult(transform, pixel_vec);

        let dir = null;
        if (this.projection_type === PROJECTION_ORTHO) {
            dir = v;
        } else if (this.projection_type === PROJECTION_PERSPECTIVE) {
            // Camera looks in -z direction
            let cop = add(scale(-this.projection_dist, v), this.eye);
            cop = mult(transform, vec4(cop, 1));
            dir = normalize(vec3(subtract(pixel_vec, cop)));
        } else {
            console.error("Unknown projection type!")
        }

        // Generate ray from point and direction.
        return new Ray(vec3(pixel_vec), dir);
    }
}
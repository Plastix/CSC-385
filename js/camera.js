/**
 * A very basic camera class.
 *
 * You'll probably want to add some information to this.
 */
const PROJECTION_ORTHO = 0;
const PROJECTION_PERSPECTIVE = 1;

class Camera {

    /**
     * @param eye {vec3} The origin of the camera's detector.
     * @param up {vec3} The up direction of the camera.
     * @param at {vec3} The position that the camera is looking at.
     * @param width_inc {number} The horizontal distance in world coords between pixesl of the camera.
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

    get_ray(a, b, pa) {
        // Convert (a,b) to world coordinates of pixels using camera properties.
        let x = this.width_inc * (a + 0.5) - (pa.get_width() * this.width_inc) / 2.0;
        let y = this.height_inc * (b + 0.5) - (pa.get_height() * this.height_inc) / 2.0;
        let z = this.eye[2];
        let pixel_vec = vec3(x, y, z);

        // Select a direction to point ray in.  The example is using a hard coded one
        // that produces an oblique projection (the rays are parallel, but not perpendicular
        // to plane of projection).

        let view_plane_normal = normalize(subtract(this.at, this.eye));
        let dir = null;
        if (this.projection_type === PROJECTION_ORTHO) {
            dir = view_plane_normal;
        } else if (this.projection_type === PROJECTION_PERSPECTIVE) {
            // Camera looks in -z direction
            let cop = add(scale(-this.projection_dist, view_plane_normal), this.eye);
            dir = normalize(subtract(pixel_vec, cop))
        } else {
            console.error("Unknown projection type!")
        }

        // Generate ray from point and direction.
        return new Ray(pixel_vec, dir);
    }
}
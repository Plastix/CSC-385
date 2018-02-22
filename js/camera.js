/**
 * A very basic camera class.
 *
 * You'll probably want to add some information to this.
 */
class Camera {

    /**
     * @param eye {vec3} The origin of the camera's detector.
     * @param up {vec3} The up direction of the camera.
     * @param at {vec3} The position that the camera is looking at.
     * @param width_inc {number} The horizontal distance in world coords between pixesl of the camera.
     * @param height_inc {number} The vertical distance in world coords between pixels of the camera.
     * @param projection_type TODO Aidan
     */
    constructor(eye, up, at, width_inc, height_inc, projection_type) {
        this.eye = eye;
        this.up = up;
        this.at = at;
        this.width_inc = width_inc;
        this.height_inc = height_inc;
        this.projection_type = projection_type;
    }

    get_ray(a, b, pa) {
        // Convert (a,b) to world coordinates of pixels using camera properties.
        let x = this.width_inc * (a + 0.5) - (pa.get_width() * this.width_inc) / 2.0;
        let y = this.height_inc * (b + 0.5) - (pa.get_height() * this.height_inc) / 2.0;

        // Select a direction to point ray in.  The example is using a hard coded one
        // that produces an oblique projection (the rays are parallel, but not perpendicular
        // to plane of projection).
        let dir = normalize(subtract(this.at, this.eye));

        // Generate ray from point and direction.
        return new Ray(vec3(x, y, this.eye[2]), dir);
    }
}
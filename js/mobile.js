class MobileObject {

    constructor(gl, program, parent, height, attach_point_parent, angle, angular_vel) {
        this.gl = gl;
        this.parent = parent;
        this.height = height;
        this.attach_point_parent = attach_point_parent;
        this.angle = angle;
        this.angular_vel = angular_vel;
        this.transform_mat = null;

        this.line_buffer = this.gl.createBuffer();
        this.line_buffer_color = this.gl.createBuffer();
        this.vPosition = this.gl.getAttribLocation(program, "vPosition");
        this.vColor = this.gl.getAttribLocation(program, "vColor");
        this.mM = this.gl.getUniformLocation(program, "mM");
    }

    evolve(dt) {
        this.angle += this.angular_vel * dt;
        this.setup_transform(); // Recreate the transform matrix with the new angle
    }

    setup_transform() {
        // Implemented by subclasses
    }

    draw_string(M_mat, root_pos) {
        let start_point = vec4(0, 0, 0, 1);
        let end_point = vec4(0, this.height, 0, 1);

        if (!this.parent) {
            start_point = root_pos;
            end_point = add(root_pos, end_point);
        }

        fill_buffer(this.line_buffer, [start_point, end_point]);
        fill_buffer(this.line_buffer_color, [COLOR_BLACK, COLOR_BLACK]);
        enable_attribute_buffer(this.vPosition, this.line_buffer, 4);
        enable_attribute_buffer(this.vColor, this.line_buffer_color, 3);
        this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
        this.gl.drawArrays(this.gl.LINES, 0, 2);
    }

    draw(M_mat, draw_mode) {
        // Implemented by subclasses
    }
}

class Rod extends MobileObject {

    constructor(gl, program, parent, length, attach_point, attach_point_parent, height, angle, angular_vel) {
        super(gl, program, parent, height, attach_point_parent, angle, angular_vel);
        this.length = length;
        this.attach_point = attach_point;
        this.children = [];
        this.setup_transform();
    }

    setup_transform() {
        this.transform_mat = mat4();
        this.transform_mat = mult(translate(-this.attach_point, 0, 0), this.transform_mat);
        this.transform_mat = mult(rotateY(this.angle), this.transform_mat);
    }

    add_child(object) {
        if (!(object instanceof MobileObject)) {
            console.error("Child must either be a rod or pendant!");
        }
        this.children.push(object);
    }

    draw(M_mat, draw_mode) {
        fill_buffer(this.line_buffer, [vec4(0, 0, 0, 1), vec4(this.length)]);
        fill_buffer(this.line_buffer_color, [COLOR_BLACK, COLOR_BLACK]);
        enable_attribute_buffer(this.vPosition, this.line_buffer, 4);
        enable_attribute_buffer(this.vColor, this.line_buffer_color, 3);
        this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
        this.gl.drawArrays(this.gl.LINES, 0, 2);
    }
}

class Pendant extends MobileObject {

    constructor(gl, program, parent, height, attach_point_parent, angle, angular_vel, mesh, instance_mat) {
        super(gl, program, parent, height, attach_point_parent, angle, angular_vel);
        this.mesh = mesh;
        this.instance_mat = instance_mat;
        this.setup_transform();
    }

    setup_transform() {
        this.transform_mat = mat4();
        this.transform_mat = mult(this.instance_mat, this.transform_mat);
        this.transform_mat = mult(rotateY(this.angle), this.transform_mat);
    }

    draw(M_mat, draw_mode) {
        this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
        this.mesh.render(draw_mode);
    }
}

class Mobile {

    /**
     * Constructs an empty mobile whose root is at the specified position.
     *
     * @param {vec4} root_pos
     *      Position of root.
     * @param gl WebGL context.
     * @param program Shader program context.
     */
    constructor(root_pos, gl, program) {
        this.root_pos = root_pos;
        this.draw_mode = DRAW_FILL;
        this.gl = gl;
        this.program = program;
        this.mPV = this.gl.getUniformLocation(this.program, "mPV");

        this.camera_mode = null;
        this.pendants = []; // List of pendants used in camera modes

        // Stores global view matrix. Is modified by set_camera functions.
        this.view_mat = mat4();

        // Store global projection matrix. Is modified by set_proj functions.
        this.project_mat = mat4();

        const CUBE_MESH = new Mesh(
            [[vec4(-0.5, -0.5, -0.5, 1), vec4(0, 0, 0, 1)],
                [vec4(0.5, -0.5, -0.5, 1), vec4(1, 0, 0, 1)],
                [vec4(0.5, 0.5, -0.5, 1), vec4(1, 1, 0, 1)],
                [vec4(-0.5, 0.5, -0.5, 1), vec4(0, 1, 0, 1)],
                [vec4(-0.5, -0.5, 0.5, 1), vec4(0, 0, 1, 1)],
                [vec4(0.5, -0.5, 0.5, 1), vec4(1, 0, 1, 1)],
                [vec4(0.5, 0.5, 0.5, 1), vec4(1, 1, 1, 1)],
                [vec4(-0.5, 0.5, 0.5, 1), vec4(0, 1, 1, 1)]
            ],
            [[0, 2, 1], [0, 3, 2], [1, 2, 5], [6, 5, 2], [3, 6, 2], [3, 7, 6], [3, 0, 4],
                [3, 4, 7], [0, 1, 5], [0, 5, 4], [4, 5, 6], [4, 6, 7]], this.gl, this.program);

        // TODO (Aidan) root of mobile - Make this a root a list
        this.root_rod = null;
        this.add_rod(null, 4, 1.5, 0, 0.5, 0, 3);
        this.add_pendant(this.root_rod, 0.25, 3.5, 90, 0.1, CUBE_MESH, translate(0, -0.5, 0));
        this.add_pendant(this.root_rod, 1.5, 0, 180, -1, CUBE_MESH,
            mult(translate(0, -0.5, 0), mult(rotateZ(45), mult(rotateX(45), scalem(1, 2, 3)))));
    }


    /**
     * Adds a rod to the mobile.
     *
     * @param {object} parent
     *      A reference to the parent object the new rod is connected to.
     *      If parent is null, the rod is connected to the root of the mobile.
     * @param {number} length
     *      The length of the rod.
     * @param {number} attach_point
     *      The distance from the "left" end of the rod to point which it attaches
     *      to its parent object.  This number should be non-negative and at most length.
     * @param{number} attach_point_parent
     *      The distance from the "left" end of the parent which the rod attaches to.
     *      This number should be non-negative. When the parent is a rod this number
     *      should be at most its length.  When the parent is null this number should be 0.
     * @param {number} height
     *      The vertical distance (y) from the rod to the its parent.  This is the length
     *      of the string from the parent to the rod.
     * @param {number} angle
     *      The initial angle between the parent and the rod in the x-z plane.
     * @param {number} angular_vel
     *      The rate at which the angle between the parent and the rod in the x-z plane changes.
     * @return {object}
     *      Returns a reference to the new rod.  Can be use as the parent in future calls.
     */
    add_rod(parent, length, attach_point, attach_point_parent, height, angle, angular_vel) {
        if (!parent instanceof Rod) {
            console.error("You can only add a rod to another rod!");
        }

        let rod = new Rod(this.gl, this.program, parent, length, attach_point, attach_point_parent,
            height, angle, angular_vel);
        if (parent != null) {
            parent.add_child(rod);
        } else {
            this.root_rod = rod;
        }
        return rod;

    }

    /**
     * Adds a pendant to the mobile.
     *
     * @param {object} parent
     *      A reference to the parent object the new rod is connected to.
     *      If parent is null, the rod is connected to the root of the mobile.
     * @param{number} attach_point_parent
     *      The distance from the "left" end of the parent which the rod attaches to.
     *      This number should be non-negative. When the parent is a rod this number
     *      should be at most its length.  When the parent is null this number should be 0.
     * @param {number} height
     *      The vertical distance (y) from the rod to the its parent.  This is the length
     *      of the string from the parent to the pendant.
     * @param {number} angle
     *      The initial angle between the parent and the rod in the x-z plane.
     * @param {number} angular_vel
     *      The rate at which the angle between the parent and the rod in the x-z plane changes.
     * @param {Mesh} mesh
     *      The mesh to render as a pendant.
     * @param {mat4} instance_mat
     *      A transformation matrix that is applied to the mesh before it is
     *      attached to its parent so that pendant contacts the string from its parent at (0,0,0).
     */
    add_pendant(parent, height, attach_point_parent, angle, angular_vel, mesh, instance_mat) {
        if (!parent instanceof Rod) {
            console.error("You can only add a pendant to a rod!");
        }

        if (parent == null) {
            console.log("You must specify a parent rod to connect the pendant to!")
        }

        let pendant = new Pendant(this.gl, this.program, parent, height, attach_point_parent, angle,
            angular_vel, mesh, instance_mat);
        parent.add_child(pendant);

        this.pendants.push(pendant);
        return pendant;

    }

    /**
     * Evolves the mobile by rotating every rod and pendant by dt * angular_vel
     * relative to its parent.
     *
     * @param {number} dt
     *      Amount of time to evolve the mobile.
     */
    evolve(dt) {
        (function ev(object) {
            if (object) {
                object.evolve(dt);
                if (object instanceof Rod) {
                    for (let child of object.children) { // Recursively evolve children of rod
                        ev(child);
                    }
                }
            }
        })(this.root_rod);
    }

    // ================================================================================
    //
    //  Setting View Transformation
    //
    // ================================================================================


    /**
     * Sets the camera mode of future renders to free mode.
     *
     * @param {vec4} camera_pos
     *      Camera origin point.
     * @param {vec4} camera_up
     *      Camera up vector.
     * @param {vec4} camera_normal
     *      Camera direction normal.
     */
    set_camera_free(camera_pos, camera_up, camera_normal) {
        this.camera_mode = {
            mode: CAMERA_FREE,
        };

        this.view_mat = lookAt(camera_pos, add(camera_pos, camera_normal), camera_up);
    }

    /**
     * Sets the camera mode of future renders to fixed mode.
     * Camera resides in the instance frame of the ith pendant after
     * the pendant has been transformed by its instance_mat.  Camera points
     * at (0,0,0) from point (0,0,dist) in the instance frame.  Camera moves
     * and rotates as the pendant it is fixed on moves and rotates in the world frame.
     *
     * @param {vec4} camera_pos
     *      Camera origin point.
     * @param {vec4} camera_up
     *      Camera up vector.
     * @param {int} i
     *      Camera is fixed on the ith pendant added to the mobile.
     *      If i not a valid pendant index, this function has no effect.
     * @param {number} dist
     *      Distance of camera from pendant.
     */
    set_camera_fixed(camera_pos, camera_up, i, dist) {
        if (i >= 0 && i < this.pendants.length) {
            this.camera_mode = {
                mode: CAMERA_FIXED,
                pos: camera_pos,
                up: camera_up,
                index: i,
                dist: dist
            };
        }
    }

    /**
     * Sets the camera mode of future renders to tracking mode.
     * Camera points at (0,0,0) of the tracked pendant instance frame.
     *
     * @param {vec4} camera_pos
     *      Camera origin point.
     * @param {vec4} camera_up
     *      Camera up vector.
     * @param {int} i
     *      Camera is fixed on the ith pendant added to the mobile.
     *      If i not a valid pendant index, this function has no effect.
     */
    set_camera_tracking(camera_pos, camera_up, i) {
        if (i >= 0 && i < this.pendants.length) {
            this.camera_mode = {
                mode: CAMERA_TRACKING,
                pos: camera_pos,
                up: camera_up,
                index: i
            };
        }
    }

    // ================================================================================
    //
    //  Setting Projection Transformation
    //
    // ================================================================================

    /**
     * Set the projection mode of future renders to perspective specified by
     * the normal parameters in the camera's frame.
     *
     * @param fovy
     * @param aspect_ratio
     * @param near
     * @param far
     */
    set_proj_perspective(fovy, aspect_ratio, near, far) {
        this.project_mat = perspective(fovy, aspect_ratio, near, far);
    }

    /**
     * Set the projection mode of future renders to orthogonal specified by
     * the normal parameters in the camera's frame.
     *
     * @param left
     * @param right
     * @param bottom
     * @param top
     * @param near
     * @param far
     */
    set_proj_ortho(left, right, bottom, top, near, far) {
        this.project_mat = ortho(left, right, bottom, top, near, far);
    }

    // ================================================================================
    //
    //  Setting Miscellaneous Features
    //
    // ================================================================================

    set_draw_wireframe() {
        this.draw_mode = DRAW_WIRE;
    }

    set_draw_filled() {
        this.draw_mode = DRAW_FILL;
    }

    update_camera() {
        let mode = this.camera_mode.mode;
        if (mode === CAMERA_FIXED || mode === CAMERA_TRACKING) {
            let object = this.pendants[this.camera_mode.index];

            let transform = mat4();
            while (object) {
                transform = mult(object.transform_mat, transform);
                transform = mult(translate(object.attach_point_parent, -object.height, 0), transform);
                object = object.parent;
            }

            let at = matMultVec3(transform, vec4(0, 0, 0, 1));
            let pos = this.camera_mode.pos;
            if (mode === CAMERA_FIXED) {
                pos = matMultVec3(transform, vec4(0, 0, this.camera_mode.dist, 1))
            }

            this.view_mat = lookAt(pos, at, this.camera_mode.up);
        }
    }

    /**
     * Renders the mobile.
     */
    render() {
        this.gl.useProgram(this.program);

        // Updates the view matrix for certain camera modes
        this.update_camera();

        // Set projection and view transformation for all objects.
        let PV_mat = mult(this.project_mat, this.view_mat);
        this.gl.uniformMatrix4fv(this.mPV, false, flatten(PV_mat));

        (function render(object, M_mat) {
            if (object) {
                // Update current transformation matrix
                M_mat = mult(M_mat, translate(object.attach_point_parent, -object.height, 0));
                object.draw_string(M_mat, this.root_pos);
                M_mat = mult(M_mat, object.transform_mat);
                object.draw(M_mat, this.draw_mode);

                if (object instanceof Rod) {
                    for (let child of object.children) {  // Recursively render children of rod
                        render.call(this, child, M_mat);
                    }
                }
            }
        }).call(this, this.root_rod, mat4());
    }
}
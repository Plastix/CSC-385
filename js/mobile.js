class MobileObject {

    constructor(program, parent, height, attach_point_parent, angle, angular_vel) {
        this.parent = parent;
        this.height = height;
        this.attach_point_parent = attach_point_parent;
        this.angle = angle;
        this.angular_vel = angular_vel;
        this.transform = null;

        this.line_buffer = gl.createBuffer();
        this.line_buffer_color = gl.createBuffer();
        this.vPosition = gl.getAttribLocation(program, "vPosition");
        this.vColor = gl.getAttribLocation(program, "vColor");
    }

    evolve(dt) {
        this.angle += this.angular_vel * dt;
        this.setup_transform();
    }

    setup_transform() {
        // Used by subclasses
    }
}

class Rod extends MobileObject {

    constructor(program, parent, length, attach_point, attach_point_parent, height, angle, angular_vel) {
        super(program, parent, height, attach_point_parent, angle, angular_vel);
        this.length = length;
        this.attach_point = attach_point;
        this.children = [];
        this.setup_transform();
    }

    setup_transform() {
        this.transform = mat4();
        this.transform = mult(translate(-this.attach_point, 0, 0), this.transform);
        this.transform = mult(rotateY(this.angle), this.transform);
    }

    add_child(object) {
        if (!(object instanceof MobileObject)) {
            console.error("Child must either be a rod or pendant!");
        }
        this.children.push(object);
    }
}

class Pendant extends MobileObject {

    constructor(program, parent, height, attach_point_parent, angle, angular_vel, mesh, instance_mat) {
        super(program, parent, height, attach_point_parent, angle, angular_vel);
        this.mesh = mesh;
        this.instance_mat = instance_mat;
        this.setup_transform();
    }

    setup_transform() {
        this.transform = mat4();
        this.transform = mult(this.instance_mat, this.transform);
        this.transform = mult(rotateY(this.angle), this.transform);
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
        this.line_buffer = this.gl.createBuffer();
        this.line_buffer_color = this.gl.createBuffer();
        this.mPV = this.gl.getUniformLocation(this.program, "mPV");
        this.mM = this.gl.getUniformLocation(this.program, "mM");
        this.vPosition = gl.getAttribLocation(program, "vPosition");
        this.vColor = gl.getAttribLocation(program, "vColor");

        // Stores global view matrix. Is modified by set_camera functions.
        this.view_mat = mat4();

        // Store global projection matrix. Is modified by set_proj functions.
        this.project_mat = mat4();

        // TODO (Aidan) root of mobile - Make this a root a list
        this.root_rod = null;
        let mesh = new Mesh(
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

        this.add_rod(null, 4, 1.5, 0, 0.5, 0, 0.1);
        this.add_pendant(this.root_rod, 0.25, 3.5, 90, 0.1, mesh, translate(0, -0.5, 0));
        this.add_pendant(this.root_rod, 1.5, 0, 180, -1, mesh,
            mult(translate(0, -0.5, 0), mult(rotateZ(45), mult(rotateX(45), scalem(1, 2, 3)))));

        // IMPLEMENT ME!
        //
        // An example of the intended behavior of mobile is hardcoded below.
        // It is not general.  You'll need to replace it.
        this.example_rod =
            {
                "parent": null, "length": 4, "attach_point": 1.5, "attach_point_parent": 0,
                "height": 0.5, "angle": 0, "angular_vel": 0.1
            };

        this.example_pendant1 = {
            "parent": this.example_rod,
            "height": 0.25,
            "attach_point_parent": 3.5,
            "angle": 90,
            "angular_vel": 0.1,
            "mesh": new Mesh(
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
                    [3, 4, 7], [0, 1, 5], [0, 5, 4], [4, 5, 6], [4, 6, 7]], this.gl, this.program),
            "instance_mat": translate(0, -0.5, 0)
        };

        this.example_pendant2 = {
            "parent": this.example_rod,
            "height": 1.5,
            "attach_point_parent": 0,
            "angle": 180,
            "angular_vel": -1,
            "mesh": this.example_pendant1["mesh"],
            "instance_mat": mult(translate(0, -0.5, 0), mult(rotateZ(45), mult(rotateX(45), scalem(1, 2, 3))))
        };


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

        let rod = new Rod(this.program, parent, length, attach_point, attach_point_parent, height, angle, angular_vel);
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

        let pendant = new Pendant(this.program, parent, height, attach_point_parent, angle, angular_vel,
            mesh, instance_mat);
        parent.add_child(pendant);

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

        // IMPLEMENT ME!

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

        // IMPLEMENT ME!

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

        this.project_mat = perspective(fovy, aspect, near, far);

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

    /**
     * Renders the mobile.
     */
    render() {
        this.gl.useProgram(this.program);

        // Set projection and view transformation for all objects.
        let PV_mat = mult(this.project_mat, this.view_mat);
        this.gl.uniformMatrix4fv(this.mPV, false, flatten(PV_mat));

        (function render(object, M_mat) {
            if (!object) return;

            // Update current transformation matrix
            M_mat = mult(M_mat, translate(object.attach_point_parent, -object.height, 0));
            // Render string to child
            fill_buffer(object.line_buffer, [vec4(0, 0, 0, 1), vec4(0, object.height, 0, 1)]);
            fill_buffer(object.line_buffer_color, [COLOR_BLACK, COLOR_BLACK]);
            enable_attribute_buffer(object.vPosition, object.line_buffer, 4);
            enable_attribute_buffer(object.vColor, object.line_buffer_color, 3);
            gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
            gl.drawArrays(this.gl.LINES, 0, 2);

            M_mat = mult(M_mat, object.transform);

            if (object instanceof Pendant) { // Render pendant
                this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
                object.mesh.render(this.draw_mode);
            } else if (object instanceof Rod) {  // Render rod

                fill_buffer(object.line_buffer, [vec4(0, 0, 0, 1), vec4(object.length)]);
                fill_buffer(object.line_buffer_color, [COLOR_BLACK, COLOR_BLACK]);
                enable_attribute_buffer(object.vPosition, object.line_buffer, 4);
                enable_attribute_buffer(object.vColor, object.line_buffer_color, 3);
                this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
                this.gl.drawArrays(this.gl.LINES, 0, 2);

                // Recursively render children of rod
                for (let child of object.children) {
                    render.call(this, child, M_mat);
                }
            }
        }).call(this, this.root_rod, mat4());

        // let M_mat;
        // // Render the string from root to rod.
        // fill_buffer(this.line_buffer, [this.root_pos, add(this.root_pos, vec4(0, this.example_rod["height"], 0, 0))]);
        // fill_buffer(this.line_buffer_color, [COLOR_BLACK, COLOR_BLACK]);
        // enable_attribute_buffer(this.vPosition, this.line_buffer, 4);
        // enable_attribute_buffer(this.vColor, this.line_buffer_color, 3);
        // M_mat = mat4();
        // M_mat = mult(translate(0, -this.example_rod["height"], 0), M_mat);
        // this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
        // this.gl.drawArrays(this.gl.LINES, 0, 2);
        //
        // // Render the rod.
        // fill_buffer(this.line_buffer, [vec4(0, 0, 0, 1), vec4(this.example_rod["length"])]);
        // fill_buffer(this.line_buffer_color, [COLOR_BLACK, COLOR_BLACK]);
        // enable_attribute_buffer(this.vPosition, this.line_buffer, 4);
        // enable_attribute_buffer(this.vColor, this.line_buffer_color, 3);
        // M_mat = mat4();
        // M_mat = mult(translate(-this.example_rod["attach_point"], 0, 0), M_mat);
        // M_mat = mult(rotateY(this.example_rod["angle"]), M_mat);
        // M_mat = mult(translate(0, -this.example_rod["height"], 0), M_mat);
        // this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
        // this.gl.drawArrays(this.gl.LINES, 0, 2);
        //
        // // Render the string to the first pendant.
        // fill_buffer(this.line_buffer, [vec4(0, 0, 0, 1), vec4(0, this.example_pendant1["height"], 0, 1)]);
        // fill_buffer(this.line_buffer_color, [COLOR_BLACK, COLOR_BLACK]);
        // enable_attribute_buffer(this.vPosition, this.line_buffer, 4);
        // enable_attribute_buffer(this.vColor, this.line_buffer_color, 3);
        // M_mat = mat4();
        // M_mat = mult(translate(-(this.example_rod["attach_point"] - this.example_pendant1["attach_point_parent"]), -this.example_pendant1["height"], 0), M_mat);
        // M_mat = mult(rotateY(this.example_rod["angle"]), M_mat);
        // M_mat = mult(translate(0, -this.example_rod["height"], 0), M_mat);
        // this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
        // this.gl.drawArrays(this.gl.LINES, 0, 2);
        //
        // // Render the string to the second pendant.
        // fill_buffer(this.line_buffer, [vec4(0, 0, 0, 1), vec4(0, this.example_pendant2["height"], 0, 1)]);
        // fill_buffer(this.line_buffer_color, [COLOR_BLACK, COLOR_BLACK]);
        // enable_attribute_buffer(this.vPosition, this.line_buffer, 4);
        // enable_attribute_buffer(this.vColor, this.line_buffer_color, 3);
        // M_mat = mat4();
        // M_mat = mult(translate(-(this.example_rod["attach_point"] - this.example_pendant2["attach_point_parent"]), -this.example_pendant2["height"], 0), M_mat);
        // M_mat = mult(rotateY(this.example_rod["angle"]), M_mat);
        // M_mat = mult(translate(0, -this.example_rod["height"], 0), M_mat);
        // this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
        // this.gl.drawArrays(this.gl.LINES, 0, 2);
        //
        // // Render the first pendant.
        // M_mat = mat4();
        // M_mat = mult(this.example_pendant1["instance_mat"], M_mat);
        // M_mat = mult(translate(0, -this.example_pendant1["height"], 0), M_mat);
        // M_mat = mult(rotateY(this.example_pendant1["angle"]), M_mat);
        // M_mat = mult(translate(-(this.example_rod["attach_point"] - this.example_pendant1["attach_point_parent"]), 0, 0), M_mat);
        // M_mat = mult(rotateY(this.example_rod["angle"]), M_mat);
        // M_mat = mult(translate(0, -this.example_rod["height"], 0), M_mat);
        // this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
        // this.example_pendant1["mesh"].render(this.draw_mode);
        //
        // // Render the second pendant.
        // M_mat = mat4();
        // M_mat = mult(this.example_pendant2["instance_mat"], M_mat);
        // M_mat = mult(translate(0, -this.example_pendant2["height"], 0), M_mat);
        // M_mat = mult(rotateY(this.example_pendant2["angle"]), M_mat);
        // M_mat = mult(translate(-(this.example_rod["attach_point"] - this.example_pendant2["attach_point_parent"]), 0, 0), M_mat);
        // M_mat = mult(rotateY(this.example_rod["angle"]), M_mat);
        // M_mat = mult(translate(0, -this.example_rod["height"], 0), M_mat);
        // this.gl.uniformMatrix4fv(this.mM, false, flatten(M_mat));
        // this.example_pendant2["mesh"].render(this.draw_mode);

    }

}
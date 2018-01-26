/**
 * Class which represents a vertex that is part of the Mesh data structure.
 */
class Vertex {

    constructor() {
        this.pos = vec4();
        this.color = vec4();
        this.index = -1; // index into vertices array
        this.edge = null;
    }

    set_to_average(verts, weights, s) {
        this.pos = scale(s, this.pos);
        this.color = scale(s, this.color);

        for (let i = 0; i < verts.length; i++) {
            this.pos = add(this.pos, scale(weights[i], verts[i].pos));
            this.color = add(this.color, scale(weights[i], verts[i].color));
        }
    }
}

/**
 * Class which represents a half-edge that is part of the Mesh data structure.
 */
class Edge {

    /**
     * Constructor for new edge.
     * @param head Pointer to vertex that this half-edge points to.
     * @param tail Pointer to vertex that is on the end of this half-edge.
     * @param next Pointer to next half-edge in face.
     * @param prev Pointer to previous half-edge in face.
     * @param twin Pointer to twin of half-edge in Mesh.
     * @param face Pointer to face that contains the current half-edge.
     */
    constructor(head, tail, next, prev, twin, face) {
        this.head = head;
        this.tail = tail;
        this.next = next;
        this.prev = prev; // This really isn't needed since edge.prev = edge.next.next
        this.twin = twin;
        this.face = face;

        this.odd = null; // Odd Vertex added to half-edge when sub-dividing

        head.edge = this; // Update the vertex we're point to
    }
}

/**
 * Class which represents a face that is part of the Mesh data structure.
 */
class Face {

    constructor(edge) {
        this.edge = edge;
    }

    /**
     * Debugging method!!
     * Checks whether the face object and its corresponding half-edges have been
     * constructed properly. If not, errors will be logged in the console.
     */
    validate() {
        let e = this.edge;
        for (let i = 0; i < 3; i++) {
            if (!e.face || e.face !== this) {
                console.error("Incorrect edge set on face!", this);
                return;
            }

            if (!e.head || !e.tail || !e.next || !e.prev) {
                console.error("Half-edge pointers not set correctly!", this);
                return;
            }

            if (e.prev !== e.next.next) {
                console.error("Half-edge pointers not set correctly!", this);
                return
            }

            if (e.head !== e.next.tail) {
                console.error("Half-edge vertices do not match!", this);
                return;
            }
            e = e.next;
        }
    }
}

/**
 * Data structure which implements a half-edge triangle mesh.
 */
class Mesh {

    /**
     * Takes two arrays and constructs a half-edge mesh.
     *
     * @param vertex_array Array of vertices in the mesh. Each element of the vertex
     * array is a length two array containing the position and color as vec4().
     * @param face_array Array of triangular faces in the mesh.
     * Each element of the face array is a face described by a length  three array
     * containing the indices of the vertices (into the first array that make up the face
     * (in that order).
     *
     * Assumes that the orientations of the faces are consistent with each other.
     */
    constructor(vertex_array, face_array) {
        this.setup_mesh(vertex_array, face_array);
    }

    setup_mesh(vertex_array, face_array) {
        this.verts = new Array(vertex_array.length);
        this.faces = new Array(face_array.length);
        this.edges = [];
        this.poses = [];
        this.colors = [];

        this.twins = new Array(vertex_array.length);  // List used to process twins

        this.setup_vertices(vertex_array);
        this.setup_faces(face_array);
        this.fill_arrays(); // Fill the arrays now that construction is complete.
    }

    /**
     * Convert vertex array to objects.
     * This is called automatically from the constructor.
     * @param vertex_array Array of vertices from constructor.
     */
    setup_vertices(vertex_array) {
        for (let i = 0; i < vertex_array.length; i++) {
            let vertex = vertex_array[i];
            let new_vertex = new Vertex();
            new_vertex.pos = vertex[0];
            new_vertex.color = vertex[1];
            new_vertex.flag = 0;
            new_vertex.index = i;
            this.verts[i] = new_vertex;
            this.twins[i] = [];
        }
    }

    /**
     * Convert face array to objects.
     * This is called automatically from the constructor.
     * @param face_array Array of faces from constructor.
     */
    setup_faces(face_array) {
        for (let i = 0; i < face_array.length; i++) {
            let face = face_array[i];
            let new_face = new Face(null);
            let edges = [];

            // Construct the half edges of the face (three of them)
            for (let j = 0; j < 3; j++) {
                let vertex_index = face[j];
                let next_vertex_index = face[(j + 1) % 3];
                let new_edge = new Edge(this.verts[next_vertex_index], this.verts[vertex_index], null, null,
                    null, new_face);

                let min_vertex_index = Math.min(vertex_index, next_vertex_index);
                let max_vertex_index = Math.max(vertex_index, next_vertex_index);
                this.twins[min_vertex_index].push([max_vertex_index, new_edge]); // add (vertex, edge) to twin list
                edges.push(new_edge);
            }

            // Setup edge pointers (next/prev)
            for (let j = 0; j < 3; j++) {
                let next_index = (j + 1) % 3;
                edges[j].next = edges[next_index];
                edges[next_index].prev = edges[j];
            }

            new_face.edge = edges[0];
            this.faces[i] = new_face;
            this.edges = this.edges.concat(edges);
        }

        this.setup_twins();
    }

    /**
     * Glue the faces together by setting twin edges.
     */
    setup_twins() {
        for (let twinArray of this.twins) {
            twinArray.sort((a, b) => a[0] <= b[0]); // Sort twins by vertex index

            for (let j = 0; j < twinArray.length; j++) {
                if ((j + 1) < twinArray.length) {
                    let one = twinArray[j];
                    let two = twinArray[j + 1];
                    if (one[0] === two[0]) {
                        one[1].twin = two[1];
                        two[1].twin = one[1];
                        j++;
                    }
                }
            }
        }
    }

    /**
     * Implements Loop subdivision.
     */
    subdivide() {
        let new_vertices = this.add_odd_vertices();
        let face_array = this.create_face_array();
        this.adjust_vertices();
        let vertex_array = this.create_vertex_array(new_vertices);

        // Re-create mesh
        this.setup_mesh(vertex_array, face_array);
    }

    /**
     * First step in Loop subdivision scheme. We add a single odd vertex to each half edge. These odd edges will be
     * glued together into faces by create_face_array(). When setting an odd vertex to a half edge, also make sure to
     * set the odd vertex on its twin.
     * @returns {Array} Array of new Vertex objects that have been created.
     */
    add_odd_vertices() {
        let vertex_index = this.verts.length; // Index of new vertices starts at our current length
        let new_vertices = [];

        for (let face of this.faces) {
            let e = face.edge;
            for (let j = 0; j < 3; j++) {
                // Add a vertex if we don't have one set yet
                if (!e.odd) {
                    let new_vertex = new Vertex();
                    e.odd = new_vertex;
                    new_vertex.index = vertex_index;
                    new_vertices.push(new_vertex);
                    vertex_index++;

                    // Not a boundary edge
                    if (e.twin) {
                        new_vertex.set_to_average([e.head, e.tail, e.next.head, e.twin.next.head],
                            [3 / 8, 3 / 8, 1 / 8, 1 / 8], 0);
                        e.twin.odd = new_vertex; // Update our twin's vertex
                    } else {
                        new_vertex.set_to_average([e.head, e.tail], [1 / 2, 1 / 2], 0);
                    }
                }

                e = e.next;
            }
        }

        // Sort new vertices in ascending order by index
        new_vertices.sort((v1, v2) => v1.index - v2.index);
        return new_vertices;
    }

    /**
     * Creates an array of faces [index1, index2, index3] from the given mesh after subdividing.
     * This method assumings you have called add_odd_vertices() beforehand to set odd vertices.
     * @returns {Array} Array of vertex indexes.
     */
    create_face_array() {
        let face_array = [];
        for (let face of this.faces) {
            let e = face.edge;

            // Add outer triangle faces
            for (let i = 0; i < 3; i++) {
                face_array.push([e.odd.index, e.head.index, e.next.odd.index]); // cc-w
                e = e.next;
            }
            // Add inner triangle face
            face_array.push([e.odd.index, e.next.odd.index, e.next.next.odd.index]) // cc-w
        }

        return face_array;
    }

    /**
     * Creates an array of vertices from the given mesh and the added new_vertices.
     * This method assume that the order of this.verts has remained unchanged since mesh init.
     * @param new_vertices Array of new vertices created by add_odd_vertices()
     * @returns {Array} Mesh array of vertices [pos, color]
     */
    create_vertex_array(new_vertices) {
        let vertex_array = [];
        for (let v of this.verts.concat(new_vertices)) {
            vertex_array.push([v.pos, v.color]);
        }
        return vertex_array;
    }

    /**
     * Adjusts the position of all existing vertices according to the Loop subdivision scheme.
     */
    adjust_vertices() {
        let num_verts = this.verts.length;
        let updated_verts = [];

        for (let vertex of this.verts) {
            // Create a new vertex for the one which we're about to process. We can't mutate our vertices otherwise
            // it will mess up the weighting of other vertices yet to be processed
            let new_vertex = new Vertex();
            new_vertex.pos = vertex.pos;
            new_vertex.color = vertex.color;
            updated_verts.push(new_vertex);

            let boundary = false;
            let original_edge = vertex.edge;
            let edge = original_edge;
            let neighbors = [];

            do {
                if (!boundary) {
                    edge = edge.next;
                }

                neighbors.push(edge.head);
                if (edge.twin && !boundary) {
                    edge = edge.twin;
                } else {
                    boundary = true;
                    edge = edge.next.next.twin;
                }
            }
            while (edge !== original_edge && edge !== null);


            if (boundary) {
                // For boundary points only keep the first and last neighbors
                neighbors = [neighbors[0], neighbors[neighbors.length - 1]];
                new_vertex.set_to_average(neighbors, [1 / 8, 1 / 8], 3 / 4);
            } else {
                let num_neighbors = neighbors.length;
                let beta = (num_neighbors <= 3) ? 3 / 16 : (3 / (8 * num_neighbors));
                new_vertex.set_to_average(neighbors, Array(num_neighbors).fill(beta), (1 - num_neighbors * beta));
            }
        }

        // Update vertex positions once every vertex has been processed
        for (let i = 0; i < num_verts; i++) {
            let old_vertex = this.verts[i];
            let new_vertex = updated_verts[i];
            old_vertex.pos = new_vertex.pos; // This will break our pointers
            old_vertex.color = new_vertex.color;
        }
    }

    /**
     * Fill in the poses and colors arrays of the mesh. This method loops over every face and then every
     * edge of every face adding positions and colors in that order.
     *
     * Called automatically in the constructor of the Mesh. You should not call this manually.
     */
    fill_arrays() {
        for (let face of this.faces) {
            let edge = face.edge;
            for (let i = 0; i < 3; i++) {
                this.poses.push(edge.head.pos);
                this.colors.push(edge.head.color);
                edge = edge.next;
            }
            face.validate();
        }
    }

    /**
     * Returns the list of all vertices in the mesh
     * @returns {Array}
     */
    get get_pos() {
        return this.poses;
    }

    /**
     * Returns the list of colors of all vertices in the mesh
     * @returns {Array}
     */
    get get_color() {
        return this.colors;
    }
}
/**
 * Class which represents a vertex that is part of the Mesh data structure.
 */
class Vertex {

    constructor() {
        this.pos = vec4();
        this.color = vec4();
        this.flag = 0;
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
    }
}

/**
 * Class which represents a face that is part of the Mesh data structure.
 */
class Face {

    constructor(edge) {
        this.edge = edge;
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
        this.verts = new Array(vertex_array.length);
        this.faces = new Array(face_array.length);
        this.twins = new Array(vertex_array.length);  // List used to process twins
        this.poses = [];
        this.colors = [];

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
            new_vertex.odd = false;
            new_vertex.flag = 0;
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
        }

        this.setup_twins();
    }

    /**
     * Glue the faces together by setting twin edges.
     */
    setup_twins() {
        for (let i = 0; i < this.twins.length; i++) {
            this.twins[i].sort(function (a, b) { // Sort twins by vertex index
                return a[0] <= b[0];
            });

            let j = 0;
            while (j < this.twins[i].length) {
                if ((j + 1) < this.twins[i].length) {

                    if (this.twins[i][j][0] === this.twins[i][j + 1][0]) {
                        this.twins[i][j][1].twin = this.twins[i][j + 1][1];
                        this.twins[i][j + 1][1].twin = this.twins[i][j][1];
                        j++;
                    }
                }
                j++;
            }
        }
    }

    // TODO (Aidan) Implement me
    subdivide() {
        // IMPLEMENT ME!!!
    }

    /**
     * Fill in the poses and colors arrays of the mesh. This method loops over every face and then every
     * edge of every face adding positions and colors in that order.
     *
     * Called automatically in the constructor of the Mesh. You should not call this manually.
     */
    fill_arrays() {
        for (let i = 0; i < this.faces.length; i++) {
            let edge = this.faces[i].edge;
            for (let i = 0; i < 3; i++) {
                this.poses.push(edge.head.pos);
                this.colors.push(edge.head.color);
                edge.head.odd = false;
                edge.tail.odd = false;
                edge = edge.next;
            }
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
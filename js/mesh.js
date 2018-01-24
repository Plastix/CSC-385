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

class Edge {

    constructor(head, tail, next, prev, twin, face) {

        this.head = head;
        this.tail = tail;
        this.next = next;
        this.prev = prev;
        this.twin = twin;
        this.face = face;

    }


}

class Face {

    constructor(edge) {

        this.edge = edge;
        this.flag = 0; // Used to track whether the face is visited.

    }

    fill_arrays(flag, pos, color) {

        if (this.flag <= flag) {

            let i;
            let e = this.edge;

            this.flag = flag + 1;

            for (i = 0; i < 3; i++) {
                pos.push(e.head.pos);
                color.push(e.head.color);
                e.head.odd = false;
                e.head.flag = flag + 1;
                e.tail.odd = false;
                e.tail.flag = flag + 1;

                e = e.next;
            }

            for (i = 0; i < 3; i++) {
                if (e.twin != null)
                    e.twin.face.fill_arrays(flag, pos, color);
                e = e.next;
            }
        }

    }

}

class Mesh {

    // Takes two arrays and constructs a half-edge mesh.
    //
    // The first parameter is an array of vertices in the mesh. Each element of
    // the vertex array is a length three array containing the position,
    // the color, and the normal of the vertex as a vec4().
    //
    // The second parameter is an array of triangular faces in the mesh.
    // Each element of the face array is a face described by a length
    // three array containing the indices of the vertices (into the first array
    // that make up the face (in that order).

    // Assumes that the orientations of the faces are consistent with each other.
    constructor(vertex_array, face_array) {

        this.root_face = null;

        let verts = new Array(vertex_array.length);

        // Arrays to store edges to twin.
        let twins = new Array(vertex_array.length);

        // Convert vertex array to objects.
        let i;
        for (i = 0; i < vertex_array.length; i++) {

            let new_v = new Vertex();
            new_v.pos = vertex_array[i][0];
            new_v.color = vertex_array[i][1];
            new_v.odd = false;
            new_v.flag = 0;
            verts[i] = new_v;
            twins[i] = [];

        }

        // Convert face array to objects.
        let j;
        for (i = 0; i < face_array.length; i++) {
            let face = face_array[i];

            let new_face = new Face(null);
            let edges = [];
            for (j = 0; j < 3; j++) {
                let new_edge = new Edge(verts[face[(j + 1) % 3]], verts[face[j]], null, null, null, new_face);
                twins[Math.min(face[j], face[(j + 1) % 3])].push([Math.max(face[j], face[(j + 1) % 3]), new_edge]);
                edges.push(new_edge);
            }
            for (j = 0; j < 3; j++) {
                edges[j].next = edges[(j + 1) % 3];
                edges[(j + 1) % 3].prev = edges[j];
            }

            new_face.edge = edges[0];

            this.root_face = new_face; // Root is last face created.
        }

        // Glue the faces together by setting twin edges.
        for (i = 0; i < twins.length; i++) {

            twins[i].sort(function (a, b) {
                return a[0] <= b[0];
            });

            j = 0;

            while (j < twins[i].length) {

                if ((j + 1) < twins[i].length) {

                    if (twins[i][j][0] === twins[i][j + 1][0]) {
                        twins[i][j][1].twin = twins[i][j + 1][1];
                        twins[i][j + 1][1].twin = twins[i][j][1];
                        j++;
                    }
                }
                j++;

            }

        }

        // Fill the arrays now that construction is complete.
        this.fill_arrays();

    }

    subdivide() {

        // IMPLEMENT ME!!!

    }

    // Fill in the poses and colors arrays
    fill_arrays() {

        this.poses = [];
        this.colors = [];
        this.root_face.fill_arrays(this.root_face.flag, this.poses, this.colors);

    }


    get_pos() {

        return this.poses;

    }

    get_color() {

        return this.colors;
    }


}




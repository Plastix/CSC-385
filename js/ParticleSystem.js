// class ParticleSystem {
//
//
// }

let vertex_shader = [
    'uniform float time;',
    'uniform float gravity;',
    'attribute vec3 velocity;',
    'varying vec3 vColor;',
    'void main() {',
    'vec3 new_velocity = velocity + vec3(0, 0.00000001 * gravity * time, 0);',
    'vec3 new_position = position + vec3(0,-0.1,0);',
    'vColor = vec3(1.0,1.0,1.0);',
    'gl_Position = projectionMatrix * modelViewMatrix * vec4(new_position, 1.0);',
    'gl_PointSize = 10.0;',
    '}'
].join('\n');

let fragment_shader = [
    'varying vec3 vColor;',
    'void main() {',
    'gl_FragColor = vec4(vColor, 1.0);',
    '}'
].join('\n');

class Emitter {

    constructor() {
        // Emitter params
        // TODO (Aidan/Jerry) Don't hardcode these
        this.MAX_PARTICLES = 1000;
        this.PARTICLE_LIFESPAN = 2;
        this.PARTICLE_GRAVITY = -0.5;
        this.clock = new THREE.Clock();

        this.geo = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
            uniforms: {
                time: this.clock.getDelta(),
                gravity: this.PARTICLE_GRAVITY,
            },
            vertexShader: vertex_shader,
            fragmentShader: fragment_shader
        });
        this.object3D = new THREE.Points(this.geo, this.mat);
        this.init_buffers();
    }

    init_buffers() {
        this.positions = new Float32Array(this.MAX_PARTICLES * 3);

        for (let i = 0; i < this.MAX_PARTICLES; i += 3) {
            this.positions[i] = this.object3D.position.x + getRandomArbitrary(-10, 10);
            this.positions[i + 1] = this.object3D.position.y;
            this.positions[i + 2] = this.object3D.position.z;
        }

        let buf = new THREE.BufferAttribute(this.positions, 3).setDynamic(true);
        this.geo.addAttribute("position", buf);


        this.velocities = new Float32Array(this.MAX_PARTICLES * 3);
        let vel_buffer = new THREE.BufferAttribute(this.velocities, 3).setDynamic(true);
        this.geo.addAttribute("velocity", vel_buffer);
    }

    update() {
        this.mat.uniforms.time = this.clock.getDelta();

        let vel_buffer = this.geo.getAttribute("velocity");
        vel_buffer.updateRange.count = this.MAX_PARTICLES * vel_buffer.itemSize;
        vel_buffer.updateRange.offset = 0;
        vel_buffer.needsUpdate = true;

        let pos_buffer = this.geo.getAttribute("position");
        pos_buffer.updateRange.count = this.MAX_PARTICLES * pos_buffer.itemSize;
        pos_buffer.updateRange.offset = 0;
        pos_buffer.needsUpdate = true;

    }

    get_object3D() {
        return this.object3D;
    }
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
let vertex_shader = `
    varying vec3 vColor;
    
    void main() {
        vColor = vec3(1.0, 1.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 50.0;
    }
`;

let fragment_shader = `
    uniform sampler2D texture;
    
    varying vec3 vColor;
    
    void main() {
        gl_FragColor = vec4(vColor, 1.0);
        gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
    }
`;

const PARTICLE_GRAVITY = -0.5;

class Particle {
    constructor(pos, m, v, a, lifespan) {
        this.p = pos;
        this.m = m;
        this.v = v;
        this.a = a;
        this.age = 0;
        this.lifespan = lifespan;
    }

    is_dead() {
        return this.age > this.lifespan;
    }
}

class ParticleSystem {

    constructor() {
        this.MAX_PARTICLES = 10000;
        this.clock = new THREE.Clock();
        this.time = 0;

        let uniforms = {
            texture: {value: new THREE.TextureLoader().load("textures/sprites/spark1.png")}
        };

        this.geo = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertex_shader,
            fragmentShader: fragment_shader,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });
        this.object3D = new THREE.Points(this.geo, this.mat);
        this.init_particles();
        this.init_buffers();
    }

    init_particles() {
        this.particles = [];

        // TODO MOVE THIS
        for (let i = 0; i < 500; i++) {
            this.spawn_particle(new Particle(
                this.object3D.position.clone(),
                0,
                new THREE.Vector3(getRandomArbitrary(-1, 1), getRandomArbitrary(0, 1), getRandomArbitrary(-1, 1)),
                new THREE.Vector3(0, PARTICLE_GRAVITY, 0),
                0.4));
        }
    }

    spawn_particle(particle) {
        this.particles.push(particle);
    }

    init_buffers() {
        this.pos_buffer = new THREE.BufferAttribute(new Float32Array(this.MAX_PARTICLES * 3), 3).setDynamic(true);
        this.geo.addAttribute("position", this.pos_buffer);
    }

    update() {
        let dt = this.clock.getDelta();
        this.time += dt;

        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];
            let v = particle.v.clone();
            let p = particle.p.clone();
            let a = particle.a.clone();
            particle.p = p.add(v.multiplyScalar(this.time))
                .add(a.multiplyScalar(1 / 2 * Math.pow(this.time, 2)));
            particle.age += dt;

            if (particle.is_dead()) {
                this.particles.splice(i, i);
            }
        }
    }

    render() {
        this.update();
        this.updateBuffers();
        this.geo.setDrawRange(0, this.particles.length);
    }

    updateBuffers() {
        let j = 0;
        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];
            this.pos_buffer.array[j++] = particle.p.x;
            this.pos_buffer.array[j++] = particle.p.y;
            this.pos_buffer.array[j++] = particle.p.z;

        }

        this.pos_buffer.needsUpdate = true;
    }

    get_object3D() {
        return this.object3D;
    }
}


class Emitter {

    constructor() {
        // Emitter params
        
    }

}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
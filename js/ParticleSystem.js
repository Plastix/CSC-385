let vertex_shader = `
    uniform vec3 cameraPos;
    attribute float size;
    attribute float alpha;
    varying vec4 vColor;
    
    void main() {
        vColor = vec4(color, alpha);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
        float cameraDist = distance( mvPosition.xyz, cameraPos ) + 1.0;
        gl_PointSize = size / cameraDist;
    }
`;

let fragment_shader = `
    uniform sampler2D texture;
    
    varying vec4 vColor;
    
    void main() {
        gl_FragColor = vColor;
        gl_FragColor = gl_FragColor * texture2D(texture, gl_PointCoord);
    }
`;


class Body {
    constructor(p, m, v, F, time, r) {
        this.p = p;
        this.m = m;
        this.v = v;
        this.F = F;
        this.time = time;
        this.r = r;
    }


    update_position(dt) {
        this.time += dt;
        let v = this.v.clone();
        let p = this.p.clone();
        let F = this.F.clone();
        let a = F.multiplyScalar(1 / this.m);
        this.p = p.add(v.multiplyScalar(this.time))
            .add(a.multiplyScalar(1 / 2 * Math.pow(this.time, 2)));

    }

    update_position_numeric(dt) {
        let v0 = this.v.clone();
        let p0 = this.p.clone();
        let radius = this.r;
        let area = Math.PI * Math.pow(radius, 2);
        let v_square = v0.clone().length();
        let v_unit = v0.clone().normalize();
        let friction = v_unit.clone().multiplyScalar(-0.65 * area / 9.81 * (-scene_params.gravity) * v_square); // the default gravitation acceleration is -0.5
        let g = gravity_vector();
        let gravity = g.multiplyScalar(this.m);
        let initial_force = this.F.clone();
        let total = friction.clone().add(gravity).add(initial_force);
        let a = total.clone().multiplyScalar(1 / this.m);
        let dv = a.clone();
        let dp = this.v.clone();
        this.v = v0.add(dv.multiplyScalar(dt));
        this.p = p0.add(dp.multiplyScalar(dt));
        this.time += dt;
    }


}




class Particle {
    constructor(body, lifespan, color, size_bounds, alpha_bounds) {
        this.body = body;
        this.age = 0;
        this.lifespan = lifespan;
        this.color = color;
        this.size_bounds = size_bounds;
        this.alpha_bounds = alpha_bounds;
    }

    update(dt) {
        //this.body.update_position(dt);
        this.body.update_position_numeric(dt);
        this.age += dt;
    }

    get position() {
        return this.body.p
    }

    get size() {
        return lerp(this.size_bounds.x, this.size_bounds.y, this.age / this.lifespan)
    }

    get alpha() {
        return lerp(this.alpha_bounds.x, this.alpha_bounds.y, this.age / this.lifespan)
    }

    is_dead() {
        return this.age > this.lifespan;
    }
}

class ParticleSystem {

    constructor(camera) {
        this.clock = new THREE.Clock();
        this.camera = camera;

        this.uniforms = {
            texture: {value: new THREE.TextureLoader().load("textures/sprites/spark1.png")},
            cameraPos: {value: camera.position}
        };

        this.geo = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertex_shader,
            fragmentShader: fragment_shader,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });
        this.object3D = new THREE.Points(this.geo, this.mat);
        this.init_buffers();
        this.particles = [];
        this.emitters = [];
    }

    spawn_particle(particle) {
        if (this.particles.length < MAX_PARTICLES) {
            this.particles.push(particle);
        }
    }

    add_emitter(emitter) {
        this.emitters.push(emitter);
    }

    init_buffers() {
        this.pos_buffer = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3).setDynamic(true);
        this.geo.addAttribute("position", this.pos_buffer);
        this.color_buffer = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3).setDynamic(true);
        this.geo.addAttribute("color", this.color_buffer);
        this.size_buffer = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1).setDynamic(true);
        this.geo.addAttribute("size", this.size_buffer);
        this.alpha_buffer = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1).setDynamic(true);
        this.geo.addAttribute("alpha", this.alpha_buffer);
    }

    render() {
        this.update();
        this.updateBuffers();
        this.geo.setDrawRange(0, this.particles.length);
    }

    update() {
        let dt = this.clock.getDelta();
        this.update_emitters(dt);
        this.update_particles(dt);
    }

    update_particles(dt) {
        let particles = [];
        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];
            particle.update(dt);

            if (!particle.is_dead()) {
                particles.push(particle);
            }
        }
        this.particles = particles;
    }

    update_emitters(dt) {
        let emitters = [];
        for (let i = 0; i < this.emitters.length; i++) {
            let emitter = this.emitters[i];
            emitter.update(dt);

            if (!emitter.is_dead()) {
                emitters.push(emitter);
            }
        }
        this.emitters = emitters;
    }

    updateBuffers() {
        let j = 0;
        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];
            this.pos_buffer.array[j] = particle.position.x;
            this.color_buffer.array[j] = particle.color.x;
            j++;
            this.pos_buffer.array[j] = particle.position.y;
            this.color_buffer.array[j] = particle.color.y;
            j++;
            this.pos_buffer.array[j] = particle.position.z;
            this.color_buffer.array[j] = particle.color.z;
            j++;

            this.size_buffer.array[i] = particle.size;
            this.alpha_buffer.array[i] = particle.alpha;
        }

        this.pos_buffer.needsUpdate = true;
        this.size_buffer.needsUpdate = true;
        this.alpha_buffer.needsUpdate = true;
        this.color_buffer.needsUpdate = true;

        // Update uniforms
        this.uniforms.cameraPos.value = this.camera.position;
        this.uniforms.cameraPos.needsUpdate = true;
    }

    get_object3D() {
        return this.object3D;
    }
}


class Emitter {

    constructor(system, body, spawn_rate, lifespan, velocity_generator, force_generator, color_generator, age_generator, size_bounds, alpha_bounds) {
        // Emitter params
        this.system = system;
        this.body = body;

        this.spawn_rate = spawn_rate;
        this.max_spawn_rate = spawn_rate;
        this.lifespan = lifespan;
        this.age = 0;
        this.velocity_generator = velocity_generator;
        this.force_generator = force_generator;

        this.color_generator = color_generator;
        this.age_generator = age_generator;
        this.size_bounds = size_bounds;
        this.alpha_bounds = alpha_bounds;
    }


    update(dt) {
        this.age += dt;
        this.body.update_position(dt);

        this.spawn()
    }

    spawn() {
        for (let i = 0; i < this.spawn_rate; i++) {
            //let gravity = gravity_vector().multiplyScalar(m);
            if (firework_params.firework_type == SMILE){
                let max = this.spawn_rate;
                let p = i/max;
                this.system.spawn_particle(new Particle(
                    new Body(this.body.p, firework_params.mass, this.velocity_generator(), this.force_generator(p, i, max), 0, firework_params.particle_radius),
                    this.age_generator(),
                    this.color_generator(),
                    this.size_bounds,
                    this.alpha_bounds
                ));
            }else {
                this.system.spawn_particle(new Particle(
                    new Body(this.body.p, firework_params.mass, this.velocity_generator(), this.force_generator(), 0, firework_params.particle_radius),
                    this.age_generator(),
                    this.color_generator(),
                    this.size_bounds,
                    this.alpha_bounds
                ));
            }
        }
    }

    is_dead() {
        return this.age > this.lifespan;
    }

}

class Shell extends Emitter {


    constructor(system, body, spawn_rate, lifespan, velocity_generator, force_generator, color_generator, age_generator,
                size_bounds, alpha_bounds) {
        super(system, body, spawn_rate, lifespan, velocity_generator, force_generator, color_generator, age_generator,
            size_bounds, alpha_bounds);
    }

    update(dt) {
        super.update(dt);
        this.spawn_rate = Math.floor(lerp(this.max_spawn_rate, 0, this.age / this.lifespan));
    }

    is_dead() {
        let dead = super.is_dead();

        if (dead) {
            let vel_func = this.get_velocity_function();
            let age_func = () => getRandomArbitrary(firework_params.age_min, firework_params.age_max);
            let velocity = new THREE.Vector3(0, 0, 0);
            let force_func = this.get_force_function();
            let body = new Body(this.body.p, firework_params.mass, velocity, zero_vector(), 0, firework_params.particle_radius);
            let size_bounds = new THREE.Vector2(firework_params.size_max, firework_params.size_min);
            let alpha_bounds = new THREE.Vector2(firework_params.alpha_max, firework_params.alpha_min);
            let emitter = new Emitter(system, body, firework_params.particle_num, 0, vel_func, force_func, rainbow, age_func,
                size_bounds, alpha_bounds);
            this.system.add_emitter(emitter)
        }

        return dead
    }

    get_velocity_function() {
        switch (firework_params.firework_type) {
            case FIREWORK_SPHERE:
                return () => {
                    let vel = new THREE.Vector3(0, firework_params.velocity, 0);
                    vel.applyAxisAngle(X_AXIS, getRandomArbitrary(-2 * Math.PI, 2 * Math.PI));
                    vel.applyAxisAngle(Z_AXIS, getRandomArbitrary(-2 * Math.PI, 2 * Math.PI));

                    return vel;
                };
            case FIREWORK_CUBE:
                return () => new THREE.Vector3(
                    getRandomArbitrary(-firework_params.velocity, firework_params.velocity),
                    getRandomArbitrary(-firework_params.velocity, firework_params.velocity),
                    getRandomArbitrary(-firework_params.velocity, firework_params.velocity));

            case FIREWORK_FAN:
                let vel_base = new THREE.Vector3(0, firework_params.velocity, 0);
                vel_base.applyAxisAngle(X_AXIS, getRandomArbitrary(Math.PI / -4, Math.PI / 4));
                vel_base.applyAxisAngle(Z_AXIS, getRandomArbitrary(Math.PI / -4, Math.PI / 4));

                return () => {
                    let vel = vel_base.clone().multiplyScalar(getRandomArbitrary(0.2, 1));
                    vel.applyAxisAngle(X_AXIS, getRandomArbitrary(Math.PI / -16, Math.PI / 16));
                    vel.applyAxisAngle(Z_AXIS, getRandomArbitrary(Math.PI / -16, Math.PI / 16));

                    return vel;
                };
            default:
                return zero_vector;


        }
    }

    get_force_function() {
        switch (firework_params.firework_type) {
            case SPHERE_NUMERIC:
                return () => {
                    let force = new THREE.Vector3(0, firework_params.init_force, 0);
                    force.applyAxisAngle(X_AXIS, getRandomArbitrary(-2 * Math.PI, 2 * Math.PI));
                    force.applyAxisAngle(Z_AXIS, getRandomArbitrary(-2 * Math.PI, 2 * Math.PI));

                    return force;
                };


            case SMILE:
                return (p,i, max) => {
                    if (p < 0.25) {
                        let mid = max * 0.125;
                        let range = max * 0.25 - mid;

                        console.log(p);
                        console.log(i);
                        console.log(mid);
                        console.log(max);
                        let x = 0;
                        if (i < mid) {
                            x = -firework_params.init_force - 0.5 * firework_params.init_force * (Math.abs(i - mid) / range);
                        } else {
                            x = -firework_params.init_force + 0.5 * firework_params.init_force * (Math.abs(i - mid) / range);
                        }

                        let y = firework_params.init_force + 0.5 * firework_params.init_force * Math.abs(Math.abs(i-mid)/range-1);
                        let force = new THREE.Vector3(x, y, firework_params.init_force);

                        return force;
                    } else if (p < 0.5) {
                        let mid = max * 0.375;
                        let range = max * 0.5 - mid;
                        let x = 0;
                        if (i < mid) {
                            x = firework_params.init_force - 0.5 * firework_params.init_force * (Math.abs(i-mid)/range);
                        } else {
                            x = firework_params.init_force + 0.5 * firework_params.init_force * (Math.abs(i-mid)/range);
                        }

                        let y = firework_params.init_force + 0.5 * firework_params.init_force * Math.abs(Math.abs(i-mid)/range-1);
                        let force = new THREE.Vector3(x, y, firework_params.init_force);

                        return force;
                    } else {
                        let mid = max * 0.75;
                        let range = max - mid;
                        let x = 0;
                        if (i < mid) {
                            x = -firework_params.init_force * (Math.abs(i-mid)/range);
                        } else {
                            x = firework_params.init_force * (Math.abs(i-mid)/range);
                        }

                        let y = firework_params.init_force * (Math.abs(i-mid)/range);
                        let force = new THREE.Vector3(x, y, firework_params.init_force);
                        return force;
                    }
                };

            default:
                return zero_vector;

        }
    }
}
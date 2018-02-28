// class ParticleSystem {
//
//
// }


let vertex_shader = [
    'varying vec3 vColor;',
    'void main() {',
    'vColor = vec3(1.0,1.0,1.0);',
    'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
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
        this.geo = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
            vertexShader: vertex_shader,
            fragmentShader: fragment_shader
        });

        this.MAX_PARTICLES = 1000;

        this.init_buffers();
    }

    init_buffers() {

    }

    init_object3d() {
        return new THREE.Points(this.geo, this.mat);
    }
}
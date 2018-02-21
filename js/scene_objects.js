
// Types of light sources.
const AMBIENT_LIGHT = 0;
const POINT_LIGHT = 1;

/**
 * A basic light source class.
 */
class Light{

    /**
     * @param color {vec3} The color of the light.
     * @param pos {vec3} The position of the light, if relevant, null otherwise.
     * @param type {number} The type of light.  Currently only AMBIENT_LIGHT
     * and POINT_LIGHT supported.
     */
    constructor(color, pos, type){

        this.color = color;
        this.pos = pos;
        this.type = type;

    }

}


/**
 * Class for representing spherical scene objects with
 * Phong material properties.
 */
class SphereObject {

    /**
     * Sphere constructor.
     *
     * @param pt {vec3} Center point
     * @param rad {number} Radius
     * @param ka {vec3} Ambient coefficients
     * @param kd {vec3} Diffuse coefficients
     * @param ks {vec3} Specular coefficients
     * @param alpha {number} Shininess
     */
    constructor(pt, rad, ka, kd, ks, alpha) {

        this.pt = pt;
        this.rad = rad;
        this.ka = ka;
        this.kd = kd;
        this.ks = ks;
        this.alpha = alpha;

    }


}
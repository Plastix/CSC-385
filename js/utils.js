function lerp(a, b, f) {
    return a + f * (b - a);
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
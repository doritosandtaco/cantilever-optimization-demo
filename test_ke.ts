import { getElementStiffness } from './src/solver/element';
const Ke = getElementStiffness(210000, 0.3, 10, 2.5, 2.5);
console.log(Ke.slice(0, 8));

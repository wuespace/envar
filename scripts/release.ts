import 'npm:conventional-changelog-angular';
import {Bumper} from 'npm:conventional-recommended-bump';

const bumper = new Bumper(Deno.cwd()).loadPreset('angular');
const bump = await bumper.bump();
console.log(bump.releaseType); // major, minor, patch

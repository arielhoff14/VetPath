/** Minimal, non-clinical extraction. This never assigns urgency or diagnoses a pet. */
export function extractIntent(text:string){const value=text.toLowerCase();const species=/\b(dog|puppy|canine)\b/.test(value)?'dog':/\b(cat|kitten|feline)\b/.test(value)?'cat':/\b(rabbit|bunny)\b/.test(value)?'rabbit':/\b(bird|parrot)\b/.test(value)?'bird':undefined;return {species};}

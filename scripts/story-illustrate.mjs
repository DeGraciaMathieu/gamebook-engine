// Génère les illustrations d'une histoire avec l'API Images d'OpenAI, une fois pour toutes :
// chaque paragraphe avec `image.prompt` et sans fichier reçoit son image dans le dossier de l'histoire.
// Usage : OPENAI_API_KEY=… node scripts/story-illustrate.mjs stories/<id>/story.json [--only 1,28] [--force] [--model gpt-image-1] [--quality medium] [--size 1024x1024]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { validateStory } from '../src/engine/story.js';

const args = process.argv.slice(2);
const path = args.find((arg) => !arg.startsWith('--'));
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
if (!path) {
  console.error('Usage : OPENAI_API_KEY=… node scripts/story-illustrate.mjs stories/<id>/story.json [--only 1,28] [--force] [--model gpt-image-1] [--quality medium] [--size 1024x1024]');
  process.exit(2);
}
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY manquante');
  process.exit(2);
}
const only = option('only', '').split(',').filter(Boolean);
const force = args.includes('--force');
const model = option('model', 'gpt-image-1');
const quality = option('quality', 'medium');
const size = option('size', '1024x1024');

const story = JSON.parse(readFileSync(path, 'utf8'));
const errors = validateStory(story);
if (errors.length > 0) {
  console.error(`Histoire invalide :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

const pending = Object.entries(story.paragraphs)
  .filter(([id, paragraph]) => paragraph.image?.prompt && (only.length === 0 || only.includes(id)))
  .filter(([, paragraph]) => force || !existsSync(join(dirname(path), paragraph.image.src)));
if (pending.length === 0) {
  console.log('Rien à générer');
  process.exit(0);
}

for (const [id, paragraph] of pending) {
  const file = join(dirname(path), paragraph.image.src);
  console.log(`paragraphe ${id} → ${file}`);
  const image = await generate([story.art?.style, paragraph.image.prompt].filter(Boolean).join('\n\n'));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, image);
}

async function generate(prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, prompt, size, quality, n: 1, output_format: 'webp', output_compression: 80 }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status} : ${await response.text()}`);
  }
  const { data } = await response.json();
  return Buffer.from(data[0].b64_json, 'base64');
}

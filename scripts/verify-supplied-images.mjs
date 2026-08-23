import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const mapSource = readFileSync(resolve(root, 'src/data/supplied-course-images.ts'), 'utf8');
const newBatchMapSource = readFileSync(resolve(root, 'src/data/new-batch-supplied-course-images.ts'), 'utf8');
const appSource = readFileSync(resolve(root, 'src/main.tsx'), 'utf8');
const styleSource = readFileSync(resolve(root, 'src/style.css'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(root, 'public/course-images/vocabulary/manifest.json'), 'utf8'));
const newBatchManifest = JSON.parse(readFileSync(resolve(root, 'public/course-images/vocabulary/new-batch-manifest.json'), 'utf8'));

function countMapEntries(source, prefix, grade) {
  const section = source.match(new RegExp(`export const ${prefix}${grade}Images: Record<string, string> = \\{([\\s\\S]*?)\\n\\};`));
  assert.ok(section, `Missing ${prefix}${grade} map`);
  return [...section[1].matchAll(/^  "/gm)].length;
}

assert.equal(countMapEntries(mapSource, 'supplied', 'Grade4'), 361);
assert.equal(countMapEntries(mapSource, 'supplied', 'Grade5'), 524);
assert.equal(countMapEntries(mapSource, 'supplied', 'Grade6'), 238);
assert.equal(countMapEntries(newBatchMapSource, 'newBatch', 'Grade4'), 10);
assert.equal(countMapEntries(newBatchMapSource, 'newBatch', 'Grade5'), 0);
assert.equal(countMapEntries(newBatchMapSource, 'newBatch', 'Grade6'), 96);
assert.equal(newBatchManifest.items.length, 106);
assert.equal(manifest.items.length, 1231);
assert.match(appSource, /newBatchImagesByGrade\[grade\]\[normalizeTerm\(card\.sourceTerm \|\| card\.term\)\] \?\? suppliedImagesByGrade/);
assert.match(appSource, /grade5InteractiveLessons/);
assert.match(appSource, /sf-course-nav/);
assert.match(appSource, /sf-flip-stage/);
assert.match(appSource, /setIsCardFlipped\(true\)/);
assert.match(appSource, /اضغط على الكلمة مرة ثانية لتكشف الصورة/);
assert.match(styleSource, /\.sf-flip-stage\.is-flipped \.sf-flip-inner/);
assert.match(styleSource, /\.sf-unit-group\.is-active/);
assert.ok(existsSync(resolve(root, 'public/course-images/vocabulary/grade4/0001-acts-of-kindness.jpg')));
assert.ok(existsSync(resolve(root, 'public/course-images/vocabulary/grade5/0006-admire.jpg')));
assert.ok(existsSync(resolve(root, 'public/course-images/vocabulary/grade6/0001-a-great-place-to.jpg')));
assert.ok(existsSync(resolve(root, 'public/course-images/vocabulary/grade4/new-009-street.jpg')));
assert.ok(existsSync(resolve(root, 'public/course-images/vocabulary/grade6/new-001-a-bundle-of-sticks.jpg')));

console.log('Verified 1,231 term-to-image links, the new Dropbox batch, local vocabulary assets, and the original-style student interface hooks.');

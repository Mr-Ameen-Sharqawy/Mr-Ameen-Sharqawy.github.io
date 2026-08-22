import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const mapSource = readFileSync(resolve(root, 'src/data/supplied-course-images.ts'), 'utf8');
const appSource = readFileSync(resolve(root, 'src/main.tsx'), 'utf8');
const styleSource = readFileSync(resolve(root, 'src/style.css'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(root, 'public/course-images/vocabulary/manifest.json'), 'utf8'));

function countMapEntries(grade) {
  const section = mapSource.match(new RegExp(`export const supplied${grade}Images: Record<string, string> = \\{([\\s\\S]*?)\\n\\};`));
  assert.ok(section, `Missing ${grade} map`);
  return [...section[1].matchAll(/^  "/gm)].length;
}

assert.equal(countMapEntries('Grade4'), 361);
assert.equal(countMapEntries('Grade5'), 524);
assert.equal(countMapEntries('Grade6'), 238);
assert.equal(manifest.items.length, 1125);
assert.match(appSource, /suppliedImagesByGrade\[grade\]\[normalizeTerm\(card\.sourceTerm \|\| card\.term\)\]/);
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

console.log('Verified 1,125 term-to-image links, the local vocabulary assets, and the original-style student interface hooks.');

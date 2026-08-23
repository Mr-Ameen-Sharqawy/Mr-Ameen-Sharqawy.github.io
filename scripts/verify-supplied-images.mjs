import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const mapSource = readFileSync(resolve(root, 'src/data/supplied-course-images.ts'), 'utf8');
const newBatchMapSource = readFileSync(resolve(root, 'src/data/new-batch-supplied-course-images.ts'), 'utf8');
const googleDriveBatchMapSource = readFileSync(resolve(root, 'src/data/google-drive-batch-course-images.ts'), 'utf8');
const semanticFallbackMapSource = readFileSync(resolve(root, 'src/data/semantic-fallback-course-images.ts'), 'utf8');
const appSource = readFileSync(resolve(root, 'src/main.tsx'), 'utf8');
const firebaseAuthSource = readFileSync(resolve(root, 'src/lib/firebase-auth.ts'), 'utf8');
const styleSource = readFileSync(resolve(root, 'src/style.css'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(root, 'public/course-images/vocabulary/manifest.json'), 'utf8'));
const newBatchManifest = JSON.parse(readFileSync(resolve(root, 'public/course-images/vocabulary/new-batch-manifest.json'), 'utf8'));
const semanticFallbackManifest = JSON.parse(readFileSync(resolve(root, 'public/course-images/vocabulary/semantic-fallback-manifest.json'), 'utf8'));

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
assert.equal(countMapEntries(googleDriveBatchMapSource, 'googleDriveBatch', 'Grade4'), 1);
assert.equal(countMapEntries(googleDriveBatchMapSource, 'googleDriveBatch', 'Grade6'), 148);
assert.equal(countMapEntries(semanticFallbackMapSource, 'semanticFallback', 'Grade4'), 1);
assert.equal(countMapEntries(semanticFallbackMapSource, 'semanticFallback', 'Grade5'), 0);
assert.equal(countMapEntries(semanticFallbackMapSource, 'semanticFallback', 'Grade6'), 10);
assert.equal(newBatchManifest.items.length, 106);
assert.equal(semanticFallbackManifest.items.length, 11);
assert.equal(manifest.items.length, 1242);
assert.match(appSource, /const cardImageKey = normalizeTerm\(card\.term\)/);
assert.match(appSource, /googleDriveBatchImagesByGrade\[grade\]\[cardImageKey\] \?\? googleDriveBatchImagesByGrade\[grade\]\[sourceImageKey\]/);
assert.match(appSource, /function StudentLogin\(\)/);
assert.match(appSource, /الحسابات ينشئها المعلم فقط/);
assert.match(appSource, /onAuthStateChanged\(firebaseAuth/);
assert.match(firebaseAuthSource, /signInWithEmailAndPassword/);
assert.match(firebaseAuthSource, /STUDENT_EMAIL_DOMAIN/);
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
assert.ok(existsSync(resolve(root, 'public/course-images/vocabulary/grade4/semantic-001-safely.jpg')));
assert.ok(existsSync(resolve(root, 'public/course-images/vocabulary/grade6/semantic-007-tied-together.jpg')));
assert.ok(existsSync(resolve(root, 'public/course-images/vocabulary/drive/drive-001-children-crossing-road-safely-202608230507.jpg')));
assert.ok(existsSync(resolve(root, 'public/course-images/vocabulary/drive/drive-115-balloons-tied-together-202608230538.jpg')));

console.log('Verified the original, Dropbox, Google Drive, and semantic image maps, local vocabulary assets, and the original-style student interface hooks.');

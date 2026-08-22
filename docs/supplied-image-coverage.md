# Coverage of Supplied Vocabulary Images

The public student site now uses local, repository-hosted images whenever the uploaded image archive contains a reviewed match for a vocabulary item. The link between a term and its image is generated into `src/data/supplied-course-images.ts`; it is deliberately separate from the course data so that later image additions do not require recreating lessons.

| Grade | Course terms | Current mapped terms | Fallback terms |
| --- | ---: | ---: | ---: |
| Grade 4 | 469 | 361 | 108 |
| Grade 5 | 562 | 524 | 38 |
| Grade 6 | 563 | 238 | 325 |

For each mapped term, the card displays `/course-images/vocabulary/...` directly from GitHub Pages. For a term that does not yet have a reviewed image, the card preserves the existing local lesson cover rather than showing a broken link.

To add a future image batch, place the files in the controlled image workspace, update the approved course asset map, regenerate the optimized images and `supplied-course-images.ts`, run `pnpm test` and `pnpm build`, then publish the rebuilt root assets.

# Carbon-Copy Student Interface Verification

The GitHub Pages student interface has been rebuilt around the same unit-first course rail, lesson marker, bilingual hero, progress row, recall-first flashcard, answer options, and next-card controls used by the Manus student interface.

During the local source preview on 22 August 2026, Grade 5 opened with the `water weeds` card in its pre-reveal state. The picture was intentionally hidden on the visible card face, while the matching local image remained ready on the reverse face. Pressing the word once changed the prompt to “press a second time to reveal the picture.” Pressing it again flipped the card and displayed the local `water weeds` image.

The same sequence was rechecked on the deployed `github.io` URL after the Pages deployment completed. The public page loaded the five-unit course rail, opened with the image hidden, updated the second-press hint after the first press, and then displayed the local image on the flipped card after the second press.

The responsive source preview was also checked at a 375 × 812 phone viewport. The course rail condensed into the original-style menu control, while the hero, progress row, word-first card, and answer controls remained visible and legible without horizontal overflow.

## Final original-versus-public check

On 23 August 2026, the signed-in Manus student interface and the deployed GitHub Pages interface were both reviewed at a 375 × 812 viewport on Grade 5, Unit 1, Lesson 1. Both views retained the compact menu header, bilingual lesson hero, progress marker, recall-first `water weeds` card, sentence prompt, and answer controls in the same mobile order.

The public card was captured before reveal and again after a first press, a short state-update pause, and a second press. The second press replaced the word-first face with the matching local `water weeds` illustration, as intended. The remaining deliberate differences are the public page's local-only progress and generic back control in place of the signed-in student's name and server-backed account actions; GitHub Pages does not provide teacher access, authentication, or centralized progress.

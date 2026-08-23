import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Award, BadgeCheck, BookOpen, ChevronLeft, ChevronRight, CircleCheck, CircleX, Menu, RotateCcw, Shuffle, Sparkles, X } from "lucide-react";
import { buildWordOptions, courseLessons, courseUnits, sentenceWithBlank, type CourseCard } from "./data/course";
import { grade5CourseUnits, grade5InteractiveLessons } from "./data/grade5-course";
import { grade6CourseUnits, grade6InteractiveLessons } from "./data/grade6-course";
import { suppliedImagesByGrade } from "./data/supplied-course-images";
import { newBatchImagesByGrade } from "./data/new-batch-supplied-course-images";
import "./style.css";

type Grade = "grade4" | "grade5" | "grade6";
type Progress = { selectedLessonId?: string; lessonAnswers: Record<string, Record<string, string>> };

const gradeMeta: Record<Grade, { title: string; english: string; accent: string; description: string; note: string }> = {
  grade4: { title: "الصف الرابع", english: "Grade 4", accent: "gold", description: "20 درسًا · بطاقات وصور واختبارات", note: "رحلة مفردات هادئة ومنظمة لكل وحدة." },
  grade5: { title: "الصف الخامس", english: "Grade 5", accent: "mint", description: "20 درسًا · 609 مفردة وعبارة", note: "بطاقات وصور كرتونية واختبارات لكل وحدة." },
  grade6: { title: "الصف السادس", english: "Grade 6", accent: "violet", description: "20 درسًا · 609 مفردة وعبارة", note: "بطاقات وصور مراجَعة واختبارات لكل وحدة." },
};

const gradeCourses = {
  grade4: { lessons: courseLessons, units: courseUnits },
  grade5: { lessons: grade5InteractiveLessons, units: grade5CourseUnits },
  grade6: { lessons: grade6InteractiveLessons, units: grade6CourseUnits },
};

function normalizeTerm(term: string) {
  return term.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function say(term: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(term.replace(/[!?.]/g, ""));
  utterance.lang = "en-US";
  utterance.rate = 0.78;
  window.speechSynthesis.speak(utterance);
}

function GradeHome({ onSelect }: { onSelect: (grade: Grade) => void }) {
  return <main className="grade-home" dir="rtl"><header className="public-header"><div className="brand"><span>VOCABULARY JOURNEY</span><strong>اختيار الصف</strong></div><span className="public-chip">بوابة الطلاب</span></header><section className="intro"><div className="intro-icon"><BookOpen size={29} /></div><p>اختر رحلتك التعليمية</p><h1>أي صف ستتعلم اليوم؟</h1><span>يُحفظ تقدمك المحلي منفصلًا لكل صف ووحدة.</span></section><section className="grade-grid">{(Object.keys(gradeMeta) as Grade[]).map((grade) => <article className={`grade-card ${gradeMeta[grade].accent}`} key={grade}><div className="grade-card-icon">{grade === "grade5" ? <BookOpen size={26} /> : <Sparkles size={26} />}</div><p>{grade === "grade4" ? "PRIMARY 4" : grade === "grade5" ? "PRIMARY 5" : "PRIMARY 6"}</p><h2>{gradeMeta[grade].english}</h2><span>{gradeMeta[grade].description}</span><small>{gradeMeta[grade].note}</small><button onClick={() => onSelect(grade)}>ابدأ {gradeMeta[grade].english}<ChevronLeft size={17} /></button></article>)}</section><p className="static-note">هذه نسخة عامة من المنصة للتعلم الذاتي؛ لا تحفظ بيانات الدخول أو التقدم على خادم.</p></main>;
}

function StudentCourse({ grade, onBack }: { grade: Grade; onBack: () => void }) {
  const { lessons, units } = gradeCourses[grade];
  const label = grade === "grade4" ? "PRIMARY 4" : grade === "grade5" ? "PRIMARY 5" : "PRIMARY 6";
  const storageKey = `vocflashcard-public-${grade}-progress-v2`;
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0].id);
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  const [deck, setDeck] = useState<CourseCard[]>(selectedLesson.cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Progress["lessonAnswers"]>({});
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [hasHeardWord, setHasHeardWord] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Partial<Progress>;
      if (saved.selectedLessonId && lessons.some((lesson) => lesson.id === saved.selectedLessonId)) setSelectedLessonId(saved.selectedLessonId);
      if (saved.lessonAnswers) setAnswers(saved.lessonAnswers);
    } catch { /* A malformed local record starts fresh. */ }
  }, [storageKey, lessons]);
  useEffect(() => localStorage.setItem(storageKey, JSON.stringify({ selectedLessonId, lessonAnswers: answers })), [answers, selectedLessonId, storageKey]);
  useEffect(() => { setDeck(selectedLesson.cards); setCurrentIndex(0); setIsCardFlipped(false); setHasHeardWord(false); }, [selectedLesson]);

  const card = deck[currentIndex] ?? selectedLesson.cards[0];
  const options = useMemo(() => buildWordOptions(deck, card), [deck, card]);
  const sentence = useMemo(() => sentenceWithBlank(card), [card]);
  const lessonAnswers = answers[selectedLesson.id] ?? {};
  const selectedAnswer = lessonAnswers[card.id];
  const hasAnswered = selectedAnswer !== undefined;
  const selectedOption = hasAnswered ? options.findIndex((option) => option === selectedAnswer) : undefined;
  const reviewedCount = Object.keys(lessonAnswers).length;
  const totalReviewed = Object.values(answers).reduce((sum, value) => sum + Object.keys(value).length, 0);
  const totalCorrect = Object.entries(answers).reduce((sum, [lessonId, value]) => {
    const lesson = lessons.find((item) => item.id === lessonId);
    return sum + Object.entries(value).filter(([cardId, answer]) => lesson?.cards.some((item) => item.id === cardId && item.term === answer)).length;
  }, 0);
  const image = newBatchImagesByGrade[grade][normalizeTerm(card.sourceTerm || card.term)] ?? suppliedImagesByGrade[grade][normalizeTerm(card.sourceTerm || card.term)] ?? selectedLesson.image;

  const resetReveal = () => { setIsCardFlipped(false); setHasHeardWord(false); };
  const selectLesson = (lessonId: string) => { setSelectedLessonId(lessonId); setIsRailOpen(false); };
  const moveCard = (direction: -1 | 1) => { setCurrentIndex((index) => Math.max(0, Math.min(deck.length - 1, index + direction))); resetReveal(); };
  const pressWord = () => { if (!hasHeardWord) { setHasHeardWord(true); say(card.term); } else { say(card.term); setIsCardFlipped(true); } };
  const choose = (index: number) => {
    if (hasAnswered) return;
    const word = options[index];
    setAnswers((previous) => ({ ...previous, [selectedLesson.id]: { ...(previous[selectedLesson.id] ?? {}), [card.id]: word } }));
    if (word === card.term) { setCelebration("أحسنت! إجابة صحيحة"); window.setTimeout(() => setCelebration(null), 1600); }
  };
  const shuffle = () => { setDeck((previous) => [...previous].sort(() => Math.random() - 0.5)); setCurrentIndex(0); resetReveal(); };
  const reset = () => { setDeck(selectedLesson.cards); setCurrentIndex(0); setAnswers((previous) => { const next = { ...previous }; delete next[selectedLesson.id]; return next; }); resetReveal(); };

  return <main className="sf-app" dir="rtl">
    <header className="sf-topbar"><div className="sf-brand" dir="ltr"><div className="sf-brand-logo"><BookOpen size={27} /></div><div><p className="sf-brand-kicker">{label} · LITTLE WORD EXPLORERS</p><p className="sf-brand-name">Vocabulary Flashcards <span>Workbook</span></p></div></div><div className="sf-top-actions"><button className="sf-student-chip" onClick={onBack}><span>الصفوف</span><small>رجوع</small></button><div className="sf-score-chip" aria-label={`Score ${totalCorrect} out of ${totalReviewed}`} dir="ltr"><BadgeCheck size={17} /><span>{totalCorrect}</span><small> / {totalReviewed} right</small></div><button className="sf-menu-button" onClick={() => setIsRailOpen(true)} aria-label="Open course navigation"><Menu size={22} /></button></div></header>
    <div className="sf-shell"><aside className={`sf-rail ${isRailOpen ? "is-open" : ""}`} aria-label="Course navigation"><div className="sf-rail-mobile-head"><span>Course map</span><button onClick={() => setIsRailOpen(false)} aria-label="Close course navigation"><X size={20} /></button></div><div className="sf-lesson-marker" style={{ backgroundColor: selectedLesson.color }}><span>UNIT</span><strong>{String(selectedLesson.unit).padStart(2, "0")}</strong><em dir="ltr">LESSON {selectedLesson.lesson}</em></div><div className="sf-rail-copy"><p className="sf-rail-eyebrow">{label} · COURSE MAP</p><h1>{selectedLesson.unitArabic}</h1><p dir="ltr">{selectedLesson.title}</p></div><nav className="sf-course-nav" aria-label="Units and lessons">{units.map((unit) => { const unitLessons = lessons.filter((lesson) => lesson.unit === unit.unit); const active = unit.unit === selectedLesson.unit; return <section className={`sf-unit-group ${active ? "is-active" : ""}`} key={unit.unit}><div className="sf-unit-heading"><span className="sf-section-dot" style={{ backgroundColor: unit.color }} /><span dir="ltr">UNIT {String(unit.unit).padStart(2, "0")}</span><small>{unitLessons.length} lessons</small><button className="sf-unit-quiz-button" onClick={() => setCelebration(`اختبار الوحدة ${unit.unit} متاح داخل المنصة الكاملة.`)} aria-label={`Start Unit ${unit.unit} quiz`}><Award size={14} /></button></div><div className="sf-lesson-links">{unitLessons.map((lesson) => <button key={lesson.id} className={`sf-section-link ${lesson.id === selectedLesson.id ? "is-active" : ""}`} onClick={() => selectLesson(lesson.id)}><span className="sf-lesson-number" dir="ltr">L {lesson.lesson}</span><span className="sf-section-title" dir="ltr">{lesson.title}</span><small>{lesson.cards.length}</small></button>)}</div></section>; })}</nav><div className="sf-rail-footer"><div className="sf-mini-progress"><span style={{ width: `${(reviewedCount / Math.max(deck.length, 1)) * 100}%`, backgroundColor: selectedLesson.color }} /></div><p>{reviewedCount} من {deck.length} بطاقة تمت مراجعتها</p></div></aside>
      <section className="sf-workspace"><section className="sf-hero" style={{ backgroundImage: `url(${selectedLesson.image})` }}><div className="sf-hero-content"><div className="sf-hero-label"><Sparkles size={15} /> Unit {selectedLesson.unit} · Lesson {selectedLesson.lesson}</div><h2>{selectedLesson.unitArabic}<br /><span dir="ltr">{selectedLesson.title}</span></h2><p>خلّي الطفل يسمع الكلمة، يتخيل معناها، ثم يثبتها في جملة قصيرة.</p></div><div className="sf-hero-note" dir="ltr"><BookOpen size={16} /> {deck.length} picture-led cards</div></section><div className="sf-progress-row"><div><p className="sf-overline" dir="ltr">UNIT {selectedLesson.unit} · LESSON {selectedLesson.lesson}</p><p className="sf-progress-title" dir="ltr">Card {String(currentIndex + 1).padStart(2, "0")} <span>of {deck.length}</span></p></div><div className="sf-progress-track"><span style={{ width: `${((currentIndex + 1) / Math.max(deck.length, 1)) * 100}%`, backgroundColor: selectedLesson.color }} /></div></div><article className="sf-flashcard" key={card.id}><div className="sf-card-visual"><div className={`sf-flip-stage ${isCardFlipped ? "is-flipped" : ""}`}><div className="sf-flip-inner"><section className="sf-flip-face sf-flip-front"><div className="sf-guess-content"><p className="sf-guess-kicker">BEFORE YOU LISTEN</p><button className={`sf-guess-word ${hasHeardWord ? "is-ready" : ""}`} onClick={pressWord} aria-label={hasHeardWord ? `Reveal the picture for ${card.term}` : `Listen to ${card.term}`}><span dir="ltr">{card.term}</span></button><p className="sf-guess-hint">{hasHeardWord ? "اضغط على الكلمة مرة ثانية لتكشف الصورة." : "اضغط على الكلمة لتسمع نطقها أولًا."}</p></div><span className="sf-guess-count" dir="ltr">{String(currentIndex + 1).padStart(2, "0")}</span></section><section className="sf-flip-face sf-flip-back"><img src={image} alt={`Cartoon illustration for ${card.term}`} /><button className="sf-word-below-photo" onClick={() => say(card.term)} aria-label={`Listen to ${card.term} again`}><strong dir="ltr">{card.term}</strong><span>{card.arabic}</span></button></section></div></div></div><div className="sf-card-content"><div className="sf-card-term-row"><span className="sf-part-badge" dir="ltr">{card.kind}</span></div><p className="sf-question-label">Let&apos;s complete the sentence together</p><p className="sf-sentence" dir="ltr">{sentence}</p><p className="sf-question-ar">اختَر الكلمة الأنسب لتُكمل الجملة يا بطل.</p><div className="sf-options">{options.map((option, index) => { const correct = option === card.term; const selected = selectedOption === index; const result = hasAnswered ? correct ? "is-correct" : selected ? "is-wrong" : "is-muted" : ""; return <button key={`${option}-${index}`} className={`sf-option ${result}`} onClick={() => choose(index)} disabled={hasAnswered}><span className="sf-option-letter" dir="ltr">{String.fromCharCode(65 + index)}</span><span className="sf-option-word" dir="ltr">{option}</span>{hasAnswered && correct && <CircleCheck className="sf-option-icon" size={19} />}{hasAnswered && selected && !correct && <CircleX className="sf-option-icon" size={19} />}</button>; })}</div></div></article><div className="sf-card-controls"><button className="sf-control-button" onClick={shuffle}><Shuffle size={17} /> ابدأ ترتيبًا عشوائيًا</button><div className="sf-next-controls" dir="ltr"><button className="sf-arrow-button" onClick={() => moveCard(-1)} disabled={currentIndex === 0} aria-label="Previous card"><ChevronLeft size={20} /></button><button className="sf-next-button" onClick={() => moveCard(1)} disabled={currentIndex === deck.length - 1}>Next card <ChevronRight size={20} /></button><button className="sf-arrow-button" onClick={reset} aria-label="Reset lesson"><RotateCcw size={18} /></button></div></div></section>
    </div>{celebration && <div className="sf-celebration" role="status">{celebration}</div>}</main>;
}

function gradeFromHash(): Grade | null { const grade = window.location.hash.replace("#", "") as Grade; return grade in gradeCourses ? grade : null; }
function App() { const [grade, setGrade] = useState<Grade | null>(() => gradeFromHash()); useEffect(() => { const update = () => setGrade(gradeFromHash()); window.addEventListener("hashchange", update); return () => window.removeEventListener("hashchange", update); }, []); const leave = () => { window.history.pushState(null, "", window.location.pathname + window.location.search); setGrade(null); }; return grade ? <StudentCourse grade={grade} onBack={leave} /> : <GradeHome onSelect={(next) => { window.location.hash = next; }} />; }

createRoot(document.getElementById("root")!).render(<App />);

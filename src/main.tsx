import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Headphones, Home, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { courseLessons, type CourseCard, type CourseLesson } from "./data/course";
import { grade5CourseLessons } from "./data/grade5-course";
import { grade6CourseLessons } from "./data/grade6-course";
import "./style.css";

type Grade = "grade4" | "grade5" | "grade6";

const courses: Record<Grade, CourseLesson[]> = {
  grade4: courseLessons,
  grade5: grade5CourseLessons,
  grade6: grade6CourseLessons,
};

const gradeMeta: Record<Grade, { title: string; english: string; accent: string; description: string; note: string }> = {
  grade4: { title: "الصف الرابع", english: "Grade 4", accent: "gold", description: "20 درسًا · بطاقات وصور واختبارات", note: "رحلة مفردات هادئة ومنظمة لكل وحدة." },
  grade5: { title: "الصف الخامس", english: "Grade 5", accent: "mint", description: "20 درسًا · 609 مفردة وعبارة", note: "بطاقات وصور كرتونية واختبارات لكل وحدة." },
  grade6: { title: "الصف السادس", english: "Grade 6", accent: "violet", description: "20 درسًا · 609 مفردة وعبارة", note: "بطاقات وصور مراجَعة واختبارات لكل وحدة." },
};

function say(term: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(term);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function GradeHome({ onSelect }: { onSelect: (grade: Grade) => void }) {
  return <main className="grade-home"><header className="public-header"><div className="brand"><span>VOCABULARY JOURNEY</span><strong>اختيار الصف</strong></div><span className="public-chip">بوابة الطلاب</span></header><section className="intro"><div className="intro-icon"><BookOpen size={29} /></div><p>اختر رحلتك التعليمية</p><h1>أي صف ستتعلم اليوم؟</h1><span>يُحفظ تقدمك المحلي منفصلًا لكل صف ووحدة.</span></section><section className="grade-grid">{(Object.keys(gradeMeta) as Grade[]).map((grade) => <article className={`grade-card ${gradeMeta[grade].accent}`} key={grade}><div className="grade-card-icon">{grade === "grade5" ? <BookOpen size={26} /> : <Sparkles size={26} />}</div><p>{grade === "grade4" ? "PRIMARY 4" : grade === "grade5" ? "PRIMARY 5" : "PRIMARY 6"}</p><h2>{gradeMeta[grade].english}</h2><span>{gradeMeta[grade].description}</span><small>{gradeMeta[grade].note}</small><button onClick={() => onSelect(grade)}>ابدأ {gradeMeta[grade].english}<ArrowLeft size={17} /></button></article>)}</section><p className="static-note">هذه نسخة عامة من المنصة للتعلم الذاتي؛ لا تحفظ بيانات الدخول أو التقدم على خادم.</p></main>;
}

function LessonExplorer({ grade, onBack }: { grade: Grade; onBack: () => void }) {
  const lessons = courses[grade];
  const [lessonIndex, setLessonIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [meaningVisible, setMeaningVisible] = useState(false);
  const lesson = lessons[lessonIndex];
  const card: CourseCard = lesson.cards[cardIndex];
  const key = `vocflashcard-public-${grade}-${lesson.id}`;
  const [knownCards, setKnownCards] = useState<string[]>(() => JSON.parse(localStorage.getItem(key) ?? "[]"));

  useEffect(() => {
    setCardIndex(0);
    setMeaningVisible(false);
  }, [lessonIndex]);
  useEffect(() => localStorage.setItem(key, JSON.stringify(knownCards)), [key, knownCards]);

  const progress = useMemo(() => Math.round((knownCards.length / Math.max(lesson.cards.length, 1)) * 100), [knownCards, lesson.cards.length]);
  const isKnown = knownCards.includes(card.id);
  function nextCard(direction: 1 | -1) {
    setCardIndex((current) => (current + direction + lesson.cards.length) % lesson.cards.length);
    setMeaningVisible(false);
  }
  function toggleKnown() {
    setKnownCards((current) => current.includes(card.id) ? current.filter((id) => id !== card.id) : [...current, card.id]);
  }

  return <main className="course-shell"><header className="course-header"><button className="back-button" onClick={onBack}><Home size={17} /> الصفوف</button><div><span>VOCABULARY JOURNEY</span><strong>{gradeMeta[grade].title}</strong></div><button className="reset-button" onClick={() => setKnownCards([])}><RotateCcw size={16} /> تصفير مراجعة الدرس</button></header><section className="course-layout"><aside className="lesson-sidebar"><div className="sidebar-heading"><p>{gradeMeta[grade].english}</p><h1>الدروس</h1></div><div className="lesson-list">{lessons.map((item, index) => <button className={index === lessonIndex ? "active" : ""} onClick={() => setLessonIndex(index)} key={item.id}><span className="lesson-number">{item.unit}.{item.lesson}</span><span><strong>{item.title}</strong><small>{item.unitArabic}</small></span><ChevronRight size={16} /></button>)}</div></aside><section className="learning-area"><div className="lesson-banner"><div><p>{lesson.unitArabic} · Unit {lesson.unit}</p><h2>{lesson.title}</h2><span>{lesson.cards.length} بطاقة في هذا الدرس</span></div><div className="progress-box"><strong>{progress}%</strong><span>تمت مراجعته</span><div><i style={{ width: `${progress}%` }} /></div></div></div><article className="flashcard"><div className="card-image"><img src={card.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div className="image-fallback"><Sparkles size={34} /></div><span className="card-count">{cardIndex + 1} / {lesson.cards.length}</span></div><div className="card-copy"><span className="kind-label">{card.kind.replace(/-/g, " ")}</span><h3>{card.term}</h3><button className="listen-button" onClick={() => say(card.term)}><Volume2 size={18} /> استمع للنطق</button><div className="meaning"><p>المعنى بالعربية</p>{meaningVisible ? <strong>{card.arabic}</strong> : <button onClick={() => setMeaningVisible(true)}>أظهر المعنى</button>}</div><div className="example"><p>مثال</p><blockquote>{card.sentence}</blockquote></div><div className="card-actions"><button className={isKnown ? "known" : ""} onClick={toggleKnown}>{isKnown ? "تمت المراجعة" : "أتممت هذه البطاقة"}</button><div><button aria-label="البطاقة السابقة" onClick={() => nextCard(-1)}><ArrowRight size={19} /></button><button aria-label="البطاقة التالية" onClick={() => nextCard(1)}><ArrowLeft size={19} /></button></div></div></div></article><p className="public-course-note"><Headphones size={15} /> النطق يعمل من متصفحك، وتُحفظ مراجعتك لهذا الدرس على جهازك فقط.</p></section></section></main>;
}

function App() {
  const [grade, setGrade] = useState<Grade | null>(null);
  return grade ? <LessonExplorer grade={grade} onBack={() => setGrade(null)} /> : <GradeHome onSelect={setGrade} />;
}

createRoot(document.getElementById("root")!).render(<App />);

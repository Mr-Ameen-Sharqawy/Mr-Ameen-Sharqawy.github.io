import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Award, BadgeCheck, BookOpen, ChevronLeft, ChevronRight, CircleCheck, CircleX, KeyRound, Menu, MonitorSmartphone, Plus, RefreshCw, RotateCcw, Settings2, Shuffle, Sparkles, UserPlus, UsersRound, X } from "lucide-react";
import { buildWordOptions, courseLessons, courseUnits, sentenceWithBlank, type CourseCard } from "./data/course";
import { grade5CourseUnits, grade5InteractiveLessons } from "./data/grade5-course";
import { grade6CourseUnits, grade6InteractiveLessons } from "./data/grade6-course";
import { suppliedImagesByGrade } from "./data/supplied-course-images";
import { newBatchImagesByGrade } from "./data/new-batch-supplied-course-images";
import { googleDriveBatchImagesByGrade } from "./data/google-drive-batch-course-images";
import { googleDriveAug23ImagesByGrade } from "./data/google-drive-aug23-course-images";
import { semanticFallbackImagesByGrade } from "./data/semantic-fallback-course-images";
import { approximateImagesByGrade } from "./data/approximate-course-images";
import { speakNaturally } from "./lib/natural-speech";
import { firebaseAuth, onAuthStateChanged, registerStudentDeviceAndLoadAccess, signInWithUsername, signOutStudent, StudentAccessError, type StudentAccess, usernameFromFirebaseEmail } from "./lib/firebase-auth";
import { clearManagedStudentDevices, createManagedStudent, isTeacher, listManagedStudents, MANAGEABLE_GRADES, PRACTICAL_TEST_DEVICE_LIMIT, type ManagedStudent, updateManagedStudent } from "./lib/teacher-access";
import "./style.css";
import "./firebase-auth.css";
import "./teacher-dashboard.css";

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
  speakNaturally(term);
}

function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signInWithUsername(username, password);
    } catch {
      setError("تعذر تسجيل الدخول. تأكد من اسم المستخدم وكلمة المرور.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="auth-page" dir="rtl"><section className="auth-card"><div className="auth-icon"><BookOpen size={28} /></div><p className="auth-kicker">VOCABULARY JOURNEY</p><h1>بوابة الطلاب</h1><p className="auth-copy">ادخل باسم المستخدم وكلمة المرور اللذين أنشأهما لك المعلم.</p><form onSubmit={submit} className="auth-form"><label>اسم المستخدم<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" required /></label><label>كلمة المرور<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button type="submit" disabled={isSubmitting}>{isSubmitting ? "جارٍ الدخول..." : "ابدأ التعلم"}</button></form><p className="auth-note">الحسابات ينشئها المعلم فقط؛ إذا لم تكن لديك بيانات دخول، تواصل معه.</p></section></main>;
}

function GradeHome({ onSelect, studentUsername, allowedGrades, onSignOut, onTeacherDashboard }: { onSelect: (grade: Grade) => void; studentUsername: string; allowedGrades: Grade[]; onSignOut: () => void; onTeacherDashboard?: () => void }) {
  return <main className="grade-home" dir="rtl"><header className="public-header"><div className="brand"><span>VOCABULARY JOURNEY</span><strong>اختيار الصف</strong></div><div className="public-user-actions">{onTeacherDashboard && <button className="teacher-open" onClick={onTeacherDashboard}><Settings2 size={15} />لوحة المعلم</button>}<span className="public-chip">{studentUsername}</span><button className="public-logout" onClick={onSignOut}>خروج</button></div></header><section className="intro"><div className="intro-icon"><BookOpen size={29} /></div><p>اختر رحلتك التعليمية</p><h1>أي صف ستتعلم اليوم؟</h1><span>تظهر لك الصفوف التي منحك المعلم صلاحية دخولها فقط.</span></section><section className="grade-grid">{(Object.keys(gradeMeta) as Grade[]).filter((grade) => allowedGrades.includes(grade)).map((grade) => <article className={`grade-card ${gradeMeta[grade].accent}`} key={grade}><div className="grade-card-icon">{grade === "grade5" ? <BookOpen size={26} /> : <Sparkles size={26} />}</div><p>{grade === "grade4" ? "PRIMARY 4" : grade === "grade5" ? "PRIMARY 5" : "PRIMARY 6"}</p><h2>{gradeMeta[grade].english}</h2><span>{gradeMeta[grade].description}</span><small>{gradeMeta[grade].note}</small><button onClick={() => onSelect(grade)}>ابدأ {gradeMeta[grade].english}<ChevronLeft size={17} /></button></article>)}</section><p className="static-note">يُحفظ تقدمك محليًا على جهازك، ويطبّق Firebase صفوفك المسموح بها وحد الأجهزة.</p></main>;
}

function GradePicker({ selected, onChange, idPrefix }: { selected: Grade[]; onChange: (grades: Grade[]) => void; idPrefix: string }) {
  return <div className="teacher-grades">{MANAGEABLE_GRADES.map((grade) => { const checked = selected.includes(grade); return <label key={grade} htmlFor={`${idPrefix}-${grade}`}><input id={`${idPrefix}-${grade}`} type="checkbox" checked={checked} onChange={() => onChange(checked ? selected.filter((item) => item !== grade) : [...selected, grade])} /><span>{gradeMeta[grade].title}</span></label>; })}</div>;
}

function TeacherDashboard({ teacherUid, onStudentView, onSignOut }: { teacherUid: string; onStudentView: () => void; onSignOut: () => void }) {
  const [students, setStudents] = useState<ManagedStudent[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [maxDevices, setMaxDevices] = useState(1);
  const [isTestAccount, setIsTestAccount] = useState(false);
  const [allowedGrades, setAllowedGrades] = useState<Grade[]>(["grade6"]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const loadStudents = async () => { setError(""); try { setStudents(await listManagedStudents(teacherUid)); } catch { setError("تعذر قراءة قائمة الطلاب. تحقق من نشر قواعد لوحة ameen في Firestore."); } };
  useEffect(() => { void loadStudents(); }, [teacherUid]);
  const createStudent = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(""); setMessage(""); try { const created = await createManagedStudent(teacherUid, { username, password, maxDevices, allowedGrades }); setMessage(`تم إنشاء حساب ${created.username}. احتفظ بكلمة المرور قبل إرسالها للطالب.`); setUsername(""); setPassword(""); setMaxDevices(1); setIsTestAccount(false); setAllowedGrades(["grade6"]); await loadStudents(); } catch (reason) { setError(reason instanceof Error ? reason.message : "تعذر إنشاء الحساب. قد يكون اسم المستخدم مستخدمًا بالفعل."); } finally { setBusy(false); } };
  const saveStudent = async (student: ManagedStudent) => { setBusy(true); setError(""); setMessage(""); try { await updateManagedStudent(teacherUid, student); setMessage(`تم حفظ إعدادات ${student.username}.`); setEditing(null); await loadStudents(); } catch (reason) { setError(reason instanceof Error ? reason.message : "تعذر حفظ إعدادات الطالب."); } finally { setBusy(false); } };
  const resetDevices = async (student: ManagedStudent) => { if (!window.confirm(`هل تريد تحرير الأجهزة المسجلة لحساب ${student.username}؟`)) return; setBusy(true); setError(""); setMessage(""); try { await clearManagedStudentDevices(teacherUid, student.uid); setMessage(`تم تحرير الأجهزة المسجلة لحساب ${student.username}.`); await loadStudents(); } catch { setError("تعذر تحرير الأجهزة."); } finally { setBusy(false); } };
  const patchStudent = (uid: string, patch: Partial<ManagedStudent>) => setStudents((items) => items.map((student) => student.uid === uid ? { ...student, ...patch } : student));

  return <main className="teacher-page" dir="rtl"><header className="teacher-topbar"><div><p>VOCABULARY JOURNEY</p><h1><UsersRound size={23} /> لوحة المعلم</h1></div><div><button className="teacher-study-button" onClick={onStudentView}><BookOpen size={16} />عرض المنصة</button><button className="public-logout" onClick={onSignOut}>خروج</button></div></header><section className="teacher-hero"><div><span><KeyRound size={15} /> حساب المعلم: ameen</span><h2>أضف الطلاب واضبط دخولهم في دقائق.</h2><p>اختر الصفوف، عدد الأجهزة، وحالة الحساب. كلمة المرور لا تُحفظ داخل اللوحة بعد إنشاء الحساب.</p></div><div className="teacher-stat"><strong>{students.length}</strong><span>حساب طالب مُدار</span></div></section>{message && <p className="teacher-message success" role="status">{message}</p>}{error && <p className="teacher-message error" role="alert">{error}</p>}<section className="teacher-layout"><form className="teacher-create-card" onSubmit={createStudent}><div className="teacher-section-title"><span><UserPlus size={18} /></span><div><p>حساب جديد</p><h2>إضافة طالب</h2></div></div><label>اسم المستخدم<input value={username} onChange={(event) => setUsername(event.target.value)} autoCapitalize="none" placeholder="مثال: ali" required /></label><label>كلمة المرور الأولى<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} placeholder="6 أحرف على الأقل" required /></label><label>عدد الأجهزة<input type="number" value={maxDevices} min={1} max={PRACTICAL_TEST_DEVICE_LIMIT} disabled={isTestAccount} onChange={(event) => setMaxDevices(Number(event.target.value))} required /></label><label className="teacher-test-toggle"><input type="checkbox" checked={isTestAccount} onChange={(event) => { const enabled = event.target.checked; setIsTestAccount(enabled); if (enabled) setMaxDevices(PRACTICAL_TEST_DEVICE_LIMIT); }} /><span />حساب تجريبي لعدد كبير من الطلاب <small>حتى {PRACTICAL_TEST_DEVICE_LIMIT} جهاز</small></label><fieldset><legend>الصفوف المسموح بها</legend><GradePicker selected={allowedGrades} onChange={setAllowedGrades} idPrefix="create-grade" /></fieldset><button className="teacher-create-button" disabled={busy}><Plus size={18} />{busy ? "جارٍ الحفظ..." : "إنشاء حساب الطالب"}</button><p className="teacher-form-note">«غير محدود» هنا يعني حدًا عمليًا مرتفعًا (حتى {PRACTICAL_TEST_DEVICE_LIMIT} جهاز)، وليس تخزينًا غير منتهٍ.</p></form><section className="teacher-students-card"><div className="teacher-list-head"><div><p>الحسابات الحالية</p><h2>إدارة الطلاب</h2></div><button className="teacher-refresh" onClick={() => void loadStudents()} disabled={busy} aria-label="تحديث القائمة"><RefreshCw size={18} /></button></div>{students.length === 0 ? <div className="teacher-empty"><MonitorSmartphone size={25} /><p>لا توجد حسابات طلاب بعد. أضف أول حساب من النموذج.</p></div> : <div className="teacher-student-list">{students.map((student) => <article className="teacher-student" key={student.uid}><div className="teacher-student-head"><div><strong>{student.username}</strong><span>{student.active ? "نشط" : "موقوف"} · {student.deviceCount} جهاز مسجل</span></div><button className="teacher-edit" onClick={() => setEditing(editing === student.uid ? null : student.uid)}>{editing === student.uid ? "إغلاق" : "تعديل"}</button></div>{editing === student.uid && <div className="teacher-student-editor"><label className="teacher-switch"><input type="checkbox" checked={student.active} onChange={(event) => patchStudent(student.uid, { active: event.target.checked })} /><span />الحساب نشط</label><label>عدد الأجهزة<input type="number" value={student.maxDevices} min={1} max={PRACTICAL_TEST_DEVICE_LIMIT} onChange={(event) => patchStudent(student.uid, { maxDevices: Number(event.target.value) })} /></label><p className="teacher-limit-note">ضع {PRACTICAL_TEST_DEVICE_LIMIT} لحساب تجريبي يفتحه عدد كبير من الطلاب.</p><fieldset><legend>الصفوف المسموح بها</legend><GradePicker selected={student.allowedGrades as Grade[]} onChange={(grades) => patchStudent(student.uid, { allowedGrades: grades })} idPrefix={`student-${student.uid}`} /></fieldset><div className="teacher-row-actions"><button className="teacher-save" onClick={() => void saveStudent(student)} disabled={busy}>حفظ الإعدادات</button><button className="teacher-reset" onClick={() => void resetDevices(student)} disabled={busy}>إعادة ضبط الأجهزة</button></div></div>}</article>)}</div>}</section></section></main>;
}

function StudentCourse({ grade, onBack, studentUsername, onSignOut }: { grade: Grade; onBack: () => void; studentUsername: string; onSignOut: () => void }) {
  const { lessons, units } = gradeCourses[grade];
  const label = grade === "grade4" ? "PRIMARY 4" : grade === "grade5" ? "PRIMARY 5" : "PRIMARY 6";
  const storageKey = `vocflashcard-public-${studentUsername}-${grade}-progress-v3`;
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
  useEffect(() => {
    document.querySelector(".sf-question-label")?.replaceChildren("Choose the best answer");
    document.querySelector(".sf-question-ar")?.replaceChildren("اختَر الكلمة الأنسب يا بطل.");
  });
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
  const cardImageKey = normalizeTerm(card.term);
  const sourceImageKey = normalizeTerm(card.sourceTerm || card.term);
  const image = googleDriveAug23ImagesByGrade[grade][cardImageKey] ?? googleDriveAug23ImagesByGrade[grade][sourceImageKey] ?? googleDriveBatchImagesByGrade[grade][cardImageKey] ?? googleDriveBatchImagesByGrade[grade][sourceImageKey] ?? newBatchImagesByGrade[grade][cardImageKey] ?? newBatchImagesByGrade[grade][sourceImageKey] ?? suppliedImagesByGrade[grade][cardImageKey] ?? suppliedImagesByGrade[grade][sourceImageKey] ?? semanticFallbackImagesByGrade[grade][cardImageKey] ?? semanticFallbackImagesByGrade[grade][sourceImageKey] ?? approximateImagesByGrade[grade][cardImageKey] ?? approximateImagesByGrade[grade][sourceImageKey] ?? selectedLesson.image;

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
    <header className="sf-topbar"><div className="sf-brand" dir="ltr"><div className="sf-brand-logo"><BookOpen size={27} /></div><div><p className="sf-brand-kicker">{label} · LITTLE WORD EXPLORERS</p><p className="sf-brand-name">Vocabulary Flashcards <span>Workbook</span></p></div></div><div className="sf-top-actions"><button className="sf-student-chip" onClick={onBack}><span>الصفوف</span><small>رجوع</small></button><span className="sf-user-name">{studentUsername}</span><button className="sf-signout" onClick={onSignOut}>خروج</button><div className="sf-score-chip" aria-label={`Score ${totalCorrect} out of ${totalReviewed}`} dir="ltr"><BadgeCheck size={17} /><span>{totalCorrect}</span><small> / {totalReviewed} right</small></div><button className="sf-menu-button" onClick={() => setIsRailOpen(true)} aria-label="Open course navigation"><Menu size={22} /></button></div></header>
    <div className="sf-shell"><aside className={`sf-rail ${isRailOpen ? "is-open" : ""}`} aria-label="Course navigation"><div className="sf-rail-mobile-head"><span>Course map</span><button onClick={() => setIsRailOpen(false)} aria-label="Close course navigation"><X size={20} /></button></div><div className="sf-lesson-marker" style={{ backgroundColor: selectedLesson.color }}><span>UNIT</span><strong>{String(selectedLesson.unit).padStart(2, "0")}</strong><em dir="ltr">LESSON {selectedLesson.lesson}</em></div><div className="sf-rail-copy"><p className="sf-rail-eyebrow">{label} · COURSE MAP</p><h1>{selectedLesson.unitArabic}</h1><p dir="ltr">{selectedLesson.title}</p></div><nav className="sf-course-nav" aria-label="Units and lessons">{units.map((unit) => { const unitLessons = lessons.filter((lesson) => lesson.unit === unit.unit); const active = unit.unit === selectedLesson.unit; return <section className={`sf-unit-group ${active ? "is-active" : ""}`} key={unit.unit}><div className="sf-unit-heading"><span className="sf-section-dot" style={{ backgroundColor: unit.color }} /><span dir="ltr">UNIT {String(unit.unit).padStart(2, "0")}</span><small>{unitLessons.length} lessons</small><button className="sf-unit-quiz-button" onClick={() => setCelebration(`اختبار الوحدة ${unit.unit} متاح داخل المنصة الكاملة.`)} aria-label={`Start Unit ${unit.unit} quiz`}><Award size={14} /></button></div><div className="sf-lesson-links">{unitLessons.map((lesson) => <button key={lesson.id} className={`sf-section-link ${lesson.id === selectedLesson.id ? "is-active" : ""}`} onClick={() => selectLesson(lesson.id)}><span className="sf-lesson-number" dir="ltr">L {lesson.lesson}</span><span className="sf-section-title" dir="ltr">{lesson.title}</span><small>{lesson.cards.length}</small></button>)}</div></section>; })}</nav><div className="sf-rail-footer"><div className="sf-mini-progress"><span style={{ width: `${(reviewedCount / Math.max(deck.length, 1)) * 100}%`, backgroundColor: selectedLesson.color }} /></div><p>{reviewedCount} من {deck.length} بطاقة تمت مراجعتها</p></div></aside>
      <section className="sf-workspace"><section className="sf-hero" style={{ backgroundImage: `url(${selectedLesson.image})` }}><div className="sf-hero-content"><div className="sf-hero-label"><Sparkles size={15} /> Unit {selectedLesson.unit} · Lesson {selectedLesson.lesson}</div><h2>{selectedLesson.unitArabic}<br /><span dir="ltr">{selectedLesson.title}</span></h2><p>خلّي الطفل يسمع الكلمة، يتخيل معناها، ثم يثبتها في جملة قصيرة.</p></div><div className="sf-hero-note" dir="ltr"><BookOpen size={16} /> {deck.length} picture-led cards</div></section><div className="sf-progress-row"><div><p className="sf-overline" dir="ltr">UNIT {selectedLesson.unit} · LESSON {selectedLesson.lesson}</p><p className="sf-progress-title" dir="ltr">Card {String(currentIndex + 1).padStart(2, "0")} <span>of {deck.length}</span></p></div><div className="sf-progress-track"><span style={{ width: `${((currentIndex + 1) / Math.max(deck.length, 1)) * 100}%`, backgroundColor: selectedLesson.color }} /></div></div><article className="sf-flashcard" key={card.id}><div className="sf-card-visual"><div className={`sf-flip-stage ${isCardFlipped ? "is-flipped" : ""}`}><div className="sf-flip-inner"><section className="sf-flip-face sf-flip-front"><div className="sf-guess-content"><p className="sf-guess-kicker">BEFORE YOU LISTEN</p><button className={`sf-guess-word ${hasHeardWord ? "is-ready" : ""}`} onClick={pressWord} aria-label={hasHeardWord ? `Reveal the picture for ${card.term}` : `Listen to ${card.term}`}><span dir="ltr">{card.term}</span></button><p className="sf-guess-hint">{hasHeardWord ? "اضغط على الكلمة مرة ثانية لتكشف الصورة." : "اضغط على الكلمة لتسمع نطقها أولًا."}</p></div><span className="sf-guess-count" dir="ltr">{String(currentIndex + 1).padStart(2, "0")}</span></section><section className="sf-flip-face sf-flip-back"><img src={image} alt={`Cartoon illustration for ${card.term}`} /><button className="sf-word-below-photo" onClick={() => say(card.term)} aria-label={`Listen to ${card.term} again`}><strong dir="ltr">{card.term}</strong><span>{card.arabic}</span></button></section></div></div></div><div className="sf-card-content"><div className="sf-card-term-row"><span className="sf-part-badge" dir="ltr">{card.kind}</span></div><p className="sf-question-label">Let&apos;s complete the sentence together</p><p className="sf-sentence" dir="ltr">{sentence}</p><p className="sf-question-ar">اختَر الكلمة الأنسب لتُكمل الجملة يا بطل.</p><div className="sf-options">{options.map((option, index) => { const correct = option === card.term; const selected = selectedOption === index; const result = hasAnswered ? correct ? "is-correct" : selected ? "is-wrong" : "is-muted" : ""; return <button key={`${option}-${index}`} className={`sf-option ${result}`} onClick={() => choose(index)} disabled={hasAnswered}><span className="sf-option-letter" dir="ltr">{String.fromCharCode(65 + index)}</span><span className="sf-option-word" dir="ltr">{option}</span>{hasAnswered && correct && <CircleCheck className="sf-option-icon" size={19} />}{hasAnswered && selected && !correct && <CircleX className="sf-option-icon" size={19} />}</button>; })}</div></div></article><div className="sf-card-controls"><button className="sf-control-button" onClick={shuffle}><Shuffle size={17} /> ابدأ ترتيبًا عشوائيًا</button><div className="sf-next-controls" dir="ltr"><button className="sf-arrow-button" onClick={() => moveCard(-1)} disabled={currentIndex === 0} aria-label="Previous card"><ChevronLeft size={20} /></button><button className="sf-next-button" onClick={() => moveCard(1)} disabled={currentIndex === deck.length - 1}>Next card <ChevronRight size={20} /></button><button className="sf-arrow-button" onClick={reset} aria-label="Reset lesson"><RotateCcw size={18} /></button></div></div></section>
    </div>{celebration && <div className="sf-celebration" role="status">{celebration}</div>}</main>;
}

function gradeFromHash(): Grade | null { const grade = window.location.hash.replace("#", "") as Grade; return grade in gradeCourses ? grade : null; }
function accessErrorMessage(error: unknown) { if (error instanceof StudentAccessError) { if (error.code === "device-limit") return "وصل هذا الحساب إلى الحد الأقصى للأجهزة. اطلب من المعلم إعادة ضبط الأجهزة."; if (error.code === "account-disabled") return "هذا الحساب موقوف حاليًا. تواصل مع المعلم."; if (error.code === "no-grade") return "لا يوجد صف مسموح لهذا الحساب. تواصل مع المعلم."; } return "تعذر التحقق من صلاحيات هذا الحساب. حاول مرة أخرى أو تواصل مع المعلم."; }
type SessionState = { status: "loading" } | { status: "signed-out" } | { status: "blocked"; message: string } | { status: "ready"; uid: string; email: string; access: StudentAccess };
function AccessBlocked({ message }: { message: string }) { return <main className="auth-page" dir="rtl"><section className="auth-card"><div className="auth-icon"><CircleX size={28} /></div><p className="auth-kicker">VOCABULARY JOURNEY</p><h1>تعذر فتح البوابة</h1><p className="auth-copy">{message}</p><button className="auth-retry" onClick={() => window.location.reload()}>إعادة المحاولة</button></section></main>; }
function App() { const [session, setSession] = useState<SessionState>({ status: "loading" }); const [grade, setGrade] = useState<Grade | null>(() => gradeFromHash()); const [teacherView, setTeacherView] = useState(true); useEffect(() => onAuthStateChanged(firebaseAuth, (user) => { if (!user?.email) { setSession((current) => current.status === "blocked" ? current : { status: "signed-out" }); return; } void registerStudentDeviceAndLoadAccess(user.uid).then((access) => setSession({ status: "ready", uid: user.uid, email: user.email!, access })).catch((error) => { setSession({ status: "blocked", message: accessErrorMessage(error) }); void signOutStudent(); }); }), []); useEffect(() => { const update = () => setGrade(gradeFromHash()); window.addEventListener("hashchange", update); return () => window.removeEventListener("hashchange", update); }, []); if (session.status === "loading") return <main className="auth-page"><p className="auth-loading">جارٍ تجهيز بوابة الطلاب...</p></main>; if (session.status === "blocked") return <AccessBlocked message={session.message} />; if (session.status === "signed-out") return <StudentLogin />; const studentUsername = session.access.username || usernameFromFirebaseEmail(session.email); const allowedGrades = session.access.allowedGrades as Grade[]; const teacher = isTeacher(session.uid); const activeGrade = grade && allowedGrades.includes(grade) ? grade : null; const leave = () => { window.history.pushState(null, "", window.location.pathname + window.location.search); setGrade(null); setTeacherView(teacher); }; const logout = () => { void signOutStudent(); }; if (teacher && teacherView && !activeGrade) return <TeacherDashboard teacherUid={session.uid} onStudentView={() => setTeacherView(false)} onSignOut={logout} />; return activeGrade ? <StudentCourse grade={activeGrade} onBack={leave} studentUsername={studentUsername} onSignOut={logout} /> : <GradeHome onSelect={(next) => { window.location.hash = next; }} studentUsername={studentUsername} allowedGrades={allowedGrades} onSignOut={logout} onTeacherDashboard={teacher ? () => setTeacherView(true) : undefined} />; }

createRoot(document.getElementById("root")!).render(<App />);

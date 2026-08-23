export type VoiceLike = Pick<SpeechSynthesisVoice, "lang" | "name" | "localService">;

export function naturalVoiceScore(voice: VoiceLike): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = lang.startsWith("en-us") ? 90 : lang.startsWith("en-gb") ? 86 : lang.startsWith("en") ? 76 : -1000;

  if (/(natural|neural|enhanced|premium|online)/.test(name)) score += 45;
  if (/(microsoft|google|siri|apple)/.test(name)) score += 18;
  if (voice.localService) score += 6;
  if (/(espeak|compact|robot|legacy)/.test(name)) score -= 60;
  return score;
}

export function chooseNaturalEnglishVoice<T extends VoiceLike>(voices: T[]): T | undefined {
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    .sort((left, right) => naturalVoiceScore(right) - naturalVoiceScore(left))[0];
}

export function speakNaturally(term: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return false;

  const synthesis = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(term.replace(/[!?.]/g, "").trim());
  const preferredVoice = chooseNaturalEnglishVoice(synthesis.getVoices());

  utterance.lang = preferredVoice?.lang || "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  if (preferredVoice) utterance.voice = preferredVoice;

  synthesis.cancel();
  synthesis.speak(utterance);
  return true;
}

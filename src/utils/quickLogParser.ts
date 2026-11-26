export interface ParsedQuickLog {
  subject: string;
  topic: string;
  durationMinutes: number;
  problemsSolved: number;
  accuracyPercent?: number;
}

const SUBJECT_ALIASES: [RegExp, string][] = [
  [/\b(phy|phys|physics)\b/i, 'Physics'],
  [/\b(math|maths|mathematics|calc|calculus|algebra|geom|geometry)\b/i, 'Mathematics'],
  [/\b(chem|chemistry|organic|inorganic|physical chem)\b/i, 'Chemistry'],
  [/\b(cs|comp|computer|web|coding|programming|algo|dsa)\b/i, 'Computer Science'],
  [/\b(bio|biology)\b/i, 'Biology'],
  [/\b(eng|english)\b/i, 'English'],
  [/\b(pe|physical ed|physical education)\b/i, 'Physical Education'],
  [/\b(olympiad|ipho|nsep|inpho)\b/i, 'Olympiad Physics'],
];

export function parseQuickStudyLog(input: string): ParsedQuickLog | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  let text = raw;
  let durationMinutes = 0;

  // Match hours + optional minutes: e.g. "1h 30m", "1.5h", "2 hrs"
  const hmMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\s*(?:(\d+)\s*(?:m|min|mins|minute|minutes))?/i);
  if (hmMatch) {
    durationMinutes += Math.round(parseFloat(hmMatch[1]) * 60);
    if (hmMatch[2]) durationMinutes += parseInt(hmMatch[2], 10);
    text = text.replace(hmMatch[0], ' ');
  } else {
    const mMatch = text.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/i);
    if (mMatch) {
      durationMinutes = parseInt(mMatch[1], 10);
      text = text.replace(mMatch[0], ' ');
    }
  }

  // Match accuracy percentage: e.g. "85%"
  let accuracyPercent: number | undefined;
  const accMatch = text.match(/(\d{1,3})\s*%/);
  if (accMatch) {
    const val = parseInt(accMatch[1], 10);
    if (val >= 0 && val <= 100) accuracyPercent = val;
    text = text.replace(accMatch[0], ' ');
  }

  // Match problems solved: e.g. "15q", "20 qs", "12 problems", "10 probs"
  let problemsSolved = 0;
  const probMatch = text.match(/(\d+)\s*(?:q|qs|ques|questions|prob|probs|problems)\b/i);
  if (probMatch) {
    problemsSolved = parseInt(probMatch[1], 10);
    text = text.replace(probMatch[0], ' ');
  }

  // Match subject
  let subject = 'General STEM';
  for (const [re, canonical] of SUBJECT_ALIASES) {
    const m = text.match(re);
    if (m) {
      subject = canonical;
      text = text.replace(m[0], ' ');
      break;
    }
  }

  const cleanedTopic = text
    .replace(/[,;:\-|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (durationMinutes <= 0 && problemsSolved <= 0 && !cleanedTopic) {
    return null;
  }

  const topic = cleanedTopic
    ? cleanedTopic.charAt(0).toUpperCase() + cleanedTopic.slice(1)
    : `${subject} Focus Block`;

  return {
    subject,
    topic,
    durationMinutes: durationMinutes > 0 ? durationMinutes : 30,
    problemsSolved,
    accuracyPercent,
  };
}

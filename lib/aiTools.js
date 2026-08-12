// Synovra V1 — Phase 3: AI Tools metadata.
// TODO(Phase 4+): School Hub, Business Hub, Writing Hub, Travel, Home Tools
// as separate menu sections aren't defined with real tools in the V1 spec
// yet — only these 5 tools exist. Do not invent content for those locked
// menu items; they stay locked until real tools are specified for them.

export const TOOLS = [
  {
    id: "website-doctor",
    label: "Website Doctor",
    category: "Business",
    description: "Get an instant audit of your website's first impression, SEO, and speed.",
    fields: [
      { name: "url", label: "Website URL", placeholder: "https://example.com" },
    ],
  },
  {
    id: "business-name-checker",
    label: "Business Name Checker",
    category: "Business",
    description: "Check how strong and brandable a business name is.",
    fields: [
      { name: "name", label: "Business name", placeholder: "e.g. Bright Path Consulting" },
      { name: "industry", label: "Industry (optional)", placeholder: "e.g. consulting" },
    ],
  },
  {
    id: "homework-explainer",
    label: "Homework Explainer",
    category: "Students",
    description: "Get a clear, step-by-step explanation for a homework question.",
    fields: [
      { name: "question", label: "Question", placeholder: "Paste your homework question", textarea: true },
      { name: "subject", label: "Subject (optional)", placeholder: "e.g. Algebra" },
    ],
  },
  {
    id: "study-planner",
    label: "Study Planner",
    category: "Students",
    description: "Get a realistic, day-by-day study plan.",
    fields: [
      { name: "subjects", label: "Subjects", placeholder: "e.g. Math, Biology" },
      { name: "examDate", label: "Exam or deadline", placeholder: "e.g. in 3 weeks" },
      { name: "hoursPerDay", label: "Study hours per day (optional)", placeholder: "e.g. 2" },
    ],
  },
  {
    id: "resume-builder",
    label: "Resume Builder",
    category: "Writing",
    description: "Generate a resume summary and strong bullet points.",
    fields: [
      { name: "jobTitle", label: "Target job title", placeholder: "e.g. Marketing Manager" },
      { name: "experience", label: "Experience / background", placeholder: "Describe your work history", textarea: true },
      { name: "skills", label: "Key skills", placeholder: "e.g. SEO, Excel, leadership" },
    ],
  },
];

export function getTool(id) {
  return TOOLS.find((t) => t.id === id) || null;
}

export function summarizeInput(tool, values) {
  const first = tool.fields[0]?.name;
  const text = (values?.[first] || "").toString().trim();
  return text.length > 50 ? text.slice(0, 50) + "…" : text || tool.label;
}

export function buildPrompt(tool, values) {
  switch (tool.id) {
    case "website-doctor":
      return `You are a website audit expert. Give a concise, actionable audit of this website: ${values.url}. Cover: first impression, likely SEO issues, mobile-friendliness concerns, and page speed considerations. End with 3 concrete improvement suggestions. Use short headers.`;
    case "business-name-checker":
      return `You are a branding expert. Evaluate the business name "${values.name}" for the ${values.industry || "general"} industry. Assess memorability, ease of pronunciation, brandability, and potential naming conflicts to watch for. Give a score out of 10 and suggest 3 alternative names.`;
    case "homework-explainer":
      return `You are a patient, encouraging tutor. Explain the following homework question step by step in simple language${values.subject ? ` (subject: ${values.subject})` : ""}: ${values.question}. End with a short summary of the key concept.`;
    case "study-planner":
      return `You are a study coach. Create a realistic study plan for these subjects: ${values.subjects}. The exam or deadline is: ${values.examDate}. The student can study ${values.hoursPerDay || "1-2"} hours per day. Break the plan into a day-by-day or week-by-week schedule with specific topics per session.`;
    case "resume-builder":
      return `You are a professional resume writer. Write a resume summary and 4-5 strong bullet points for someone targeting the role of "${values.jobTitle}". Background: ${values.experience}. Key skills: ${values.skills}. Use action verbs and quantify impact where reasonable.`;
    default:
      throw new Error("Unknown tool.");
  }
}
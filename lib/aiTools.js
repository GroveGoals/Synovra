// Synovra V1 — Phase 3: AI Tools metadata.
// TODO(Phase 4+): Business, Writing, Travel keep growing as more tools get
// specified. Do not invent content beyond what's listed here.

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
    category: "School",
    description: "Get a clear, step-by-step explanation for a homework question.",
    fields: [
      { name: "question", label: "Question", placeholder: "Paste your homework question", textarea: true },
      { name: "subject", label: "Subject (optional)", placeholder: "e.g. Algebra" },
    ],
  },
  {
    id: "study-planner",
    label: "Study Planner",
    category: "School",
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
  {
    id: "recipe-generator",
    label: "Recipe Generator",
    category: "Home Tools",
    description: "Get a recipe from whatever ingredients you have or whatever you're craving.",
    fields: [
      { name: "ingredients", label: "Ingredients or craving", placeholder: "e.g. chicken thighs, rice, whatever's in my fridge", textarea: true },
      { name: "dietary", label: "Dietary notes (optional)", placeholder: "e.g. gluten-free, vegetarian" },
    ],
  },
  {
    id: "trip-planner",
    label: "Trip Planner",
    category: "Travel",
    description: "Get a day-by-day plan for your trip.",
    fields: [
      { name: "destination", label: "Destination", placeholder: "e.g. Lisbon, Portugal" },
      { name: "duration", label: "Trip length", placeholder: "e.g. 5 days" },
      { name: "interests", label: "Interests (optional)", placeholder: "e.g. food, history, hiking" },
      { name: "budget", label: "Budget level (optional)", placeholder: "e.g. budget, mid-range, luxury" },
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
    case "recipe-generator":
      return `You are a helpful cooking assistant. Given these ingredients or cravings: ${values.ingredients}${values.dietary ? `, with dietary notes: ${values.dietary}` : ""}, return one clear recipe: a short title, ingredient list with quantities, and numbered steps. Keep it practical for a home cook.`;
    case "trip-planner":
      return `You are an experienced travel planner. Create a day-by-day itinerary for a ${values.duration} trip to ${values.destination}${values.interests ? `, focused on: ${values.interests}` : ""}${values.budget ? `, at a ${values.budget} budget level` : ""}. For each day, suggest a morning, afternoon, and evening activity, and mention one practical tip (transport, timing, or booking advice).`;
    default:
      throw new Error("Unknown tool.");
  }
}
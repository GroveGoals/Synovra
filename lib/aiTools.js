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
    id: "article-writer",
    label: "Article Writer",
    category: "Writing",
    description: "Generate a well-structured article or blog post on any topic.",
    fields: [
      { name: "topic", label: "Article topic", placeholder: "e.g. The benefits of remote work" },
      { name: "keyPoints", label: "Key points to cover (optional)", placeholder: "e.g. flexibility, cost savings, challenges", textarea: true },
      { name: "tone", label: "Tone (optional)", placeholder: "e.g. professional, casual, persuasive" },
    ],
  },
  {
    id: "email-writer",
    label: "Email Writer",
    category: "Writing",
    description: "Draft a clear, well-written email for any situation.",
    fields: [
      { name: "purpose", label: "What's this email about?", placeholder: "e.g. following up on a job application", textarea: true },
      { name: "recipient", label: "Who are you writing to? (optional)", placeholder: "e.g. hiring manager, client, coworker" },
      { name: "tone", label: "Tone (optional)", placeholder: "e.g. formal, friendly, assertive" },
    ],
  },
  {
    id: "essay-helper",
    label: "Essay Helper",
    category: "Writing",
    description: "Get help structuring, outlining, or drafting an essay.",
    fields: [
      { name: "topic", label: "Essay topic or prompt", placeholder: "e.g. The impact of social media on society", textarea: true },
      { name: "essayType", label: "Essay type (optional)", placeholder: "e.g. persuasive, argumentative, narrative" },
      { name: "requirements", label: "Requirements (optional)", placeholder: "e.g. 5 paragraphs, must include a counterargument" },
    ],
  },
  {
    id: "writing-assistant",
    label: "Writing Assistant",
    category: "Writing",
    description: "Get general help with any piece of writing — rewriting, improving, or brainstorming.",
    fields: [
      { name: "text", label: "Your text (optional)", placeholder: "Paste what you're working on, if you have a draft", textarea: true },
      { name: "instruction", label: "What do you need help with?", placeholder: "e.g. make this more concise, brainstorm ideas, improve the flow", textarea: true },
    ],
  },
  {
    id: "grammar-tools",
    label: "Grammar Tools",
    category: "Writing",
    description: "Check and fix grammar, spelling, and punctuation in your text.",
    fields: [
      { name: "text", label: "Text to check", placeholder: "Paste the text you want checked", textarea: true },
    ],
  },
  {
    id: "summarizer",
    label: "Summarizer",
    category: "Writing",
    description: "Turn long text into a clear, concise summary.",
    fields: [
      { name: "text", label: "Text to summarize", placeholder: "Paste the text you want summarized", textarea: true },
      { name: "length", label: "Desired length (optional)", placeholder: "e.g. one paragraph, 3 bullet points" },
    ],
  },
  {
    id: "content-generator",
    label: "Content Generator",
    category: "Writing",
    description: "Generate marketing or creative content — captions, descriptions, ad copy, and more.",
    fields: [
      { name: "contentType", label: "What kind of content?", placeholder: "e.g. Instagram caption, product description, ad copy" },
      { name: "details", label: "Details", placeholder: "e.g. product: eco-friendly water bottle, audience: young professionals", textarea: true },
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
    case "article-writer":
      return `You are a skilled article writer. Write a well-structured article about: ${values.topic}.${values.keyPoints ? ` Make sure to cover these points: ${values.keyPoints}.` : ""}${values.tone ? ` Use a ${values.tone} tone.` : ""} Include a compelling headline, an engaging introduction, clear sections with subheadings, and a strong conclusion.`;
    case "email-writer":
      return `You are a professional writing assistant. Write a clear, well-structured email about: ${values.purpose}.${values.recipient ? ` The recipient is: ${values.recipient}.` : ""}${values.tone ? ` Use a ${values.tone} tone.` : ""} Include an appropriate subject line, greeting, body, and sign-off.`;
    case "essay-helper":
      return `You are an expert essay writing tutor. Help with this essay prompt: ${values.topic}.${values.essayType ? ` Essay type: ${values.essayType}.` : ""}${values.requirements ? ` Requirements: ${values.requirements}.` : ""} Provide a clear thesis statement, a suggested essay outline with main points for each paragraph, and one strong sample paragraph to demonstrate the approach.`;
    case "writing-assistant":
      return `You are a versatile writing assistant. ${values.text ? `Here is the text to work with: "${values.text}". ` : ""}The request is: ${values.instruction}. Provide a helpful, well-written response that directly addresses the request.`;
    case "grammar-tools":
      return `You are a meticulous proofreader. Review the following text for grammar, spelling, and punctuation errors: "${values.text}". Return the corrected version first, then a short bullet list explaining each significant change you made.`;
    case "summarizer":
      return `You are an expert summarizer. Summarize the following text${values.length ? ` in ${values.length}` : " concisely, capturing the key points"}: "${values.text}".`;
    case "content-generator":
      return `You are a creative content writer. Generate a ${values.contentType} based on these details: ${values.details}. Make it engaging and ready to use, and provide 2-3 variations if appropriate.`;
    case "recipe-generator":
      return `You are a helpful cooking assistant. Given these ingredients or cravings: ${values.ingredients}${values.dietary ? `, with dietary notes: ${values.dietary}` : ""}, return one clear recipe: a short title, ingredient list with quantities, and numbered steps. Keep it practical for a home cook.`;
    case "trip-planner":
      return `You are an experienced travel planner. Create a day-by-day itinerary for a ${values.duration} trip to ${values.destination}${values.interests ? `, focused on: ${values.interests}` : ""}${values.budget ? `, at a ${values.budget} budget level` : ""}. For each day, suggest a morning, afternoon, and evening activity, and mention one practical tip (transport, timing, or booking advice).`;
    default:
      throw new Error("Unknown tool.");
  }
}
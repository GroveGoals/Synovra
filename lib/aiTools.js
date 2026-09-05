// Vreedits V1 — Phase 3: AI Tools metadata.
// TODO(Phase 4+): keep expanding as more tools get specified.
// Do not invent content beyond what's listed here.

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
    id: "email-writer",
    label: "Email Writer",
    category: "Writing",
    description: "Turn a rough idea into a clear, well-written email.",
    fields: [
      { name: "purpose", label: "What's the email about?", placeholder: "e.g. asking my landlord to fix the heater", textarea: true },
      { name: "tone", label: "Tone (optional)", placeholder: "e.g. friendly, formal, firm" },
    ],
  },
  {
    id: "article-writer",
    label: "Article Writer",
    category: "Writing",
    description: "Generate a well-structured article or blog post from a topic.",
    fields: [
      { name: "topic", label: "Topic", placeholder: "e.g. the benefits of remote work" },
      { name: "audience", label: "Audience (optional)", placeholder: "e.g. small business owners" },
      { name: "length", label: "Approximate length (optional)", placeholder: "e.g. 600 words" },
    ],
  },
  {
    id: "essay-helper",
    label: "Essay Helper",
    category: "Writing",
    description: "Get help structuring, outlining, or strengthening an essay.",
    fields: [
      { name: "topic", label: "Essay topic or prompt", placeholder: "e.g. the causes of the French Revolution", textarea: true },
      { name: "thesis", label: "Thesis or main argument (optional)", placeholder: "e.g. economic inequality was the primary cause" },
      { name: "length", label: "Approximate length (optional)", placeholder: "e.g. 1000 words, 5 paragraphs" },
    ],
  },
  {
    id: "writing-assistant",
    label: "Writing Assistant",
    category: "Writing",
    description: "Improve clarity, flow, and tone of a piece of writing.",
    fields: [
      { name: "text", label: "Text to improve", placeholder: "Paste the text you want help with", textarea: true },
      { name: "goal", label: "What are you going for? (optional)", placeholder: "e.g. more concise, more persuasive, more formal" },
    ],
  },
  {
    id: "grammar-tools",
    label: "Grammar Tools",
    category: "Writing",
    description: "Check and correct grammar, spelling, and punctuation.",
    fields: [
      { name: "text", label: "Text to check", placeholder: "Paste the text you want checked", textarea: true },
    ],
  },
  {
    id: "summarizer",
    label: "Summarizer",
    category: "Writing",
    description: "Condense long text into a clear, concise summary.",
    fields: [
      { name: "text", label: "Text to summarize", placeholder: "Paste the text you want summarized", textarea: true },
      { name: "length", label: "Desired summary length (optional)", placeholder: "e.g. 3 sentences, one paragraph" },
    ],
  },
  {
    id: "content-generator",
    label: "Content Generator",
    category: "Writing",
    description: "Generate short-form content like captions, ad copy, or posts.",
    fields: [
      { name: "contentType", label: "Content type", placeholder: "e.g. Instagram caption, ad copy, product description" },
      { name: "topic", label: "Topic or product", placeholder: "e.g. a new cold brew coffee flavor", textarea: true },
      { name: "tone", label: "Tone (optional)", placeholder: "e.g. playful, professional, bold" },
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
    id: "unit-converter",
    label: "Unit Converter",
    category: "Home Tools",
    description: "Convert between units — cooking, distance, weight, temperature, and more.",
    fields: [
      { name: "value", label: "What do you want to convert?", placeholder: "e.g. 350°F to Celsius, or 2 cups to ml" },
    ],
  },
  {
    id: "budget-calculator",
    label: "Budget Calculator",
    category: "Home Tools",
    description: "Get a simple monthly budget breakdown based on your income and expenses.",
    fields: [
      { name: "income", label: "Monthly income", placeholder: "e.g. $4,000" },
      { name: "expenses", label: "Known expenses", placeholder: "e.g. rent $1500, car $300, groceries $400", textarea: true },
      { name: "goal", label: "Savings goal (optional)", placeholder: "e.g. save $500/month" },
    ],
  },
  {
    id: "meal-planner",
    label: "Meal Planner",
    category: "Home Tools",
    description: "Get a weekly meal plan based on your preferences.",
    fields: [
      { name: "people", label: "Number of people", placeholder: "e.g. 2" },
      { name: "preferences", label: "Preferences / restrictions", placeholder: "e.g. vegetarian, low-carb, quick meals", textarea: true },
      { name: "budget", label: "Budget level (optional)", placeholder: "e.g. budget-friendly, no limit" },
    ],
  },
  {
    id: "cleaning-schedule-planner",
    label: "Cleaning Schedule Planner",
    category: "Home Tools",
    description: "Get a realistic cleaning schedule for your home.",
    fields: [
      { name: "homeSize", label: "Home size / layout", placeholder: "e.g. 2-bedroom apartment" },
      { name: "household", label: "Household size (optional)", placeholder: "e.g. 2 adults, 1 kid, 1 dog" },
      { name: "frequency", label: "How often can you clean? (optional)", placeholder: "e.g. daily quick tidy, deep clean weekly" },
    ],
  },
  {
    id: "password-generator",
    label: "Password Generator",
    category: "Home Tools",
    description: "Generate strong, memorable password suggestions with guidance on best practices.",
    fields: [
      { name: "purpose", label: "What's it for? (optional)", placeholder: "e.g. banking site, email, wifi" },
      { name: "style", label: "Style preference (optional)", placeholder: "e.g. easy to type, passphrase style, max security" },
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
  {
    id: "packing-planner",
    label: "Packing Planner",
    category: "Travel",
    description: "Get a packing list tailored to your trip.",
    fields: [
      { name: "destination", label: "Destination", placeholder: "e.g. Lisbon, Portugal" },
      { name: "duration", label: "Trip length", placeholder: "e.g. 5 days" },
      { name: "season", label: "Season / expected weather (optional)", placeholder: "e.g. summer, cold and rainy" },
      { name: "activities", label: "Planned activities (optional)", placeholder: "e.g. hiking, beach, business meetings" },
    ],
  },
  {
    id: "business-planner",
    label: "Business Planner",
    category: "Business",
    description: "Get a structured business plan outline for your idea.",
    fields: [
      { name: "idea", label: "Business idea", placeholder: "Describe what your business does and who it's for", textarea: true },
      { name: "stage", label: "Stage (optional)", placeholder: "e.g. just an idea, pre-launch, already running" },
      { name: "goals", label: "Main goals (optional)", placeholder: "e.g. get first 10 customers, raise funding" },
    ],
  },
  {
    id: "marketing-planner",
    label: "Marketing Planner",
    category: "Business",
    description: "Get a practical marketing plan for your business or product.",
    fields: [
      { name: "business", label: "Business / product", placeholder: "e.g. a local coffee roastery" },
      { name: "audience", label: "Target audience", placeholder: "e.g. young professionals who work from home" },
      { name: "budget", label: "Budget level (optional)", placeholder: "e.g. low-budget/organic, some paid ads" },
      { name: "channels", label: "Channels you're interested in (optional)", placeholder: "e.g. Instagram, email, local events" },
    ],
  },
  {
    id: "business-documents",
    label: "Business Documents",
    category: "Business",
    description: "Draft a business document — proposal, contract outline, policy, or agreement.",
    fields: [
      { name: "docType", label: "Document type", placeholder: "e.g. client proposal, freelance contract, refund policy" },
      { name: "details", label: "Details to include", placeholder: "Describe the situation and what needs to be covered", textarea: true },
      { name: "tone", label: "Tone (optional)", placeholder: "e.g. formal, friendly but professional" },
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
    case "email-writer":
      return `You are a skilled writing assistant. Write a clear email based on this: ${values.purpose}.${values.tone ? ` Use a ${values.tone} tone.` : " Use a warm but professional tone."} Include a suggested subject line at the top, prefixed "Subject:".`;
    case "article-writer":
      return `You are a skilled article writer. Write a well-structured article on the topic: "${values.topic}"${values.audience ? `, aimed at ${values.audience}` : ""}${values.length ? `, approximately ${values.length}` : ""}. Include a compelling headline, an engaging introduction, clear sections with subheadings, and a strong conclusion.`;
    case "essay-helper":
      return `You are an experienced essay-writing tutor. Help with the following essay: "${values.topic}".${values.thesis ? ` The thesis/main argument is: ${values.thesis}.` : ""}${values.length ? ` Target length: ${values.length}.` : ""} Provide a clear outline with an introduction (including thesis), body paragraphs with topic sentences and supporting points, and a conclusion.`;
    case "writing-assistant":
      return `You are a skilled writing editor. Improve the clarity, flow, and tone of the following text${values.goal ? `, aiming for: ${values.goal}` : ""}: ${values.text}. Return the improved version, then briefly list the key changes you made.`;
    case "grammar-tools":
      return `You are a meticulous proofreader. Check the following text for grammar, spelling, and punctuation errors: ${values.text}. Return the corrected version, then a short bullet list of the specific errors you fixed.`;
    case "summarizer":
      return `You are a skilled summarizer. Summarize the following text${values.length ? ` in about ${values.length}` : " concisely, in a short paragraph"}, capturing only the most important points: ${values.text}.`;
    case "content-generator":
      return `You are a creative content writer. Write ${values.contentType} for: ${values.topic}.${values.tone ? ` Use a ${values.tone} tone.` : ""} Keep it concise and attention-grabbing, and provide 2-3 variations if the format allows.`;
    case "recipe-generator":
      return `You are a helpful cooking assistant. Given these ingredients or cravings: ${values.ingredients}${values.dietary ? `, with dietary notes: ${values.dietary}` : ""}, return one clear recipe: a short title, ingredient list with quantities, and numbered steps. Keep it practical for a home cook.`;
    case "unit-converter":
      return `You are a precise unit conversion assistant. Convert the following and show your work briefly: ${values.value}. Give the final converted value clearly at the top, then a one-line explanation of the conversion used.`;
    case "budget-calculator":
      return `You are a practical personal finance assistant. Given a monthly income of ${values.income} and these expenses: ${values.expenses}${values.goal ? `, with a savings goal of ${values.goal}` : ""}, create a simple monthly budget breakdown. Show a category-by-category table (approximate amounts), total expenses, and how much is left over or needs to be cut. Keep the math clear and show your work.`;
    case "meal-planner":
      return `You are a practical meal-planning assistant. Create a 7-day meal plan (breakfast, lunch, dinner) for ${values.people} people${values.preferences ? `, with these preferences/restrictions: ${values.preferences}` : ""}${values.budget ? `, at a ${values.budget} budget level` : ""}. Keep meals realistic and not overly repetitive, and end with a consolidated grocery list.`;
    case "cleaning-schedule-planner":
      return `You are a practical home-organization expert. Create a realistic cleaning schedule for a ${values.homeSize}${values.household ? ` (household: ${values.household})` : ""}${values.frequency ? `, given this availability: ${values.frequency}` : ""}. Break tasks into daily, weekly, and monthly categories, and keep the daily list short enough to actually stick to.`;
    case "password-generator":
      return `You are a security-conscious assistant. Suggest 5 strong password options${values.purpose ? ` suitable for: ${values.purpose}` : ""}${values.style ? `, in a ${values.style} style` : ""}. For each, briefly note its strength. End with 2-3 general best-practice tips (length, uniqueness, password managers, 2FA) without ever suggesting reusing real personal passwords.`;
    case "trip-planner":
      return `You are an experienced travel planner. Create a day-by-day itinerary for a ${values.duration} trip to ${values.destination}${values.interests ? `, focused on: ${values.interests}` : ""}${values.budget ? `, at a ${values.budget} budget level` : ""}. For each day, suggest a morning, afternoon, and evening activity, and mention one practical tip (transport, timing, or booking advice).`;
    case "packing-planner":
      return `You are a practical travel packing expert. Create a packing list for a ${values.duration} trip to ${values.destination}${values.season ? `, expecting ${values.season} weather` : ""}${values.activities ? `, with planned activities: ${values.activities}` : ""}. Organize the list into categories (clothing, toiletries, documents/electronics, misc) and flag anything easy to forget.`;
    case "business-planner":
      return `You are an experienced business consultant. Create a structured business plan outline for this idea: ${values.idea}.${values.stage ? ` Current stage: ${values.stage}.` : ""}${values.goals ? ` Main goals: ${values.goals}.` : ""} Cover: value proposition, target customer, revenue model, key risks, and 3 concrete next steps. Use clear headers.`;
    case "marketing-planner":
      return `You are a practical marketing strategist. Create a marketing plan for ${values.business}, targeting: ${values.audience}.${values.budget ? ` Budget level: ${values.budget}.` : ""}${values.channels ? ` Channels of interest: ${values.channels}.` : ""} Recommend specific channels and tactics, a realistic posting/campaign cadence, and 2-3 measurable goals to track.`;
    case "business-documents":
      return `You are a business writing assistant, not a lawyer. Draft a ${values.docType} covering: ${values.details}.${values.tone ? ` Use a ${values.tone} tone.` : ""} Use clear structure with headers/sections as appropriate for this document type. Add a brief note at the end recommending the person have a licensed attorney review it before using it for anything legally binding.`;
    default:
      throw new Error("Unknown tool.");
  }
}
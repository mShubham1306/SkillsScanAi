/**
 * Local NLP-based resume analysis engine.
 * Analyzes resumes using TF-IDF similarity, keyword extraction, and pattern matching.
 * No external API keys required.
 */

const natural = require('natural');
const { SKILL_CATEGORIES, ROLE_MAPPINGS, getAllSkills, getSkillCategory } = require('./skillsDB');

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

// ─── Skill Extraction ────────────────────────────────────────────────────────

/**
 * Extract skills from resume text by matching against the skills database.
 * Uses word boundary matching to avoid false positives.
 */
function extractSkills(text) {
  const lowerText = text.toLowerCase();
  const allSkills = getAllSkills();
  const foundSkills = new Set();

  for (const skill of allSkills) {
    // Escape special regex chars in skill name
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundary matching; for multi-word skills, just check includes
    let regex;
    if (skill.includes(' ') || skill.includes('.') || skill.includes('/')) {
      regex = new RegExp(`(?:^|[\\s,;|/()\\[\\]])${escaped}(?:$|[\\s,;|/()\\[\\]])`, 'i');
    } else {
      regex = new RegExp(`\\b${escaped}\\b`, 'i');
    }

    if (regex.test(lowerText)) {
      // Normalize skill name: capitalize each word
      const normalized = skill.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      foundSkills.add(normalized);
    }
  }

  // Deduplicate aliases (e.g., "reactjs" and "react" → keep "React")
  const deduped = deduplicateSkills([...foundSkills]);
  return deduped;
}

/**
 * Remove duplicate/alias skills, keeping the most common form.
 */
function deduplicateSkills(skills) {
  const aliases = {
    'Reactjs': 'React', 'React.Js': 'React',
    'Vuejs': 'Vue', 'Vue.Js': 'Vue',
    'Angularjs': 'Angular',
    'Nodejs': 'Node.js', 'Node.Js': 'Node.js',
    'Expressjs': 'Express',
    'Nextjs': 'Next.js', 'Next.Js': 'Next.js',
    'Nuxtjs': 'Nuxt.js',
    'Nestjs': 'NestJS', 'Nest.Js': 'NestJS',
    'Golang': 'Go',
    'Postgresql': 'PostgreSQL', 'Postgres': 'PostgreSQL',
    'Mssql': 'SQL Server',
    'Tailwindcss': 'Tailwind',
    'Sklearn': 'Scikit-Learn',
    'Amazon Web Services': 'AWS',
    'Google Cloud': 'GCP',
    'Springboot': 'Spring Boot',
    'Dotnet': '.NET',
    'Pyspark': 'Apache Spark',
    'K8S': 'Kubernetes',
    'Css3': 'CSS', 'Html5': 'HTML',
  };

  const seen = new Set();
  const result = [];
  for (const skill of skills) {
    const canonical = aliases[skill] || skill;
    if (!seen.has(canonical.toLowerCase())) {
      seen.add(canonical.toLowerCase());
      result.push(canonical);
    }
  }
  return result;
}

// ─── ATS Score Calculation ───────────────────────────────────────────────────

/**
 * Calculate an ATS score (0-100) based on multiple factors:
 * - Number of recognized skills (40 points)
 * - Section presence: education, experience, projects, etc (30 points)
 * - Resume length/depth (15 points)
 * - Keyword density and formatting (15 points)
 */
function calculateATSScore(skills, text) {
  let score = 0;
  const lowerText = text.toLowerCase();

  // 1. Skill count score (0-40 points)
  const skillCount = skills.length;
  if (skillCount >= 15) score += 40;
  else if (skillCount >= 10) score += 33;
  else if (skillCount >= 7) score += 26;
  else if (skillCount >= 5) score += 20;
  else if (skillCount >= 3) score += 14;
  else if (skillCount >= 1) score += 8;

  // 2. Section presence (0-30 points)
  const sections = [
    { patterns: ['education', 'academic', 'degree', 'university', 'college', 'bachelor', 'master', 'b.tech', 'm.tech', 'b.e', 'b.sc', 'm.sc'], points: 6 },
    { patterns: ['experience', 'work history', 'employment', 'professional experience'], points: 8 },
    { patterns: ['project', 'projects', 'portfolio'], points: 6 },
    { patterns: ['skill', 'skills', 'technical skills', 'competencies', 'technologies'], points: 5 },
    { patterns: ['certification', 'certifications', 'certificate', 'certified'], points: 3 },
    { patterns: ['summary', 'objective', 'about me', 'profile', 'professional summary'], points: 2 },
  ];

  for (const section of sections) {
    if (section.patterns.some(p => lowerText.includes(p))) {
      score += section.points;
    }
  }

  // 3. Resume depth/length (0-15 points)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 400) score += 15;
  else if (wordCount >= 250) score += 11;
  else if (wordCount >= 150) score += 7;
  else if (wordCount >= 80) score += 4;

  // 4. Quality indicators (0-15 points)
  // Action verbs
  const actionVerbs = ['developed', 'designed', 'implemented', 'managed', 'led', 'created', 'built', 'architected', 'optimized', 'deployed', 'automated', 'collaborated', 'analyzed', 'improved', 'established', 'maintained', 'delivered'];
  const verbCount = actionVerbs.filter(v => lowerText.includes(v)).length;
  score += Math.min(verbCount * 2, 8);

  // Quantifiable achievements (numbers/metrics)
  const hasMetrics = /\d+%|\d+\+|\d+ (users|clients|projects|team|members|applications)/i.test(text);
  if (hasMetrics) score += 4;

  // Contact info present
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(\+?\d[\d\s-]{7,})/.test(text);
  if (hasEmail || hasPhone) score += 3;

  return Math.min(score, 100);
}

// ─── Missing Competencies ────────────────────────────────────────────────────

/**
 * Find skills the user is missing, weighted by how common they are
 * across all stored resumes in the database.
 */
function findMissingCompetencies(userSkills, allDbResumes) {
  const userSkillsLower = new Set(userSkills.map(s => s.toLowerCase()));

  // Count skill frequency across all stored resumes
  const skillFrequency = {};
  for (const resume of allDbResumes) {
    const resumeSkills = new Set(resume.skills.map(s => s.toLowerCase()));
    for (const skill of resumeSkills) {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    }
  }

  // Sort by frequency and find top missing ones
  const missing = Object.entries(skillFrequency)
    .filter(([skill]) => !userSkillsLower.has(skill))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill]) => skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

  // If no stored resumes, suggest from general industry standards
  if (allDbResumes.length === 0) {
    return getDefaultMissingSkills(userSkillsLower);
  }

  return missing;
}

/**
 * Fallback: suggest commonly valued skills when no DB resumes exist yet.
 */
function getDefaultMissingSkills(userSkillsLower) {
  const topIndustrySkills = [
    'git', 'docker', 'aws', 'sql', 'python', 'javascript',
    'react', 'node.js', 'linux', 'ci/cd', 'typescript',
    'kubernetes', 'agile', 'communication', 'leadership'
  ];

  return topIndustrySkills
    .filter(s => !userSkillsLower.has(s))
    .slice(0, 8)
    .map(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
}

// ─── Role Matching ───────────────────────────────────────────────────────────

/**
 * Match user's skills against predefined role templates.
 * Returns top matching roles with percentage scores.
 */
function matchRoles(skills) {
  const userSkillsLower = new Set(skills.map(s => s.toLowerCase()));
  const roleScores = [];

  for (const role of ROLE_MAPPINGS) {
    const requiredMatches = role.requiredSkills.filter(s => userSkillsLower.has(s)).length;
    const bonusMatches = role.bonusSkills.filter(s => userSkillsLower.has(s)).length;

    if (requiredMatches === 0) continue; // Must match at least 1 required skill

    const totalPossible = role.requiredSkills.length + role.bonusSkills.length;
    const totalMatched = requiredMatches + bonusMatches;
    const rawScore = (totalMatched / totalPossible) * 100 * role.weight;
    const matchPercentage = Math.round(Math.min(rawScore, 98)); // Cap at 98

    if (matchPercentage >= 15) {
      roleScores.push({
        title: role.title,
        matchPercentage
      });
    }
  }

  // Sort by match percentage and return top 5
  roleScores.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return roleScores.slice(0, 5);
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

/**
 * Generate actionable improvement suggestions based on analysis results.
 */
function generateSuggestions(skills, text, missingCompetencies, matchedRoles) {
  const suggestions = [];
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // Section-based suggestions
  if (!lowerText.includes('summary') && !lowerText.includes('objective') && !lowerText.includes('profile')) {
    suggestions.push('Add a professional summary or objective at the top of your resume to immediately highlight your value proposition.');
  }

  if (!lowerText.includes('project') && !lowerText.includes('portfolio')) {
    suggestions.push('Include a "Projects" section showcasing 2-3 key projects with technologies used, your role, and measurable outcomes.');
  }

  if (!lowerText.includes('certification') && !lowerText.includes('certificate')) {
    suggestions.push('Consider adding relevant certifications (AWS, Google Cloud, or domain-specific certs) to strengthen your credibility.');
  }

  // Skill count suggestions
  if (skills.length < 5) {
    suggestions.push('Your resume lists very few recognizable skills. Create a dedicated "Technical Skills" section and list all relevant technologies you\'ve worked with.');
  } else if (skills.length < 10) {
    suggestions.push('Consider expanding your skills section. Group skills into categories (Languages, Frameworks, Tools, Databases) for better ATS readability.');
  }

  // Quantification
  const hasMetrics = /\d+%|\d+\+|\d+ (users|clients|projects|team)/i.test(text);
  if (!hasMetrics) {
    suggestions.push('Quantify your achievements with specific numbers and metrics (e.g., "Improved load time by 40%", "Served 10,000+ users").');
  }

  // Action verbs
  const actionVerbs = ['developed', 'designed', 'implemented', 'built', 'deployed', 'optimized', 'automated', 'led'];
  const usedVerbs = actionVerbs.filter(v => lowerText.includes(v));
  if (usedVerbs.length < 3) {
    suggestions.push('Use strong action verbs to describe your experience: "Developed", "Architected", "Deployed", "Optimized", "Automated".');
  }

  // Length
  if (wordCount < 150) {
    suggestions.push('Your resume appears quite short. Elaborate on your work experience and projects to give recruiters more context about your capabilities.');
  }

  // Missing skills suggestion
  if (missingCompetencies.length > 3) {
    const topMissing = missingCompetencies.slice(0, 3).join(', ');
    suggestions.push(`Consider learning trending skills like ${topMissing} to increase your marketability and match more roles.`);
  }

  // Role-based suggestion
  if (matchedRoles.length > 0 && matchedRoles[0].matchPercentage < 50) {
    suggestions.push(`Your strongest role match is ${matchedRoles[0].title} at ${matchedRoles[0].matchPercentage}%. Focus on gaining more skills specific to this role to improve your match score.`);
  }

  // Contact info
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  if (!hasEmail) {
    suggestions.push('Ensure your contact information (email, phone, LinkedIn) is clearly visible at the top of your resume.');
  }

  return suggestions.slice(0, 7); // Return max 7 suggestions
}

// ─── Skill Development Recommendations ───────────────────────────────────────

/**
 * Generate learning recommendations for missing skills.
 */
function generateSkillDevelopment(missingCompetencies) {
  const recommendations = {
    'react': 'Start with the official React docs (react.dev), then build projects with hooks, context, and Next.js for full-stack development.',
    'python': 'Learn Python through Automate the Boring Stuff (free). Then explore Flask/Django for web dev or Pandas/NumPy for data science.',
    'docker': 'Take Docker\'s official "Getting Started" tutorial, then practice by containerizing your own projects. Learn Docker Compose next.',
    'kubernetes': 'Start with Kubernetes basics on kubernetes.io, then try Minikube locally. KodeKloud offers excellent hands-on labs.',
    'aws': 'Start with AWS Free Tier. Learn EC2, S3, Lambda, and IAM. The AWS Cloud Practitioner cert is a great starting point.',
    'sql': 'Practice on SQLBolt.com or Mode Analytics SQL tutorial. Learn JOINs, subqueries, and window functions.',
    'git': 'Learn Git interactively on learngitbranching.js.org. Master branching, merging, rebasing, and pull request workflows.',
    'typescript': 'Start with the official TypeScript handbook. Convert an existing JavaScript project to TypeScript for hands-on learning.',
    'node.js': 'Build REST APIs with Express.js, learn async/await patterns, and practice with MongoDB or PostgreSQL integration.',
    'ci/cd': 'Set up GitHub Actions for one of your projects. Automate testing, building, and deployment to learn the pipeline workflow.',
    'linux': 'Install Ubuntu in a VM or use WSL. Learn basic commands, file permissions, and shell scripting through OverTheWire wargames.',
    'machine learning': 'Start with Andrew Ng\'s ML course on Coursera. Practice with scikit-learn on Kaggle datasets.',
    'agile': 'Read the Agile Manifesto, learn Scrum framework basics, and try to apply it in your personal or team projects.',
    'communication': 'Practice technical writing through blog posts. Present your projects in meetups or record yourself explaining technical concepts.',
    'leadership': 'Take initiative in team projects, mentor junior developers, and practice giving constructive code reviews.',
    'mongodb': 'Complete MongoDB University free courses. Practice CRUD operations and aggregation pipelines with real datasets.',
    'graphql': 'Learn GraphQL theory at graphql.org, then build a simple API using Apollo Server with Node.js.',
    'terraform': 'Start with HashiCorp\'s official Terraform tutorials. Practice by defining your cloud infrastructure as code.',
    'figma': 'Follow Figma\'s crash course, then redesign an existing app. Focus on components, auto-layout, and design systems.',
    'jest': 'Start by writing unit tests for simple utility functions, then work up to testing React components with Testing Library.',
  };

  return missingCompetencies.slice(0, 5).map(skill => {
    const skillLower = skill.toLowerCase();
    const rec = recommendations[skillLower] ||
      `Explore online courses on platforms like Coursera, Udemy, or freeCodeCamp. Build at least 2 projects using ${skill} and add them to your portfolio.`;

    return {
      skill: skill,
      recommendation: rec
    };
  });
}

// ─── TF-IDF Similarity ──────────────────────────────────────────────────────

/**
 * Compute how similar the new resume is to the stored corpus using TF-IDF.
 * Returns a similarity score and the most similar resumes.
 */
function computeCorpusSimilarity(newText, storedResumes) {
  if (storedResumes.length === 0) return { avgSimilarity: 0, topMatches: [] };

  const tfidf = new TfIdf();

  // Add the new resume first (index 0)
  tfidf.addDocument(newText.toLowerCase());

  // Add all stored resumes
  for (const resume of storedResumes) {
    tfidf.addDocument(resume.text.toLowerCase());
  }

  // Calculate similarity between new resume (index 0) and each stored resume
  const similarities = [];
  const newTerms = {};

  // Get TF-IDF vector for the new document
  tfidf.listTerms(0).forEach(item => {
    newTerms[item.term] = item.tfidf;
  });

  for (let i = 0; i < storedResumes.length; i++) {
    const storedTerms = {};
    tfidf.listTerms(i + 1).forEach(item => {
      storedTerms[item.term] = item.tfidf;
    });

    // Cosine similarity
    const similarity = cosineSimilarity(newTerms, storedTerms);
    similarities.push({
      fileName: storedResumes[i].fileName,
      similarity: Math.round(similarity * 100)
    });
  }

  similarities.sort((a, b) => b.similarity - a.similarity);

  const avgSimilarity = similarities.length > 0
    ? Math.round(similarities.reduce((sum, s) => sum + s.similarity, 0) / similarities.length)
    : 0;

  return {
    avgSimilarity,
    topMatches: similarities.slice(0, 3)
  };
}

/**
 * Cosine similarity between two TF-IDF vectors.
 */
function cosineSimilarity(vecA, vecB) {
  const terms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const term of terms) {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ─── Main Analysis Function ─────────────────────────────────────────────────

/**
 * Run the full analysis pipeline on a resume.
 * @param {string} text - Extracted resume text
 * @param {Array} allDbResumes - All resumes stored in MongoDB
 * @returns {Object} Analysis results matching the existing frontend schema
 */
function analyzeResume(text, allDbResumes = []) {
  // 1. Extract skills
  const extracted_skills = extractSkills(text);

  // 2. Calculate ATS score
  const ats_score = calculateATSScore(extracted_skills, text);

  // 3. Find missing competencies based on DB corpus
  const missing_competencies = findMissingCompetencies(extracted_skills, allDbResumes);

  // 4. Match roles
  const matched_roles = matchRoles(extracted_skills);

  // 5. Generate suggestions
  const suggestions = generateSuggestions(extracted_skills, text, missing_competencies, matched_roles);

  // 6. Skill development recommendations
  const skill_development = generateSkillDevelopment(missing_competencies);

  // 7. Corpus similarity (bonus insight)
  const similarity = computeCorpusSimilarity(text, allDbResumes);

  return {
    ats_score,
    extracted_skills,
    missing_competencies,
    matched_roles,
    suggestions,
    skill_development,
    corpus_stats: {
      total_resumes_in_db: allDbResumes.length,
      avg_similarity: similarity.avgSimilarity,
      top_similar_resumes: similarity.topMatches
    }
  };
}

module.exports = {
  analyzeResume,
  extractSkills,
  calculateATSScore,
  findMissingCompetencies,
  matchRoles,
  generateSuggestions,
  generateSkillDevelopment,
  computeCorpusSimilarity
};

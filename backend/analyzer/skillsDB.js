/**
 * Master skills database organized by category.
 * Used for skill extraction, role matching, and gap analysis.
 */

const SKILL_CATEGORIES = {
  'Programming Languages': [
    'javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'go', 'golang',
    'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab',
    'perl', 'dart', 'lua', 'haskell', 'elixir', 'clojure', 'objective-c',
    'assembly', 'fortran', 'cobol', 'visual basic', 'vb.net'
  ],
  'Frontend': [
    'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vue.js', 'vuejs',
    'svelte', 'next.js', 'nextjs', 'nuxt.js', 'nuxtjs', 'gatsby',
    'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'tailwind', 'tailwindcss',
    'bootstrap', 'material ui', 'mui', 'chakra ui', 'styled-components',
    'webpack', 'vite', 'babel', 'jquery', 'redux', 'zustand', 'mobx',
    'responsive design', 'pwa', 'web components'
  ],
  'Backend': [
    'node.js', 'nodejs', 'express', 'expressjs', 'fastify', 'nestjs', 'nest.js',
    'django', 'flask', 'fastapi', 'spring', 'spring boot', 'springboot',
    'asp.net', '.net', 'dotnet', 'rails', 'ruby on rails', 'laravel',
    'gin', 'fiber', 'actix', 'graphql', 'rest', 'restful', 'rest api',
    'microservices', 'serverless', 'websocket', 'grpc', 'soap'
  ],
  'Databases': [
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'sqlite',
    'oracle', 'sql server', 'mssql', 'redis', 'elasticsearch',
    'cassandra', 'dynamodb', 'firebase', 'firestore', 'supabase',
    'neo4j', 'couchdb', 'mariadb', 'influxdb', 'cockroachdb',
    'prisma', 'sequelize', 'mongoose', 'typeorm', 'knex'
  ],
  'Cloud & DevOps': [
    'aws', 'amazon web services', 'azure', 'gcp', 'google cloud',
    'docker', 'kubernetes', 'k8s', 'terraform', 'ansible',
    'jenkins', 'ci/cd', 'github actions', 'gitlab ci', 'circleci',
    'nginx', 'apache', 'linux', 'unix', 'bash', 'shell scripting',
    'cloudflare', 'vercel', 'netlify', 'heroku', 'digitalocean',
    'lambda', 'ec2', 's3', 'ecs', 'eks', 'fargate'
  ],
  'Data Science & AI/ML': [
    'machine learning', 'deep learning', 'artificial intelligence', 'ai',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn',
    'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly',
    'jupyter', 'data analysis', 'data visualization', 'data mining',
    'nlp', 'natural language processing', 'computer vision', 'opencv',
    'neural networks', 'reinforcement learning', 'xgboost', 'lightgbm',
    'hadoop', 'spark', 'apache spark', 'pyspark', 'airflow',
    'power bi', 'tableau', 'looker', 'data engineering', 'etl',
    'big data', 'data warehouse', 'snowflake', 'databricks'
  ],
  'Mobile': [
    'react native', 'flutter', 'ios', 'android', 'swift', 'kotlin',
    'xamarin', 'ionic', 'cordova', 'capacitor', 'expo',
    'swiftui', 'jetpack compose', 'mobile development'
  ],
  'Testing': [
    'jest', 'mocha', 'chai', 'cypress', 'selenium', 'puppeteer', 'playwright',
    'testing library', 'react testing library', 'junit', 'pytest', 'rspec',
    'unit testing', 'integration testing', 'e2e testing', 'tdd', 'bdd',
    'test automation', 'qa', 'quality assurance', 'load testing', 'jmeter'
  ],
  'Tools & Practices': [
    'git', 'github', 'gitlab', 'bitbucket', 'svn',
    'agile', 'scrum', 'kanban', 'jira', 'confluence', 'trello',
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
    'vscode', 'vim', 'intellij', 'postman', 'swagger',
    'npm', 'yarn', 'pip', 'maven', 'gradle'
  ],
  'Security': [
    'cybersecurity', 'oauth', 'oauth2', 'jwt', 'ssl', 'tls', 'https',
    'encryption', 'authentication', 'authorization',
    'owasp', 'penetration testing', 'vulnerability assessment',
    'firewall', 'siem', 'soc', 'identity management', 'iam'
  ],
  'Soft Skills': [
    'leadership', 'communication', 'teamwork', 'problem solving',
    'critical thinking', 'time management', 'project management',
    'mentoring', 'presentation', 'negotiation', 'collaboration',
    'adaptability', 'creativity', 'decision making', 'strategic thinking',
    'stakeholder management', 'cross-functional', 'self-motivated'
  ]
};

/**
 * Mapping from skill combinations to job roles.
 * Each role has required skills (must have some) and nice-to-have skills.
 */
const ROLE_MAPPINGS = [
  {
    title: 'Frontend Developer',
    requiredSkills: ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'svelte', 'next.js'],
    bonusSkills: ['redux', 'tailwind', 'webpack', 'vite', 'responsive design', 'sass', 'figma'],
    weight: 1
  },
  {
    title: 'Backend Developer',
    requiredSkills: ['node.js', 'express', 'django', 'flask', 'spring', 'fastapi', '.net', 'rails', 'nestjs'],
    bonusSkills: ['sql', 'mongodb', 'redis', 'graphql', 'rest', 'microservices', 'docker'],
    weight: 1
  },
  {
    title: 'Full Stack Developer',
    requiredSkills: ['react', 'vue', 'angular', 'node.js', 'express', 'django', 'next.js'],
    bonusSkills: ['mongodb', 'postgresql', 'docker', 'git', 'typescript', 'tailwind', 'redis'],
    weight: 1.1
  },
  {
    title: 'Data Scientist',
    requiredSkills: ['python', 'machine learning', 'pandas', 'numpy', 'data analysis', 'scikit-learn', 'tensorflow', 'pytorch'],
    bonusSkills: ['deep learning', 'nlp', 'data visualization', 'jupyter', 'sql', 'r', 'statistics'],
    weight: 1
  },
  {
    title: 'DevOps Engineer',
    requiredSkills: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'jenkins', 'ci/cd', 'linux'],
    bonusSkills: ['ansible', 'bash', 'nginx', 'github actions', 'monitoring', 'prometheus'],
    weight: 1
  },
  {
    title: 'Mobile Developer',
    requiredSkills: ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android'],
    bonusSkills: ['firebase', 'mobile development', 'expo', 'swiftui', 'jetpack compose'],
    weight: 1
  },
  {
    title: 'Machine Learning Engineer',
    requiredSkills: ['python', 'tensorflow', 'pytorch', 'machine learning', 'deep learning', 'neural networks'],
    bonusSkills: ['computer vision', 'nlp', 'kubernetes', 'docker', 'mlops', 'aws', 'data engineering'],
    weight: 1
  },
  {
    title: 'QA / Test Engineer',
    requiredSkills: ['selenium', 'cypress', 'jest', 'pytest', 'unit testing', 'test automation', 'qa', 'playwright'],
    bonusSkills: ['jmeter', 'load testing', 'e2e testing', 'ci/cd', 'tdd', 'bdd'],
    weight: 1
  },
  {
    title: 'Cloud Architect',
    requiredSkills: ['aws', 'azure', 'gcp', 'terraform', 'kubernetes', 'docker', 'microservices'],
    bonusSkills: ['serverless', 'lambda', 'ec2', 's3', 'networking', 'security', 'iam'],
    weight: 1
  },
  {
    title: 'Database Administrator',
    requiredSkills: ['sql', 'postgresql', 'mysql', 'mongodb', 'oracle', 'sql server'],
    bonusSkills: ['redis', 'elasticsearch', 'data warehouse', 'backup', 'performance tuning', 'replication'],
    weight: 0.9
  },
  {
    title: 'Cybersecurity Analyst',
    requiredSkills: ['cybersecurity', 'penetration testing', 'owasp', 'firewall', 'encryption', 'siem'],
    bonusSkills: ['linux', 'networking', 'vulnerability assessment', 'python', 'bash', 'iam'],
    weight: 1
  },
  {
    title: 'UI/UX Designer',
    requiredSkills: ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator'],
    bonusSkills: ['html', 'css', 'responsive design', 'user research', 'wireframing', 'prototyping'],
    weight: 0.9
  },
  {
    title: 'Data Engineer',
    requiredSkills: ['python', 'sql', 'spark', 'airflow', 'etl', 'data engineering', 'hadoop'],
    bonusSkills: ['aws', 'kafka', 'snowflake', 'databricks', 'docker', 'kubernetes'],
    weight: 1
  },
  {
    title: 'Project Manager / Scrum Master',
    requiredSkills: ['agile', 'scrum', 'kanban', 'jira', 'project management'],
    bonusSkills: ['leadership', 'communication', 'stakeholder management', 'confluence', 'trello'],
    weight: 0.85
  }
];

/**
 * Returns a flat array of all known skills (lowercased).
 */
function getAllSkills() {
  const skills = new Set();
  for (const category of Object.values(SKILL_CATEGORIES)) {
    for (const skill of category) {
      skills.add(skill.toLowerCase());
    }
  }
  return [...skills];
}

/**
 * Returns skill categories as a map for lookup.
 */
function getSkillCategory(skill) {
  const s = skill.toLowerCase();
  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.includes(s)) return category;
  }
  return 'Other';
}

module.exports = {
  SKILL_CATEGORIES,
  ROLE_MAPPINGS,
  getAllSkills,
  getSkillCategory
};

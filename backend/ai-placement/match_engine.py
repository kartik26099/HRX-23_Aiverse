import asyncio
import re
import numpy as np
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from sentence_transformers import SentenceTransformer, util
import spacy
from aiohttp import ClientSession
from functools import lru_cache
import logging
import time
import redis
import hashlib
from typing import Optional

# Set up logging for debugging and profiling
logging.basicConfig(filename="matcher.log", level=logging.WARNING)
profiler = logging.getLogger("profiler")
profiler.setLevel(logging.INFO)
fh = logging.FileHandler("profiler.log")
profiler.addHandler(fh)

# Initialize Redis (optional)
try:
    redis_client = redis.Redis(host="localhost", port=6379, decode_responses=False)
    redis_client.ping()
except redis.ConnectionError:
    redis_client = None
    logging.warning("Redis unavailable; caching disabled")

# Initialize NLP tools (optimized SpaCy pipeline)
nlp = spacy.load("en_core_web_sm", disable=["parser", "lemmatizer"])
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize Groq LLM (async client)
llm = ChatGroq(
    api_key="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",
    model_name="llama3-8b-8192"
)

# Skill normalization dictionary
SKILL_NORMALIZATION = {
    # Programming Languages
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "python": "Python",
    "java": "Java",
    "c++": "C++",
    "c#": "C#",
    "php": "PHP",
    "ruby": "Ruby",
    "go": "Go",
    "rust": "Rust",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "scala": "Scala",
    "r": "R",
    "matlab": "MATLAB",
    "perl": "Perl",
    "bash": "Bash",
    "shell": "Shell Scripting",
    
    # Frameworks and Libraries
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "django": "Django",
    "flask": "Flask",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "laravel": "Laravel",
    "rails": "Ruby on Rails",
    "rubyonrails": "Ruby on Rails",
    "asp.net": "ASP.NET",
    "dotnet": ".NET",
    ".net": ".NET",
    "jquery": "jQuery",
    "bootstrap": "Bootstrap",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "sass": "Sass",
    "scss": "Sass",
    "less": "Less",
    
    # Databases
    "mongodb": "MongoDB",
    "mysql": "MySQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "sqlite": "SQLite",
    "redis": "Redis",
    "firebase": "Firebase",
    "supabase": "Supabase",
    "oracle": "Oracle",
    "sql server": "SQL Server",
    "sqlserver": "SQL Server",
    "mariadb": "MariaDB",
    "cassandra": "Cassandra",
    "dynamodb": "DynamoDB",
    "elasticsearch": "Elasticsearch",
    
    # Cloud and DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "google cloud": "Google Cloud",
    "gcp": "Google Cloud",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "jenkins": "Jenkins",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "chef": "Chef",
    "puppet": "Puppet",
    "vagrant": "Vagrant",
    "virtualbox": "VirtualBox",
    "vmware": "VMware",
    
    # AI/ML
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "artificial intelligence": "AI",
    "ai": "AI",
    "deep learning": "Deep Learning",
    "neural networks": "Neural Networks",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "scikit-learn": "Scikit-learn",
    "scikitlearn": "Scikit-learn",
    "opencv": "OpenCV",
    "numpy": "NumPy",
    "pandas": "Pandas",
    "matplotlib": "Matplotlib",
    "seaborn": "Seaborn",
    "keras": "Keras",
    "xgboost": "XGBoost",
    "lightgbm": "LightGBM",
    "spark": "Apache Spark",
    "hadoop": "Hadoop",
    "hive": "Hive",
    "pig": "Pig",
    "kafka": "Kafka",
    "flink": "Flink",
    
    # Web Technologies
    "html": "HTML",
    "css": "CSS",
    "html5": "HTML5",
    "css3": "CSS3",
    "ajax": "AJAX",
    "rest api": "REST API",
    "restapi": "REST API",
    "graphql": "GraphQL",
    "websocket": "WebSocket",
    "socket.io": "Socket.IO",
    "socketio": "Socket.IO",
    "jwt": "JWT",
    "oauth": "OAuth",
    "ssl": "SSL/TLS",
    "tls": "SSL/TLS",
    "http": "HTTP",
    "https": "HTTPS",
    "cdn": "CDN",
    "load balancer": "Load Balancing",
    "loadbalancer": "Load Balancing",
    
    # Mobile Development
    "react native": "React Native",
    "reactnative": "React Native",
    "flutter": "Flutter",
    "ionic": "Ionic",
    "xamarin": "Xamarin",
    "android": "Android Development",
    "ios": "iOS Development",
    "swiftui": "SwiftUI",
    "kotlin": "Kotlin",
    "objective-c": "Objective-C",
    "objectivec": "Objective-C",
    
    # Other Technologies
    "blockchain": "Blockchain",
    "ethereum": "Ethereum",
    "solidity": "Solidity",
    "web3": "Web3",
    "bitcoin": "Bitcoin",
    "iot": "IoT",
    "internet of things": "IoT",
    "arduino": "Arduino",
    "raspberry pi": "Raspberry Pi",
    "raspberrypi": "Raspberry Pi",
    "microcontroller": "Microcontroller Programming",
    "embedded systems": "Embedded Systems",
    "fpga": "FPGA",
    "verilog": "Verilog",
    "vhdl": "VHDL",
    
    # Development Concepts
    "api development": "API Development",
    "api integration": "API Integration",
    "responsive design": "Responsive Design",
    "user experience": "UX Design",
    "user interface": "UI Design",
    "ui/ux": "UI/UX Design",
    "ux/ui": "UI/UX Design",
    "state management": "State Management",
    "version control": "Version Control",
    "agile": "Agile Development",
    "scrum": "Scrum",
    "kanban": "Kanban",
    "test driven development": "TDD",
    "tdd": "TDD",
    "continuous integration": "CI/CD",
    "cicd": "CI/CD",
    "devops": "DevOps",
    "microservices": "Microservices",
    "serverless": "Serverless",
    "full stack": "Full Stack Development",
    "fullstack": "Full Stack Development",
    "frontend": "Frontend Development",
    "backend": "Backend Development",
    "web development": "Web Development",
    "mobile development": "Mobile Development",
    "data science": "Data Science",
    "data analysis": "Data Analysis",
    "data visualization": "Data Visualization",
    "problem solving": "Problem Solving",
    "algorithms": "Algorithms",
    "data structures": "Data Structures",
    "object oriented programming": "OOP",
    "oop": "OOP",
    "functional programming": "Functional Programming",
    "design patterns": "Design Patterns",
    "software architecture": "Software Architecture",
    "system design": "System Design",
    "database design": "Database Design",
    "security": "Security",
    "cybersecurity": "Cybersecurity",
    "penetration testing": "Penetration Testing",
    "ethical hacking": "Ethical Hacking",
    "network security": "Network Security",
    "cryptography": "Cryptography",
    "authentication": "Authentication",
    "authorization": "Authorization",
    "encryption": "Encryption",
    "vulnerability assessment": "Vulnerability Assessment",
    "incident response": "Incident Response",
    "forensics": "Digital Forensics",
    "compliance": "Compliance",
    "gdpr": "GDPR",
    "hipaa": "HIPAA",
    "sox": "SOX",
    "pci dss": "PCI DSS",
    "pci": "PCI DSS",
    
    # Business and Soft Skills
    "project management": "Project Management",
    "team leadership": "Team Leadership",
    "communication": "Communication",
    "collaboration": "Collaboration",
    "problem solving": "Problem Solving",
    "critical thinking": "Critical Thinking",
    "analytical skills": "Analytical Skills",
    "time management": "Time Management",
    "customer service": "Customer Service",
    "sales": "Sales",
    "marketing": "Marketing",
    "digital marketing": "Digital Marketing",
    "seo": "SEO",
    "sem": "SEM",
    "social media": "Social Media Marketing",
    "content creation": "Content Creation",
    "copywriting": "Copywriting",
    "branding": "Branding",
    "market research": "Market Research",
    "data analysis": "Data Analysis",
    "business intelligence": "Business Intelligence",
    "bi": "Business Intelligence",
    "financial analysis": "Financial Analysis",
    "accounting": "Accounting",
    "bookkeeping": "Bookkeeping",
    "tax preparation": "Tax Preparation",
    "auditing": "Auditing",
    "risk management": "Risk Management",
    "compliance": "Compliance",
    "legal": "Legal",
    "contract management": "Contract Management",
    "negotiation": "Negotiation",
    "presentation": "Presentation Skills",
    "public speaking": "Public Speaking",
    "training": "Training",
    "mentoring": "Mentoring",
    "coaching": "Coaching",
    "recruitment": "Recruitment",
    "hr": "Human Resources",
    "human resources": "Human Resources",
    "talent acquisition": "Talent Acquisition",
    "employee relations": "Employee Relations",
    "performance management": "Performance Management",
    "compensation": "Compensation",
    "benefits": "Benefits Administration",
    "workforce planning": "Workforce Planning",
    "diversity": "Diversity & Inclusion",
    "inclusion": "Diversity & Inclusion",
    "equity": "Diversity & Inclusion",
    "dei": "Diversity & Inclusion",
    
    # Industry-specific
    "healthcare": "Healthcare",
    "pharmaceuticals": "Pharmaceuticals",
    "biotechnology": "Biotechnology",
    "medical devices": "Medical Devices",
    "clinical research": "Clinical Research",
    "nursing": "Nursing",
    "medicine": "Medicine",
    "pharmacy": "Pharmacy",
    "telemedicine": "Telemedicine",
    "health informatics": "Health Informatics",
    "finance": "Finance",
    "banking": "Banking",
    "investment": "Investment",
    "trading": "Trading",
    "portfolio management": "Portfolio Management",
    "risk assessment": "Risk Assessment",
    "credit analysis": "Credit Analysis",
    "financial modeling": "Financial Modeling",
    "valuation": "Valuation",
    "mergers": "Mergers & Acquisitions",
    "acquisitions": "Mergers & Acquisitions",
    "m&a": "Mergers & Acquisitions",
    "insurance": "Insurance",
    "underwriting": "Underwriting",
    "claims": "Claims Processing",
    "actuarial": "Actuarial Science",
    "education": "Education",
    "teaching": "Teaching",
    "curriculum development": "Curriculum Development",
    "instructional design": "Instructional Design",
    "e-learning": "E-Learning",
    "online education": "Online Education",
    "student assessment": "Student Assessment",
    "academic advising": "Academic Advising",
    "research": "Research",
    "academic research": "Academic Research",
    "market research": "Market Research",
    "user research": "User Research",
    "qualitative research": "Qualitative Research",
    "quantitative research": "Quantitative Research",
    "statistical analysis": "Statistical Analysis",
    "survey design": "Survey Design",
    "focus groups": "Focus Groups",
    "interviews": "Interviews",
    "data collection": "Data Collection",
    "data cleaning": "Data Cleaning",
    "data validation": "Data Validation",
    "data quality": "Data Quality",
    "data governance": "Data Governance",
    "data privacy": "Data Privacy",
    "data protection": "Data Protection",
    "data security": "Data Security",
    "data breach": "Data Breach Response",
    "incident management": "Incident Management",
    "disaster recovery": "Disaster Recovery",
    "business continuity": "Business Continuity",
    "change management": "Change Management",
    "process improvement": "Process Improvement",
    "lean": "Lean",
    "six sigma": "Six Sigma",
    "quality assurance": "Quality Assurance",
    "qa": "Quality Assurance",
    "testing": "Testing",
    "manual testing": "Manual Testing",
    "automated testing": "Automated Testing",
    "unit testing": "Unit Testing",
    "integration testing": "Integration Testing",
    "system testing": "System Testing",
    "user acceptance testing": "User Acceptance Testing",
    "uat": "User Acceptance Testing",
    "performance testing": "Performance Testing",
    "load testing": "Load Testing",
    "stress testing": "Stress Testing",
    "security testing": "Security Testing",
    "penetration testing": "Penetration Testing",
    "vulnerability scanning": "Vulnerability Scanning",
    "code review": "Code Review",
    "peer review": "Peer Review",
    "technical writing": "Technical Writing",
    "documentation": "Documentation",
    "user manuals": "User Manuals",
    "api documentation": "API Documentation",
    "technical specifications": "Technical Specifications",
    "requirements gathering": "Requirements Gathering",
    "business analysis": "Business Analysis",
    "systems analysis": "Systems Analysis",
    "data modeling": "Data Modeling",
    "database modeling": "Database Modeling",
    "er modeling": "ER Modeling",
    "entity relationship": "ER Modeling",
    "uml": "UML",
    "unified modeling language": "UML",
    "class diagrams": "Class Diagrams",
    "sequence diagrams": "Sequence Diagrams",
    "use case diagrams": "Use Case Diagrams",
    "activity diagrams": "Activity Diagrams",
    "state diagrams": "State Diagrams",
    "component diagrams": "Component Diagrams",
    "deployment diagrams": "Deployment Diagrams",
    "architecture diagrams": "Architecture Diagrams",
    "network diagrams": "Network Diagrams",
    "flowcharts": "Flowcharts",
    "process flow": "Process Flow",
    "workflow": "Workflow",
    "business process": "Business Process",
    "process mapping": "Process Mapping",
    "value stream mapping": "Value Stream Mapping",
    "kanban board": "Kanban Board",
    "scrum board": "Scrum Board",
    "sprint planning": "Sprint Planning",
    "backlog grooming": "Backlog Grooming",
    "story points": "Story Points",
    "velocity": "Velocity",
    "burndown chart": "Burndown Chart",
    "burnup chart": "Burnup Chart",
    "retrospective": "Retrospective",
    "daily standup": "Daily Standup",
    "sprint review": "Sprint Review",
    "sprint retrospective": "Sprint Retrospective",
    "product owner": "Product Owner",
    "scrum master": "Scrum Master",
    "development team": "Development Team",
    "stakeholder": "Stakeholder Management",
    "stakeholder management": "Stakeholder Management",
    "requirements management": "Requirements Management",
    "scope management": "Scope Management",
    "time management": "Time Management",
    "cost management": "Cost Management",
    "quality management": "Quality Management",
    "risk management": "Risk Management",
    "procurement management": "Procurement Management",
    "communication management": "Communication Management",
    "integration management": "Integration Management",
    "project charter": "Project Charter",
    "project plan": "Project Plan",
    "work breakdown structure": "Work Breakdown Structure",
    "wbs": "Work Breakdown Structure",
    "critical path": "Critical Path",
    "gantt chart": "Gantt Chart",
    "milestone": "Milestone",
    "deliverable": "Deliverable",
    "baseline": "Baseline",
    "variance": "Variance",
    "earned value": "Earned Value",
    "ev": "Earned Value",
    "planned value": "Planned Value",
    "pv": "Planned Value",
    "actual cost": "Actual Cost",
    "ac": "Actual Cost",
    "schedule variance": "Schedule Variance",
    "sv": "Schedule Variance",
    "cost variance": "Cost Variance",
    "cv": "Cost Variance",
    "schedule performance index": "Schedule Performance Index",
    "spi": "Schedule Performance Index",
    "cost performance index": "Cost Performance Index",
    "cpi": "Cost Performance Index",
    "estimate at completion": "Estimate at Completion",
    "eac": "Estimate at Completion",
    "estimate to complete": "Estimate to Complete",
    "etc": "Estimate to Complete",
    "variance at completion": "Variance at Completion",
    "vac": "Variance at Completion",
    "to complete performance index": "To Complete Performance Index",
    "tcpi": "To Complete Performance Index",
    "budget at completion": "Budget at Completion",
    "bac": "Budget at Completion",
    "project management office": "Project Management Office",
    "pmo": "Project Management Office",
    "program management": "Program Management",
    "portfolio management": "Portfolio Management",
    "project governance": "Project Governance",
    "project methodology": "Project Methodology",
    "waterfall": "Waterfall",
    "agile": "Agile",
    "scrum": "Scrum",
    "kanban": "Kanban",
    "lean": "Lean",
    "six sigma": "Six Sigma",
    "prince2": "PRINCE2",
    "pmp": "PMP",
    "project management professional": "PMP",
    "capm": "CAPM",
    "certified associate in project management": "CAPM",
    "pmi": "PMI",
    "project management institute": "PMI",
    "itil": "ITIL",
    "information technology infrastructure library": "ITIL",
    "cobit": "COBIT",
    "control objectives for information and related technology": "COBIT",
    "iso": "ISO",
    "international organization for standardization": "ISO",
    "iso 9001": "ISO 9001",
    "iso 27001": "ISO 27001",
    "iso 14001": "ISO 14001",
    "iso 20000": "ISO 20000",
    "iso 22301": "ISO 22301",
    "iso 31000": "ISO 31000",
    "iso 45001": "ISO 45001",
    "iso 50001": "ISO 50001",
    "iso 55001": "ISO 55001",
    "iso 56000": "ISO 56000",
    "iso 56002": "ISO 56002",
    "iso 56003": "ISO 56003",
    "iso 56004": "ISO 56004",
    "iso 56005": "ISO 56005",
    "iso 56006": "ISO 56006",
    "iso 56007": "ISO 56007",
    "iso 56008": "ISO 56008",
    "iso 56009": "ISO 56009",
    "iso 56010": "ISO 56010"
}

# Refined prompt for LLM scoring
section_prompt_template = PromptTemplate.from_template("""
You are a recruitment expert scoring similarity between a CV section and a JD section.

Return a score from 0 to 100:
- 100: Perfect match (e.g., identical skills or experience).
- 50: Partial match (e.g., related skills or experience).
- 0: No relevance.

**Rules:**
- Consider synonyms (e.g., "ML" and "Machine Learning" are equivalent).
- Exact matches for skills or degrees score higher.
- Ignore filler words (e.g., "proficient in").

**Examples:**
1. CV: "Python, Java, SQL"
   JD: "Python, JavaScript"
   Score: 80

2. CV: "Marketing and sales"
   JD: "Software engineering"
   Score: 5

3. CV: "BS in Computer Science"
   JD: "Bachelor's in related field"
   Score: 95

CV: {cv_section}
JD: {jd_section}

Return only the score (number). No text.
""")

def profile(func):
    """Decorator to log execution time."""
    async def async_wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        profiler.info(f"{func.__name__} took {time.time() - start:.4f} seconds")
        return result
    def sync_wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        profiler.info(f"{func.__name__} took {time.time() - start:.4f} seconds")
        return result
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

@lru_cache(maxsize=1000)
@profile
def clean_text(text: str, is_education: bool = False) -> str:
    if isinstance(text, (list, tuple)):
        text = ", ".join(str(t) for t in text if t).strip()
    text = str(text).lower().strip()
    if not text:
        return ""
    
    # First, try to normalize common skill patterns
    normalized_text = text
    
    # Handle common skill patterns
    for skill_key, normalized_skill in SKILL_NORMALIZATION.items():
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(skill_key) + r'\b'
        normalized_text = re.sub(pattern, normalized_skill.lower(), normalized_text)
    
    doc = nlp(normalized_text)
    tokens = []
    for token in doc:
        if token.is_stop and not is_education:  # Keep stop words for education
            continue
        if token.is_punct:
            continue
        # Use the normalized skill if available, otherwise use the token text
        token_text = SKILL_NORMALIZATION.get(token.text, token.text)
        tokens.append(token_text)
    
    if is_education:
        return " ".join(tokens)  # Skip entity extraction
    
    # Extract named entities for better matching
    entities = [ent.text.lower() for ent in doc.ents if ent.label_ in ["ORG", "PRODUCT", "DATE", "GPE"]]
    
    # Combine tokens and entities
    result = " ".join(tokens + entities)
    
    # Final cleanup - remove extra whitespace and normalize
    result = re.sub(r'\s+', ' ', result).strip()
    
    return result

@profile
def batch_compute_embeddings(texts: list[str]) -> np.ndarray:
    """Compute embeddings in batch with Redis caching."""
    valid_texts = [t for t in texts if t]
    if not valid_texts:
        return np.zeros((len(texts), embedder.get_sentence_embedding_dimension()))
    
    embeddings = []
    texts_to_compute = []
    text_indices = []
    
    # Check Redis cache
    for i, text in enumerate(texts):
        if not text:
            embeddings.append(np.zeros(embedder.get_sentence_embedding_dimension()))
            continue
        key = f"embed:{hashlib.md5(text.encode()).hexdigest()}"
        if redis_client and redis_client.exists(key):
            emb = np.frombuffer(redis_client.get(key))
            embeddings.append(emb)
        else:
            texts_to_compute.append(text)
            text_indices.append(i)
            embeddings.append(None)
    
    # Compute missing embeddings
    if texts_to_compute:
        new_embeddings = embedder.encode(texts_to_compute, convert_to_tensor=True, show_progress_bar=False).cpu().numpy()
        for i, (text, emb) in enumerate(zip(texts_to_compute, new_embeddings)):
            embeddings[text_indices[i]] = emb
            if redis_client:
                key = f"embed:{hashlib.md5(text.encode()).hexdigest()}"
                redis_client.setex(key, 86400, emb.tobytes())  # Cache for 24 hours
    
    return np.array(embeddings)

@profile
async def compute_llm_score(cv_text: str, jd_text: str, session: ClientSession, retries: int = 2) -> float:
    if not cv_text or not jd_text:
        return 5.0
    prompt = section_prompt_template.format(cv_section=cv_text, jd_section=jd_text)
    for attempt in range(retries):
        try:
            async with session.post(
                "https://api.groq.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {llm.api_key}"},
                json={"model": llm.model_name, "messages": [{"role": "user", "content": prompt}]}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    content = data["choices"][0]["message"]["content"]
                    logging.info(f"LLM output for {cv_text[:50]} vs {jd_text[:50]}: {content}")
                    match = re.search(r'\b(?:100(?:\.0+)?|[1-9]?\d(?:\.\d+)?)\b', content)
                    return float(match.group()) if match else 5.0
                logging.warning(f"LLM request failed: Status {response.status}")
        except Exception as e:
            logging.warning(f"LLM attempt {attempt + 1} failed: {e}")
            if attempt == retries - 1:
                return 5.0
        await asyncio.sleep(0.5)
    return 5.0

def rule_based_boost(cv_text: str, jd_text: str, base_score: float) -> float:
    cv_tokens = set(cv_text.split())
    jd_tokens = set(jd_text.split())
    common = cv_tokens.intersection(jd_tokens)
    boost = min(20, len(common) * 10)  # Cap at 20 points for exact matches
    related_pairs = {("java", "javascript"), ("sql", "database")}  # Add more pairs
    for cv_t, jd_t in related_pairs:
        if cv_t in cv_tokens and jd_t in jd_tokens:
            boost += 5  # 5 points for related terms
    return min(100, base_score + min(boost, 30))  # Total boost capped at 30

@profile
async def score_section(key: str, cv_text: str, jd_text: str, weights: dict, use_llm: bool, session: ClientSession, ambiguous_range: tuple = (20, 70)) -> dict:
    cv_clean = clean_text(cv_text)
    jd_clean = clean_text(jd_text)
    if not cv_clean or not jd_clean:
        score = 5.0
    else:
        embeddings = await asyncio.to_thread(batch_compute_embeddings, [cv_clean, jd_clean])
        score = round(max(0, min(100, util.cos_sim(embeddings[0], embeddings[1]).item() * 100)), 2)
    if use_llm and ambiguous_range[0] <= score <= ambiguous_range[1]:
        llm_score = await compute_llm_score(cv_clean, jd_clean, session)
        score = max(score, llm_score)
    score = rule_based_boost(cv_clean, jd_clean, score)
    weighted_score = round((score * weights.get(key, 1.0)) / 100, 2)
    return {f"{key}_score": score, f"{key}_weighted": weighted_score}

async def matcher_agent(parsed_cv: dict, summarized_jd: dict, weights: dict = None, use_llm: bool = False, ambiguous_range: tuple = (40, 60)) -> dict:
    """Optimized matcher agent with Redis caching and dynamic LLM usage."""
    if weights is None:
        weights = {"skills": 40, "experience": 30, "education": 15, "certifications": 10, "projects": 5}
    
    # Normalize weights
    total_weight = sum(weights.values())
    weights = {k: (v / total_weight) * 100 for k, v in weights.items()}
    
    jd_sections = summarized_jd.get("text", {})
    tasks = []
    
    # Pre-clean texts
    texts_to_embed = []
    sections = []
    async with ClientSession() as session:
        for key in weights:
            cv_raw = parsed_cv.get(key, "")
            jd_raw = jd_sections.get(key, "")
            
            # Convert lists to strings before cleaning
            if isinstance(cv_raw, (list, tuple)):
                cv_raw = ", ".join(str(t) for t in cv_raw if t).strip()
            if isinstance(jd_raw, (list, tuple)):
                jd_raw = ", ".join(str(t) for t in jd_raw if t).strip()
                
            cv_clean = clean_text(cv_raw)
            jd_clean = clean_text(jd_raw)
            sections.append((key, cv_clean, jd_clean))
            if not use_llm or (use_llm and ambiguous_range):  # Embeddings needed
                texts_to_embed.extend([cv_clean, jd_clean])
        
        # Batch compute embeddings
        if texts_to_embed:
            embeddings = await asyncio.to_thread(batch_compute_embeddings, texts_to_embed)
            embed_idx = 0
        
        # Score sections
        for key, cv_clean, jd_clean in sections:
            if not cv_clean or not jd_clean:
                score = 5.0
                weighted_score = round((score * weights.get(key, 1.0)) / 100, 2)
                result = {f"{key}_score": score, f"{key}_weighted": weighted_score}
            else:
                tasks.append(score_section(key, cv_clean, jd_clean, weights, use_llm, session, ambiguous_range))
                embed_idx += 2
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Aggregate scores
    scores = {}
    for result in results:
        if isinstance(result, dict):
            scores.update(result)
    
    final_score = sum(scores.get(f"{k}_weighted", 0) for k in weights)
    scores["final_match_score"] = round(final_score, 2)
    scores["explanation"] = (
        f"Final score is a weighted average of semantic similarity across sections, "
        f"using sentence embeddings with rule-based boosts and "
        f"{'dynamic LLM for ambiguous scores' if use_llm else 'no LLM'}."
    )
    
    return scores

def load_fine_tuned_model(model_path: Optional[str] = None) -> SentenceTransformer:
    """Load a fine-tuned SentenceTransformer model (placeholder)."""
    if model_path:
        try:
            return SentenceTransformer(model_path)
        except Exception as e:
            logging.warning(f"Failed to load fine-tuned model: {e}")
    return SentenceTransformer("multi-qa-MiniLM-L6-cos-v1")

if __name__ == "__main__":
    # Example usage
    parsed_cv = {
    "skills": ["Python", "Java", "SQL", "REST APIs"],
    "experience": "Developed scalable backend systems using Python and Java, including REST APIs and database integration with SQL.",
    "education": "Bachelor of Science in Computer Science, graduated 2020"
    }
    summarized_jd = {
        "text": {
            "skills": ["Python", "JavaScript", "REST APIs"],
            "experience": "Build scalable backend systems with Python or JavaScript, including REST APIs and cloud deployment.",
            "education": "Bachelor's degree in Computer Science or related field"
        }
    }
    weights = {"skills": 40, "experience": 30, "education": 30}
    
    result = asyncio.run(matcher_agent(parsed_cv, summarized_jd, weights, use_llm=True))
    print(result)
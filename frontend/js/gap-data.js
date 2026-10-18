// Sample role requirements used when the Flask API is unavailable.
const LOCAL_ROLE_SKILLS = {
  "Data Scientist": "Python,Machine Learning,Statistics,SQL,Data Visualization,Pandas,NumPy,Scikit-learn",
  "Web Developer": "HTML,CSS,JavaScript,React,Node.js,SQL,Git,REST APIs",
  "Machine Learning Engineer": "Python,Machine Learning,Deep Learning,TensorFlow,PyTorch,Mathematics,Git,Docker",
  "Data Analyst": "SQL,Excel,Data Visualization,Python,Statistics,Tableau,Power BI",
  "Cybersecurity Analyst": "Networking,Linux,Security Protocols,Python,Ethical Hacking,Firewalls,Cryptography",
  "Penetration Tester": "Ethical Hacking,Python,Networking,Linux,Cryptography,Vulnerability Assessment,Kali Linux",
  "Security Operations Analyst": "SIEM Tools,Incident Response,Networking,Linux,Threat Intelligence,Firewalls,Security Protocols",
  "Python Developer": "Python,REST APIs,Django,Flask,SQL,Git,Docker,Unit Testing",
  "Full Stack Developer": "HTML,CSS,JavaScript,React,Node.js,Python,SQL,Git,REST APIs,Docker",
  "Frontend Developer": "HTML,CSS,JavaScript,React,Vue.js,TypeScript,Git,Responsive Design",
  "Backend Developer": "Python,Node.js,Java,SQL,NoSQL,REST APIs,Docker,Git",
  "Cloud Engineer": "AWS,Azure,GCP,Docker,Kubernetes,Linux,Networking,Terraform",
  "DevOps Engineer": "Linux,Docker,Kubernetes,CI/CD,AWS,Git,Scripting,Networking",
  "NLP Engineer": "Python,Machine Learning,NLP,Deep Learning,TensorFlow,Mathematics,Git",
  "Healthcare Administrator": "Healthcare Management,Medical Terminology,HIPAA Compliance,MS Office,Healthcare IT,Budgeting,Communication,Leadership",
  "Hospital Operations Manager": "Healthcare Management,Operations,Budgeting,Leadership,Medical Terminology,HIPAA Compliance,Communication,EHR Systems",
  "Clinical Project Coordinator": "Clinical Research,Medical Terminology,Project Management,HIPAA Compliance,MS Office,Communication,Data Analysis",
  "Medical Coder": "ICD-10,CPT Coding,Medical Terminology,HIPAA Compliance,EHR Systems,Anatomy,MS Office,Attention to Detail",
  "Medical Billing Specialist": "Medical Billing,ICD-10,CPT Coding,Medical Terminology,EHR Systems,Insurance Claims,MS Office",
  "Health Information Technician": "Health Records,ICD-10,Medical Terminology,EHR Systems,HIPAA Compliance,Data Entry,Attention to Detail",
  "Health Informatics Specialist": "Health IT,EHR Systems,Data Analysis,Python,SQL,HIPAA Compliance,Healthcare Management,HL7",
  "Clinical Data Analyst": "SQL,Data Analysis,Python,EHR Systems,Statistics,Healthcare Management,Data Visualization",
  "Healthcare Data Scientist": "Python,Machine Learning,Statistics,SQL,EHR Systems,Data Visualization,HIPAA Compliance,Pandas",
  "Automation Engineer": "PLC Programming,SCADA,Industrial Automation,Robotics,Electrical Engineering,C++,CAD,Troubleshooting",
  "Robotics Engineer": "Robotics,Python,C++,ROS,Mechanical Engineering,PLC Programming,CAD,MATLAB",
  "Industrial IoT Engineer": "IoT,Python,Networking,PLC Programming,Industrial Automation,Data Analysis,Cloud Platforms,Sensors",
  "Quality Control Analyst": "Quality Management,Six Sigma,Statistical Analysis,Inspection Techniques,ISO Standards,MS Office,Root Cause Analysis",
  "Quality Assurance Engineer": "Quality Management,Six Sigma,ISO Standards,Testing,Statistical Analysis,Root Cause Analysis,Lean Manufacturing",
  "Lean Manufacturing Specialist": "Lean Manufacturing,Six Sigma,Process Improvement,Quality Management,Value Stream Mapping,MS Office,Leadership",
  "Industrial Maintenance Technician": "Electrical Systems,Mechanical Maintenance,PLC Programming,Troubleshooting,Safety Protocols,Hydraulics,CMMS",
  "Maintenance Engineer": "Mechanical Engineering,Electrical Systems,PLC Programming,Hydraulics,Preventive Maintenance,CMMS,Troubleshooting",
  "Plant Engineer": "Mechanical Engineering,Electrical Systems,Industrial Automation,Project Management,Safety Protocols,CAD,Troubleshooting",
  "Financial Analyst": "Financial Modeling,Excel,Python,SQL,Data Analysis,Accounting,Statistics,Power BI",
  "Investment Analyst": "Financial Modeling,Excel,Statistics,Economics,Data Analysis,Bloomberg Terminal,Risk Analysis,SQL",
  "Equity Research Analyst": "Financial Modeling,Excel,Statistics,Economics,Valuation,Data Analysis,Bloomberg Terminal,Communication",
  "Accountant": "Accounting,Tally,MS Excel,Financial Reporting,Tax Compliance,Bookkeeping,Auditing,Attention to Detail",
  "Tax Analyst": "Tax Compliance,Accounting,MS Excel,Financial Reporting,Income Tax,GST,Auditing,Attention to Detail",
  "Forensic Accountant": "Accounting,Auditing,Financial Investigation,MS Excel,Data Analysis,Legal Knowledge,Attention to Detail",
  "Risk Analyst": "Risk Management,Financial Modeling,Excel,Statistics,SQL,Data Analysis,Compliance,Communication",
  "Credit Risk Analyst": "Risk Management,Credit Analysis,Financial Modeling,Excel,Statistics,SQL,Banking Regulations,Communication",
  "Compliance Officer": "Compliance,Risk Management,Legal Knowledge,Banking Regulations,MS Office,Communication,Attention to Detail",
  "Digital Marketing Specialist": "SEO,SEM,Google Analytics,Social Media Marketing,Content Marketing,Email Marketing,MS Office,Canva",
  "SEO Analyst": "SEO,Google Analytics,Keyword Research,Content Marketing,HTML Basics,Data Analysis,MS Office",
  "Social Media Manager": "Social Media Marketing,Content Creation,Canva,Analytics,Communication,Copywriting,SEO",
  "Sales Executive": "Communication,CRM Tools,Negotiation,MS Office,Product Knowledge,Lead Generation,Customer Service",
  "Business Development Manager": "Business Development,CRM Tools,Negotiation,Communication,Lead Generation,Financial Analysis,Presentation Skills",
  "Sales Operations Analyst": "CRM Tools,SQL,Data Analysis,Excel,Communication,Sales Strategy,Reporting",
  "Business Analytics Manager": "SQL,Python,Data Visualization,Power BI,Tableau,Excel,Statistics,Communication",
  "Data Analyst - Business": "SQL,Excel,Power BI,Data Visualization,Statistics,Communication,Python",
  "Market Research Analyst": "Data Analysis,Excel,Statistics,Communication,SQL,Survey Tools,Report Writing",
  "Precision Farming Specialist": "GIS,Remote Sensing,Agricultural Technology,Data Analysis,GPS Technology,Soil Science,IoT,Python",
  "Agricultural Data Analyst": "Data Analysis,Python,SQL,GIS,Agricultural Technology,Statistics,Remote Sensing",
  "Drone Technology Specialist": "Drone Technology,GIS,Remote Sensing,Agricultural Technology,Data Analysis,GPS Technology",
  "Agricultural Technology Specialist": "Agricultural Technology,IoT,Python,Data Analysis,Soil Science,Machine Learning,GIS,Communication",
  "Farm Management Software Specialist": "Farm Management Software,Agricultural Technology,MS Office,Data Analysis,Communication,ERP Systems",
  "AgriTech Product Manager": "Agricultural Technology,Product Management,Communication,Data Analysis,IoT,Project Management,Python",
  "Supply Chain Manager": "Supply Chain Management,Logistics,ERP Systems,MS Excel,Communication,Inventory Management,Procurement",
  "Agricultural Supply Chain Analyst": "Supply Chain Management,Data Analysis,Excel,Logistics,Communication,ERP Systems,SQL",
  "Cold Chain Specialist": "Cold Chain Management,Logistics,Supply Chain Management,Food Safety,ERP Systems,Communication,MS Office",
};

function analyzeSkillGapLocally(studentSkills, targetRole) {
  const roleSkills = LOCAL_ROLE_SKILLS[targetRole];
  if (!roleSkills) {
    throw new Error(`No local skill requirements are available for "${targetRole}".`);
  }

  const knownSkills = new Set(studentSkills.map(skill => skill.trim().toLocaleLowerCase()));
  const requiredSkills = roleSkills.split(",").map(name => name.trim()).map(name => ({
    name,
    demand_score: null,
    category: "Sample role requirement",
    growth_trend: "unavailable",
  }));
  const matched = requiredSkills.filter(skill => knownSkills.has(skill.name.toLocaleLowerCase()));
  const missing = requiredSkills.filter(skill => !knownSkills.has(skill.name.toLocaleLowerCase()));
  const coverage = Math.round((matched.length / requiredSkills.length) * 1000) / 10;

  return {
    target_role: targetRole,
    total_required_skills: requiredSkills.length,
    matched_skills: matched,
    missing_skills: missing,
    coverage_score: coverage,
    gap_percentage: Math.round((100 - coverage) * 10) / 10,
    offline_mode: true,
  };
}

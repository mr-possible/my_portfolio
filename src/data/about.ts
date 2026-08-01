export interface EducationEntry {
  period: string;
  university: string;
  location: string;
  degree: string;
  grade: string;
}

export interface Award {
  title: string;
  description: string;
}

export interface ExperienceEntry {
  role: string;
  org: string;
  duration: string;
  location: string;
  mode: string;
  routine: string;
  highlights: string[];
  stack: string;
  awards?: Award[];
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ActivityEntry {
  title: string;
  year: string;
  points: string[];
}

export const summary =
  'I am a passionate and detail-oriented Software Engineer/SDET from India. With a keen interest in ensuring software quality and delivering robust solutions, I bring a unique blend of technical skills and a quality-focused mindset. Please scroll down to know more about me.';

export const education: EducationEntry[] = [
  {
    period: '2023 - 2024',
    university: 'Swansea University',
    location: 'Swansea, United Kingdom',
    degree: 'Master of Science - Computer Science',
    grade: 'Distinction',
  },
  {
    period: '2015 - 2019',
    university: 'Chhattisgarh Swami Vivekananda Technical University',
    location: 'Bhilai, India',
    degree: 'Bachelor of Engineering - Computer Science',
    grade: '8.65 out of 10 (Honors Division)',
  },
];

export const experience: ExperienceEntry[] = [
  {
    role: 'Senior SDET',
    org: 'SeekOut',
    duration: 'Mar/2025 - Present',
    location: 'Bangalore, Karnataka, India',
    mode: 'Hybrid | Full-time',
    routine:
      'SQA, Scrum Meetings, PR reviews, Debugging, Test Automation, Product Smoke and Regression Testing',
    highlights: [
      'Architected the core test strategy for Outreach platform within the engineering team.',
      'Wrote service level unit and integration tests for NestJS backend services.',
      'Solely involved as principle QA for in-sprint testing of new features.',
      'Doing code reviews for test automation code ensuring industry standard code quality.',
    ],
    stack: 'Typescript, Playwright, Azure DevOps, NestJS',
  },
  {
    role: 'Senior SDET',
    org: 'Xogene Services LLC',
    duration: 'Mar/2024 - Mar/2025',
    location: 'Pune, Maharashtra, India',
    mode: 'Remote | Full-time',
    routine: 'SQA, Scrum Meetings, PR reviews, Debugging, Test Automation',
    highlights: [
      'First automation tester who built the automation test infrastructure from scratch.',
      'Laid out the automation test strategy and created/maintained test automation deliverables.',
      'Helped the product testing team in writing efficient test cases.',
      'Added user centric locators to frontend for better and reliable automated testing.',
    ],
    stack: 'Java, Selenide, REST-assured, Docker, AWS',
  },
  {
    role: 'Student Teaching Assistant',
    org: 'Swansea University',
    duration: 'Oct/2023 - Dec/2023',
    location: 'Swansea, Wales, United Kingdom',
    mode: 'Onsite | Part-time',
    routine: 'Management of labs and resolving course related doubts of BSc/MSc students.',
    highlights: [
      'My job is to assist in labs of Java programming and Web Development modules.',
      'Both of these labs consist of ~100 students each, running twice a week for 2 hours.',
    ],
    stack: 'Java, Laravel, Tailwind CSS, React',
  },
  {
    role: 'Student Software Developer (Python Developer)',
    org: 'SAIL Databank',
    duration: 'Jun/2023 - Sept/2023',
    location: 'Swansea, Wales, United Kingdom',
    mode: 'Remote | Part-time',
    routine: 'Scrum Meetings & occasional supervisor meetups',
    highlights: [
      'Joined as a part-time developer intern to a team of 5 developers cum researchers in the field of Population Data Science.',
      'Main work revolved around feature development using Django, solving bugs and also developing an API client for internal use by researchers.',
    ],
    stack: 'Python, Tkinter, Django',
  },
  {
    role: 'Consultant (SDET)',
    org: 'Genpact Digital',
    duration: 'Mar/2021 - Dec/2022',
    location: 'Bangalore, Karnataka, India',
    mode: 'Remote | Full-time',
    routine: 'SQA, Scrum Meetings, PR reviews, Debugging, Test Automation',
    highlights: [
      'Joined as a SDET for a SaaS project called as PVAI (Pharmacovigilance Artificial Intelligence) that served pharma giants across Europe and UK.',
      'Extended the test automation framework by code refactoring and adding new features.',
      'Leveraged Selenium WebDriver & REST-Assured for test automation, increasing coverage by 40%.',
    ],
    stack: 'Java, SpringBoot, React, Redis, AWS, Selenium Webdriver, REST-Assured',
    awards: [
      {
        title: 'PVAI Spot Award',
        description:
          'Acknowledged by the VP (Quality Engineering) for swift onboarding and rapid adaptation and valuable contribution to the team dynamics during a critical phase of the ongoing project.',
      },
      {
        title: 'PVAI Enabler of Excellence',
        description:
          'Received award for rapidly mentoring colleagues in Test Automation, preparing them efficiently for real assignments.',
      },
    ],
  },
  {
    role: 'Assistant Systems Engineer (Automation QA)',
    org: 'Tata Consultancy Services Pvt Ltd.',
    duration: 'Jul/2019 - Mar/2021',
    location: 'Nagpur, Maharashtra, India',
    mode: 'Onsite and then Remote (due to COVID) | Full-time',
    routine: 'SQA, Scrum Meetings, Test Automation',
    highlights: [
      'Joined as a junior SDET to the QA team of TCS BaNCS (a software suite developed by TCS to serve leading banks across the globe).',
      'Learned to write efficient test cases and automated them enhancing overall test coverage.',
      'Solely designed and setup the core test automation framework for the QA team to carry the work forward.',
      'Implemented CI/CD for the test-scripts to run on AWS EC2 containers.',
      'Introduced healthy practices as a software engineer for fellow members to follow. Maintained proper documentation also.',
      'Occasionally led scrum meetings and experienced all the phases of Agile software development, especially the QA signoff.',
    ],
    stack:
      'Software Quality Assurance, Java, Selenium Webdriver, REST-Assured, Docker, Jenkins, AWS',
  },
];

export const skillGroups: SkillGroup[] = [
  { category: 'Programming', items: ['Java', 'Python'] },
  { category: 'Backend', items: ['Spring Boot', 'Django', 'NodeJS'] },
  { category: 'Frontend', items: ['HTML', 'JavaScript', 'React'] },
  { category: 'CI/CD', items: ['Jenkins', 'Github Actions', 'Docker'] },
  {
    category: 'Testing',
    items: [
      'Postman',
      'TestNG',
      'Selenium Webdriver',
      'Selenide',
      'WebdriverIO',
      'Playwright',
      'REST-Assured',
    ],
  },
  { category: 'Databases', items: ['MySQL'] },
  { category: 'Version Control', items: ['Git'] },
  {
    category: 'Tools/Cloud',
    items: ['Apache Maven', 'Poetry', 'MS Azure DevOps', 'AWS (not an expert)'],
  },
];

export const misc: { label: string; value: string }[] = [
  { label: 'Languages', value: 'English (Business-fluent), Hindi (Mother-tongue)' },
  { label: 'Marital Status', value: 'Single' },
  { label: 'Current Location', value: 'Pune, Maharashtra, India' },
];

export const activities: ActivityEntry[] = [
  {
    title: 'Smart India Hackathon',
    year: '2017',
    points: [
      'First nationwide hackathon organised by Govt of India.',
      'Our head of department (during my bachelors) selected me and one friend of mine from the entire class to join a team of 3 seniors for this hackathon.',
      "Our team made a Django project titled 'Petrol Pump Locator' which could be used by people to locate nearby petrol pumps around their location.",
      "Me and my friend worked on the frontend part of the project while others worked on the backend. But we did tinker around with Django's configuration.",
      'Honestly, it was a thrilling experience where interest for application programming grew for me.',
      'Having said that, it was a bit overwhelming too, since we were not that good at coding at that point of time, but we did get alot of exposure.',
    ],
  },
  {
    title: 'Code Club Member, SSEC',
    year: '2019',
    points: [
      'SSEC is short for my college - Shri Shankaracharya Engineering College, Bhilai.',
      'I got my hands dirty on C/C++ mentorship being a final year student in my college. Helped juniors in campus placement as well.',
    ],
  },
];

export const hobbies = 'Cooking, Cleaning, Travelling.';

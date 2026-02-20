export interface Project {
  title: string;
  skills: string[];
  description: string;
  github: string;
  video?: string;
}

export const projects: Project[] = [
  {
    title: 'Single Responsibility Principle in Test Automation',
    skills: ['Java17', 'Selenium Webdriver', 'Design Patterns'],
    description:
      'A project that demonstrates the motive behind single responsibility principle and how it can be incorporated in test automation space.',
    github:
      'https://github.com/mr-possible/SingleResponsibilityPrincipal_Demo',
    video: 'https://youtu.be/ImQeSQ_iXqs?si=URAlrXr6Ar_JWs40',
  },
  {
    title: 'Selenium Framework with Disposable Selenium Grid using Docker',
    skills: ['Java 17', 'Selenium Webdriver', 'Selenium Grid', 'Docker', 'Jenkins', 'AWS'],
    description:
      'A project that demonstrates how dockerised selenium grid can help fasten the testing process and avoid resource constraints. CI is implemented using Jenkins and AWS.',
    github: 'https://github.com/mr-possible/selenium-with-docker',
  },
  {
    title: 'API Testing Framework implemented using Python',
    skills: ['Python', 'Behave', 'Cucumber', 'BDD', 'Poetry'],
    description:
      'A project implemented using Python to cater to API testing using a library called Behave. Follows BDD approach with Cucumber.',
    github: 'https://github.com/mr-possible/python-api-automation',
  },
  {
    title: 'IPL Match History Full Stack Application',
    skills: ['Java 17', 'Spring', 'React'],
    description:
      'A full stack application that shows IPL match history in a user-intuitive manner using ReactJS. It ingests data from a CSV file using Spring Batch mechanism.',
    github: 'https://github.com/mr-possible/ipl-dashboard',
  },
  {
    title: 'Secure Voting Application in Ethereum and Smart Contracts',
    skills: ['NodeJS', 'ReactJS', 'Websockets', 'Solidity', 'Postgres'],
    description:
      'MSc thesis — A full stack decentralised application (dApp) that simulates voting without compromising user data. Uses JWT authentication and Postgres for hashed user storage.',
    github: 'https://github.com/mr-possible/ipl-dashboard',
  },
  {
    title: 'Full Stack Blog Application',
    skills: ['Python 3', 'Django', 'HTML5', 'CSS3'],
    description:
      'A project made using Django for writing blogging content using a dedicated admin panel. Employs most main features of Django.',
    github: 'https://github.com/mr-possible/my-blog',
  },
  {
    title: 'Microservice Architecture using Spring Cloud',
    skills: ['Java 17', 'Spring Boot', 'Spring Cloud'],
    description:
      'Demonstrates a basic architecture of microservices tied together using Spring Cloud. Ensures Service Discovery, Fault Tolerance, Load Balancing and Distributed Tracing.',
    github: 'https://github.com/mr-possible/spring-cloud-fundamentals',
  },
  {
    title: 'Book Review Website',
    skills: ['PHP', 'Laravel 10', 'MySQL', 'Docker'],
    description:
      'University coursework project demonstrating learnings on Laravel full stack web application. Scored 90% marks on final submission.',
    github: 'https://github.com/mr-possible/book-review-site',
  },
];

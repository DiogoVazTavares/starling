/**
 * First technical QuestionTree set for @starling/bank.
 * Authored in wayfinder ticket 025 from the Renesas/Altium spoken portion
 * (questions-portion.srt) — trains the topic class, not that interview's script.
 *
 * Drop into packages/bank when wiring; do not import from the app yet.
 *
 * Types match 018-unified-question-bank-schema.md.
 */

export type InterviewCategory = 'behavioral' | 'technical' | 'seniority';

export interface Question {
  id: string;
  text: string;
  tags?: string[];
  required?: boolean;
}

export interface QuestionTree {
  id: string;
  category: InterviewCategory;
  theme?: string;
  main: Question;
  followUps: Question[];
}

export const TECHNICAL_TREES_V1: QuestionTree[] = [
  {
    id: 'tech-browser-url-enter',
    category: 'technical',
    theme: 'browser',
    main: {
      id: 'tech-browser-url-enter-main',
      text: 'Walk me through what happens from the moment you type a URL into the address bar and press Enter until the page appears on screen.',
    },
    followUps: [
      {
        id: 'tech-browser-url-enter-missing-close-tag',
        text: 'What happens if an HTML tag in the response is never closed — for example a missing </div>? Does the page fail, or does the browser recover?',
        tags: ['html', 'parsing', 'error-handling'],
        required: true,
      },
      {
        id: 'tech-browser-url-enter-dns',
        text: 'Where does DNS fit in that path, and what does the browser actually get back from it?',
        tags: ['dns', 'networking', 'depth'],
      },
      {
        id: 'tech-browser-url-enter-resources',
        text: 'After the HTML arrives, how does the browser decide which CSS, scripts, and images to fetch, and in what order?',
        tags: ['rendering', 'resources', 'depth'],
      },
      {
        id: 'tech-browser-url-enter-cache',
        text: 'Where can caching change this path — browser cache, DNS cache, or elsewhere — and what would the user see differently?',
        tags: ['caching', 'networking'],
      },
      {
        id: 'tech-browser-url-enter-paint',
        text: 'When does the browser first paint something, and what still might load after that first paint?',
        tags: ['rendering', 'paint', 'depth'],
      },
    ],
  },

  {
    id: 'tech-rest',
    category: 'technical',
    theme: 'http-apis',
    main: {
      id: 'tech-rest-main',
      text: 'What is REST, and what does it mean for how a client talks to a server?',
    },
    followUps: [
      {
        id: 'tech-rest-get-vs-post',
        text: 'How do GET and POST differ — when would you use each, and what does each imply about changing server state?',
        tags: ['methods', 'verbs', 'depth'],
        required: true,
      },
      {
        id: 'tech-rest-password-in-query',
        text: 'Is it acceptable to send a password as a GET query parameter? Why or why not?',
        tags: ['security', 'methods', 'query-params'],
        required: true,
      },
      {
        id: 'tech-rest-acronym',
        text: 'What does REST stand for, and is it a protocol, an architectural style, or something else?',
        tags: ['definitions', 'correctness'],
      },
      {
        id: 'tech-rest-safe-idempotent',
        text: 'What does it mean for an HTTP method to be safe or idempotent, and which common methods fit each label?',
        tags: ['methods', 'depth'],
      },
      {
        id: 'tech-rest-put-vs-patch',
        text: 'When would you choose PUT versus PATCH for updating a resource?',
        tags: ['methods', 'depth'],
      },
      {
        id: 'tech-rest-stateless',
        text: 'REST is often described as stateless — what does that require of each request, and what belongs on the server between requests?',
        tags: ['architecture', 'depth'],
      },
    ],
  },

  {
    id: 'tech-http-vs-https',
    category: 'technical',
    theme: 'transport-security',
    main: {
      id: 'tech-http-vs-https-main',
      text: 'What is the difference between HTTP and HTTPS?',
    },
    followUps: [
      {
        id: 'tech-http-vs-https-encrypt-vs-obfuscate',
        text: 'People sometimes mix up encryption, encoding, and obfuscation. How do those differ, and which one does HTTPS actually provide?',
        tags: ['encryption', 'definitions', 'correctness'],
        required: true,
      },
      {
        id: 'tech-http-vs-https-what-is-protected',
        text: 'On an HTTPS connection, what is encrypted end-to-end, and what can still be visible to an observer on the network?',
        tags: ['encryption', 'networking', 'depth'],
      },
      {
        id: 'tech-http-vs-https-certificates',
        text: 'What role do certificates play when a browser opens an HTTPS site?',
        tags: ['tls', 'trust', 'depth'],
      },
      {
        id: 'tech-http-vs-https-body-vs-query',
        text: 'Does putting a secret in a POST body instead of a query string make it safe on plain HTTP? Why or why not?',
        tags: ['security', 'methods', 'correctness'],
      },
    ],
  },

  {
    id: 'tech-cors',
    category: 'technical',
    theme: 'browser-security',
    main: {
      id: 'tech-cors-main',
      text: 'What is CORS, and how does a browser use it when a page makes a cross-origin request?',
    },
    followUps: [
      {
        id: 'tech-cors-why-exists',
        text: 'Why does CORS exist — what attack or failure mode is it meant to prevent?',
        tags: ['why', 'security'],
        required: true,
      },
      {
        id: 'tech-cors-simple-vs-preflight',
        text: 'When does a browser send a preflight (OPTIONS) request, versus treating the request as a simple request?',
        tags: ['preflight', 'depth'],
      },
      {
        id: 'tech-cors-who-enforces',
        text: 'Who enforces CORS — the browser, the server, or both — and what happens if a non-browser client ignores it?',
        tags: ['security', 'correctness'],
      },
      {
        id: 'tech-cors-allow-origin',
        text: 'What does Access-Control-Allow-Origin control, and what goes wrong if a server reflects any Origin with credentials allowed?',
        tags: ['headers', 'security', 'depth'],
      },
      {
        id: 'tech-cors-same-origin',
        text: 'What counts as the same origin — scheme, host, and port — and give an example of two URLs that look related but are cross-origin.',
        tags: ['definitions', 'correctness'],
      },
    ],
  },

  {
    id: 'tech-event-loop',
    category: 'technical',
    theme: 'javascript-runtime',
    main: {
      id: 'tech-event-loop-main',
      text: 'What is the JavaScript event loop, and how does it decide what runs next?',
    },
    followUps: [
      {
        id: 'tech-event-loop-micro-vs-macro',
        text: 'What is the difference between microtasks and macrotasks, and which kinds of work go on each queue?',
        tags: ['microtasks', 'macrotasks', 'correctness'],
        required: true,
      },
      {
        id: 'tech-event-loop-settimeout',
        text: 'Where does a setTimeout callback land, and what happens even when the delay is 0?',
        tags: ['macrotasks', 'timers', 'depth'],
      },
      {
        id: 'tech-event-loop-promise-then',
        text: 'Where does a Promise.then callback land relative to the current task, and how does that compare to setTimeout(fn, 0)?',
        tags: ['microtasks', 'promises', 'depth'],
      },
      {
        id: 'tech-event-loop-blocking',
        text: 'What happens to the page if JavaScript runs a long CPU-heavy loop on the main thread?',
        tags: ['blocking', 'ux', 'depth'],
      },
      {
        id: 'tech-event-loop-call-stack',
        text: 'How do the call stack and the task queues work together while the event loop runs?',
        tags: ['call-stack', 'definitions'],
      },
    ],
  },
];

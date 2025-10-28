/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

/// <reference types="cypress" />

type LoginProfessorOptions = {
  mockClock?: boolean;
};

declare global {
  namespace Cypress {
    interface Chainable {
      loginProfessor(options?: LoginProfessorOptions): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginProfessor', (options: LoginProfessorOptions = {}) => {
  const { mockClock = false } = options;

  cy.intercept('POST', '**/auth/login', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        user: {
          id: 'teacher-1',
          email: 'docente@example.com',
          name: 'Ana',
          roles: ['docente'],
        },
      },
    });
  }).as('loginRequest');

  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: {
      id: 'teacher-1',
      email: 'docente@example.com',
      name: 'Ana',
      lastname: 'Gonzalez',
      roles: ['docente'],
    },
  }).as('getCurrentUser');

  if (mockClock) {
    cy.clock(Date.now(), ['setTimeout', 'clearTimeout']);
  }
  cy.visit('http://localhost:5173/login');
  cy.get('input[id="login_email"]').type('docente@example.com');
  cy.get('input[id="login_password"]').type('Docente123!');
  cy.get('button[type="submit"]').click();
  cy.wait('@loginRequest');
  cy.wait('@getCurrentUser');
});

export {};

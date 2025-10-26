/// <reference types="cypress" />

const ensureDashboardLoaded = () => {
  cy.location('pathname', { timeout: 10000 }).should('eq', '/');
  cy.contains(/Dashboard/i).should('exist');
};

const stubProfessorNavigationApis = () => {
  cy.intercept('GET', '**/academic/teacher/**', {
    statusCode: 200,
    body: {
      code: 200,
      data: {
        id: 'teacher-1',
        name: 'Ana',
        lastname: 'Gonzalez',
        email: 'docente@example.com',
      },
    },
  }).as('getTeacherInfo');

  cy.intercept('GET', '**/academic/course/by-teacher/**', {
    statusCode: 200,
    body: {
      code: 200,
      data: [],
    },
  }).as('getCoursesByTeacher');

  cy.intercept('GET', '**/api/documents', {
    statusCode: 200,
    body: {
      success: true,
      message: '',
      documents: [],
      total: 0,
    },
  }).as('getDocuments');
};

describe('Professor Dashboard (UPB-240)', () => {
  it('Carga correctamente el dashboard del profesor', () => {
    cy.loginProfessor();
    ensureDashboardLoaded();

    cy.fixture('professor/counts.json').then(({ courses, students, activeExams }) => {
      cy.get('[data-testid="prof-summary-courses"]').should('contain', String(courses));
      cy.get('[data-testid="prof-summary-students"]').should('contain', String(students));
      cy.get('[data-testid="prof-summary-active-exams"]').should('contain', String(activeExams));
    });

    cy.get('[data-testid="prof-upcoming-schedule"]').within(() => {
      cy.contains(/Publish Midterm #2/i).should('exist');
      cy.contains(/Grade Quiz #5/i).should('exist');
    });
  });

  it('Permite navegar a las secciones principales', () => {
    stubProfessorNavigationApis();

    cy.loginProfessor();
    ensureDashboardLoaded();

    cy.get('a[href="/courses"]').click({ force: true });
    cy.url().should('include', '/courses');
    cy.wait('@getCoursesByTeacher');

    cy.go('back');
    ensureDashboardLoaded();

    cy.get('a[href="/exams/create"]').click({ force: true });
    cy.url().should('include', '/exams/create');
    cy.wait('@getCoursesByTeacher');

    cy.go('back');
    ensureDashboardLoaded();

    cy.get('a[href="/document"]').click({ force: true });
    cy.url().should('include', '/document');
    cy.wait('@getDocuments');

    cy.go('back');
    ensureDashboardLoaded();

    cy.get('a[href="/settings"]').click({ force: true });
    cy.url().should('include', '/settings');
  });

  it('Muestra placeholders mientras carga la data del dashboard', () => {
    cy.loginProfessor({ mockClock: true });
    ensureDashboardLoaded();

    cy.get('[data-testid="prof-summary-courses"] .ant-skeleton').should('be.visible');
    cy.get('[data-testid="prof-summary-students"] .ant-skeleton').should('be.visible');
    cy.get('[data-testid="prof-summary-active-exams"] .ant-skeleton').should('be.visible');

    cy.tick(600);
    cy.get('[data-testid="prof-summary-courses"] .ant-skeleton').should('not.exist');
    cy.get('[data-testid="prof-summary-students"] .ant-skeleton').should('not.exist');
    cy.get('[data-testid="prof-summary-active-exams"] .ant-skeleton').should('not.exist');
    cy.fixture('professor/counts.json').then(({ courses, students, activeExams }) => {
      cy.get('[data-testid="prof-summary-courses"]').should('contain', String(courses));
      cy.get('[data-testid="prof-summary-students"]').should('contain', String(students));
      cy.get('[data-testid="prof-summary-active-exams"]').should('contain', String(activeExams));
    });
  });
});

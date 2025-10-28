describe('CoursesPage', () => {

  beforeEach(() => {
    cy.fixture('courses').as('coursesData');
    cy.visit('http://localhost:5173/login');
    cy.get('input[id="login_email"]').type('docente@example.com');
    cy.get('input[id="login_password"]').type('Docente123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
    cy.wait(2000);
  });

  it('debe cargar la página de materias', function() {
    cy.intercept('GET', '**/academic/course/by-teacher/**', {
      statusCode: 200,
      body: this.coursesData.courses
    }).as('getCourses');

    cy.visit('http://localhost:5173/professor/courses');
    cy.wait('@getCourses');
    
    cy.contains('Materias').should('be.visible');
    cy.contains('button', 'Registrar materia').should('be.visible');
  });

  it('debe mostrar las tarjetas de cursos', function() {
    cy.intercept('GET', '**/academic/course/by-teacher/**', {
      statusCode: 200,
      body: this.coursesData.courses
    }).as('getCourses');

    cy.visit('http://localhost:5173/professor/courses');
    cy.wait('@getCourses');
    
    cy.contains('Algoritmica 1').should('be.visible');
    cy.contains('Algoritmica 2').should('be.visible');
  });

  it('debe filtrar cursos al buscar', function() {
    cy.intercept('GET', '**/academic/course/by-teacher/**', {
      statusCode: 200,
      body: this.coursesData.courses
    }).as('getCourses');

    cy.visit('http://localhost:5173/professor/courses');
    cy.wait('@getCourses');
    
    cy.get('input[placeholder="Buscar materia"]').type('Algoritmica');
    cy.wait(500);
    
    cy.contains('Algoritmica 1').should('be.visible');
    cy.contains('Base de Datos I').should('not.exist');
  });

  it('debe navegar a períodos al hacer click en un curso', function() {
    cy.intercept('GET', '**/academic/course/by-teacher/**', {
      statusCode: 200,
      body: this.coursesData.courses
    }).as('getCourses');

    cy.visit('http://localhost:5173/professor/courses');
    cy.wait('@getCourses');
    
    cy.contains('Algoritmica 1').parents('[class*="CustomCard"]').click();
    cy.url().should('include', '/periods');
  });

  it('debe navegar a exámenes al hacer click en el botón', function() {
    cy.intercept('GET', '**/academic/course/by-teacher/**', {
      statusCode: 200,
      body: this.coursesData.courses
    }).as('getCourses');

    cy.visit('http://localhost:5173/professor/courses');
    cy.wait('@getCourses');
    
    cy.contains('Algoritmica 1')
      .parents('[class*="CustomCard"]')
      .within(() => {
        cy.contains('button', 'Exámenes').click();
      });
    
    cy.url().should('include', '/exams');
  });

  it('debe navegar a materiales al hacer click en el botón', function() {
    cy.intercept('GET', '**/academic/course/by-teacher/**', {
      statusCode: 200,
      body: this.coursesData.courses
    }).as('getCourses');

    cy.visit('http://localhost:5173/professor/courses');
    cy.wait('@getCourses');
    
    cy.contains('Algoritmica 1')
      .parents('[class*="CustomCard"]')
      .within(() => {
        cy.contains('button', 'Materiales').click();
      });
    
    cy.url().should('include', '/documents');
  });

  it('debe mostrar estado vacío cuando no hay cursos', function() {
    cy.intercept('GET', '**/academic/course/by-teacher/**', {
      statusCode: 200,
      body: []
    }).as('getEmptyCourses');

    cy.visit('http://localhost:5173/professor/courses');
    cy.wait('@getEmptyCourses');
    
    cy.contains('No hay materías todavía.').should('be.visible');
  });

  it('debe abrir modal al hacer click en registrar materia', function() {
    cy.intercept('GET', '**/academic/course/by-teacher/**', {
      statusCode: 200,
      body: this.coursesData.courses
    }).as('getCourses');

    cy.visit('http://localhost:5173/professor/courses');
    cy.wait('@getCourses');
    
    cy.contains('button', 'Registrar materia').click();
    cy.get('.ant-modal').should('be.visible');
  });
});

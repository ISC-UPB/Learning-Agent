describe('Smoke - Home', () => {
  it('debe responder 200 y cargar la raíz', () => {
    cy.request('/').its('status').should('eq', 200);
    cy.visit('/');
    cy.title().should('not.be.empty');
  });
});
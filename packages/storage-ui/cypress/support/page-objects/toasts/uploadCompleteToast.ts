export const uploadCompleteToast = {
  body: () => cy.get("[data-testid=toast-upload-complete]", { timeout: 10000 }),
  closeButton: () => cy.get("[data-testid=button-close-toast-upload-complete]")
}
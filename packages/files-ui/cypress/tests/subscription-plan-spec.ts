import { navigationMenu } from "../support/page-objects/navigationMenu"
import { settingsPage } from "../support/page-objects/settingsPage"
import { addCardModal } from "../support/page-objects/modals/addCardModal"
import { visaCardNumber, cardExpirationDate, cardCvcNumber } from "../fixtures/cardData"

describe("Subscription Plan", () => {

  context("desktop", () => {

    it("can add a credit card for billing", () => {
      cy.web3Login()

      // navigate to settings
      navigationMenu.settingsNavButton().click()
      settingsPage.subscriptionTabButton().click()

      // add a card
      settingsPage.addCardButton().click()
      addCardModal.body().should("be.visible")
      // this is where we start to have problems with the iframe inputs
      cy.getWithinIframe("[data-elements-stable-field-name=cardNumber]", "#iframe-card-number iframe")
        .type(visaCardNumber)

      cy.getWithinIframe("[data-elements-stable-field-name=cardExpiry]", "#iframe-card-expiry iframe")
        .type(cardExpirationDate)

      cy.getWithinIframe("[data-elements-stable-field-name=cardCvc]", "#iframe-card-cvc iframe")
        .type(cardCvcNumber)

      addCardModal.addCardButton().safeClick()

      // ensure the modal disappeared and card shows on profile
      settingsPage.addCardButton().should("be.visible")
      // ToDo: add all the extra checks for validation
    })
  })
})
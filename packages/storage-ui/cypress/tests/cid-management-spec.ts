import { cidsPage } from "../support/page-objects/cidsPage"
import { navigationMenu } from "../support/page-objects/navigationMenu"
import { testCid } from "../fixtures/storageTestData"

describe("CID management", () => {

  context("desktop", () => {

    it("can pin a CID", () => {
      cy.web3Login({ clearPins: true })
      navigationMenu.cidsNavButton().click()

      // pin a cid and see it in the pinned items table
      cidsPage.pinButton().click()
      cidsPage.cidInput().type(testCid)
      cidsPage.pinSubmitButton().safeClick()
      cidsPage.cidItemRow().should("have.length", 1)

      // open the pin cid modal and cancel it
      cidsPage.pinButton().click()
      cidsPage.pinCancelButton().click()
      cidsPage.pinCidForm().should("not.exist")
    })

    it("can unpin a cid", () => {
      cy.web3Login({ clearPins: true })

      // pin and then unpin a CID
      cidsPage.addPinnedCid()
      cidsPage.cidRowKebabButton().click()
      cidsPage.unpinMenuOption().click()
      cidsPage.cidItemRow().should("not.exist")
    })
  })
})
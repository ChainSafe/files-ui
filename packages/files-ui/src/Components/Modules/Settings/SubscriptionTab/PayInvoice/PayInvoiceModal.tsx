import React, { useCallback, useEffect, useMemo, useState } from "react"
import { makeStyles, createStyles, useThemeSwitcher } from "@chainsafe/common-theme"
import { CSFTheme } from "../../../../../Themes/types"
import { Modal } from "@chainsafe/common-components"
import CryptoPayment from "../Common/CryptoPayment"
import { useBilling } from "../../../../../Contexts/BillingContext"
import { useFilesApi } from "../../../../../Contexts/FilesApiContext"
import ConfirmPlan from "../Common/ConfirmPlan"
import { formatSubscriptionError } from "../utils/formatSubscriptionError"
import PlanSuccess from "../Common/PlanSuccess"

const useStyles = makeStyles(({ constants, breakpoints }: CSFTheme) =>
  createStyles({
    root: {
      "&:before": {
        backgroundColor: constants.modalDefault.fadeBackground
      }
    },
    inner: {
      borderRadius: `${constants.generalUnit / 2}px`,
      [breakpoints.up("sm")]: {
        minWidth: 480
      },
      [breakpoints.down("sm")]: {
        width: "100%"
      }
    }
  })
)

type PayInvoiceModalSlides = "confirmPlan" | "planSuccess" | "cryptoPayment"

interface IChangeProductModal {
  invoiceId: string
  onClose: () => void
}

const PayInvoiceModal = ({ onClose, invoiceId }: IChangeProductModal) => {
  const classes = useStyles()
  const { desktop } = useThemeSwitcher()
  const { invoices, refreshInvoices } = useBilling()
  const { filesApiClient } = useFilesApi()
  const invoiceToPay = useMemo(() => invoices?.find(i => i.uuid === invoiceId), [invoices, invoiceId])
  const [payingInvoice, setPayingInvoice] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [slide, setSlide] = useState<PayInvoiceModalSlides | undefined>()

  const payInvoice = useCallback(() => {
    if (!invoiceToPay) return

    try {
      setPayingInvoice(true)
      setErrorMessage(undefined)
      filesApiClient.payInvoice(invoiceToPay.uuid)
        .then(() => {
          setSlide("planSuccess")
          refreshInvoices()
        })
    } catch (error: any) {
      const errorMessage = formatSubscriptionError(error)
      setErrorMessage(errorMessage)
    } finally {
      setPayingInvoice(false)
    }
  }, [filesApiClient, invoiceToPay, refreshInvoices])

  useEffect(() => {
    if (!slide) {
      setSlide(invoiceToPay?.payment_method === "crypto"
        ? "cryptoPayment"
        : "confirmPlan"
      )
    }
  }, [invoiceToPay, slide])

  if (!invoiceToPay) return null

  return (
    <Modal
      closePosition="right"
      active={true}
      maxWidth={desktop ? 800 : 480}
      width={desktop ? "max-content" : "calc(100% - 16px)"}
      className={classes.root}
      injectedClass={{
        inner: classes.inner
      }}
      testId="cryptoPayment"
      onClose={onClose}
    >
      {slide === "cryptoPayment" && <CryptoPayment
        onClose={onClose}
        onSuccess={() => setSlide("planSuccess")}
      />}
      {slide === "confirmPlan" && <ConfirmPlan
        plan={{ ...invoiceToPay.product, prices: [invoiceToPay.product.price] }}
        planPrice={invoiceToPay.product.price}
        onChangeSubscription={payInvoice}
        loadingChangeSubscription={payingInvoice}
        subscriptionErrorMessage={errorMessage}
        paymentMethod={invoiceToPay.payment_method === "stripe" ? "creditCard" : "crypto"}
      />}
      {slide === "planSuccess" && <PlanSuccess
        plan={{ ...invoiceToPay.product, prices: [invoiceToPay.product.price] }}
        planPrice={invoiceToPay.product.price}
        onClose={onClose}
        paymentMethod={invoiceToPay.payment_method === "stripe" ? "creditCard" : "crypto"}/>
      }
    </Modal>
  )
}

export default PayInvoiceModal
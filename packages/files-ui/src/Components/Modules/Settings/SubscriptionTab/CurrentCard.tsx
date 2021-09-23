import React, { useState } from "react"
import { Typography, CreditCardIcon, Button } from "@chainsafe/common-components"
import { makeStyles, ITheme, createStyles } from "@chainsafe/common-theme"
import { Trans } from "@lingui/macro"
import { useBilling } from "../../../../Contexts/BillingContext"
import AddCardModal from "./NewAddCardModal"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"

const useStyles = makeStyles(({ constants, palette }: ITheme) =>
  createStyles({
    container: {
      margin: `${constants.generalUnit * 3}px ${constants.generalUnit * 4}px`
    },
    noCard: {
      margin: `${constants.generalUnit * 2}px 0`
    },
    cardDetailsContainer: {
      display: "flex",
      margin: `${constants.generalUnit * 2}px 0`
    },
    creditCardIcon: {
      marginRight: constants.generalUnit,
      fill: palette.additional["gray"][9]
    }
  })
)

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PK || "")

const CurrentCard: React.FC = () => {
  const classes = useStyles()
  const [isAddCardModalOpen, setIsAddCardModalOpen ] = useState(false)
  const { defaultCard } = useBilling()

  return (
    <>
      <div className={classes.container}>
        <div>
          <Typography
            variant="h4"
            component="h4"
          >
            <Trans>Credit card on file</Trans>
          </Typography>
        </div>
        {defaultCard
          ? <div className={classes.cardDetailsContainer}>
            <CreditCardIcon className={classes.creditCardIcon} />
            <Typography>
           •••• •••• •••• {defaultCard.last_four_digit}
            </Typography>
          </div>
          : <Typography
            component="p"
            variant="body1"
            className={classes.noCard}
          >
            <Trans>No Card</Trans>
          </Typography>
        }
        <Button onClick={() => setIsAddCardModalOpen(true)}>
          {defaultCard
            ? <Trans>Update Card</Trans>
            : <Trans>Add Card</Trans>
          }
        </Button>
      </div>
      <Elements stripe={stripePromise}>
        <AddCardModal
          isModalOpen={isAddCardModalOpen}
          onClose={() => setIsAddCardModalOpen(false)}
        />
      </Elements>
    </>
  )
}

export default CurrentCard

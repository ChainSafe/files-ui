import { Button, Grid, TextInput, Typography, useToasts } from "@chainsafe/common-components"
import { createStyles, makeStyles } from "@chainsafe/common-theme"
import React, { useState, useCallback } from "react"
import { CSFTheme } from "../../../../Themes/types"
import CustomModal from "../../../Elements/CustomModal"
import CustomButton from "../../../Elements/CustomButton"
import { t, Trans } from "@lingui/macro"
import CardInputs from "../../../Elements/CardInputs"
import { getCardNumberError, getCVCError, getExpiryDateError } from "../../../Elements/CardInputs/utils/validator"
import { useBilling } from "../../../../Contexts/BillingContext"

const useStyles = makeStyles(
  ({ breakpoints, constants, typography, zIndex }: CSFTheme) => {
    return createStyles({
      root: {
        padding: constants.generalUnit * 4,
        flexDirection: "column"
      },
      modalRoot: {
        zIndex: zIndex?.blocker,
        [breakpoints.down("md")]: {}
      },
      modalInner: {
        backgroundColor: constants.createFolder.backgroundColor,
        color: constants.createFolder.color,
        [breakpoints.down("md")]: {
          bottom:
          Number(constants?.mobileButtonHeight) + constants.generalUnit,
          borderTopLeftRadius: `${constants.generalUnit * 1.5}px`,
          borderTopRightRadius: `${constants.generalUnit * 1.5}px`,
          maxWidth: `${breakpoints.width("md")}px !important`
        }
      },
      okButton: {
        marginLeft: constants.generalUnit
      },
      cancelButton: {
        [breakpoints.down("md")]: {
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          height: constants?.mobileButtonHeight
        }
      },
      label: {
        fontSize: 14,
        lineHeight: "22px"
      },
      heading: {
        color: constants.createFolder.color,
        fontWeight: typography.fontWeight.semibold,
        textAlign: "left",
        marginBottom: constants.generalUnit * 2
      },
      footer: {
        marginTop: constants.generalUnit * 4
      }
    })
  }
)

interface ICreateFolderModalProps {
  isModalOpen: boolean
  onClose: () => void
}

const CreateFolderModal = ({ isModalOpen, onClose }: ICreateFolderModalProps) => {
  const classes = useStyles()
  const [cardInputs, setCardInputs] = useState({
    cardNumber: "",
    cardExpiry: "",
    cardCvc: ""
  })
  const [cardName, setCardName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { addCard, getCardTokenFromStripe } = useBilling()
  const { addToast } = useToasts()

  const onCloseModal = useCallback(() => {
    setCardInputs({ cardNumber: "", cardExpiry: "", cardCvc: "" })
    setCardName("")
    setError("")
    onClose()
  }, [onClose])

  const onSubmitCard = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const error = !cardName
      ? t`Name on card is required`
      : getCardNumberError(cardInputs.cardNumber) ||
      getExpiryDateError(cardInputs.cardExpiry) ||
      getCVCError(cardInputs.cardCvc, cardInputs.cardNumber)

    if (error) {
      setError(error)
      return
    }
    setError("")

    setLoading(true)
    // get token from stripe
    getCardTokenFromStripe(cardInputs).then((resp) => {
      // send stripe token to API
      addCard(resp.data.id)
        .then(() => {
          onCloseModal()
          addToast({
            title: t`Card added successfully`,
            type: "success"
          })
        }).catch((e) => {
          setError(t`Something went wrong, please try again`)
          console.error(e)
        }).finally(() => setLoading(false))
    }).catch((err) => {
      console.error(err)
      setError(t`Card details could not be validated`)
      setLoading(false)
    })
  }, [cardName, cardInputs, getCardTokenFromStripe, addCard, onCloseModal, addToast])

  return (
    <CustomModal
      className={classes.modalRoot}
      injectedClass={{
        inner: classes.modalInner
      }}
      active={isModalOpen}
      closePosition="none"
      maxWidth="sm"
    >
      <form onSubmit={onSubmitCard}>
        <div
          className={classes.root}
          data-cy="modal-create-folder"
        >
          <Grid
            item
            xs={12}
            sm={12}
          >
            <Typography
              className={classes.heading}
              variant="h4"
              component="h4"
            >
              <Trans>Add a credit card</Trans>
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={12}
          >
            <TextInput
              value={cardName}
              onChange={(val) =>
                setCardName(val?.toString() || "")
              }
              size="large"
              placeholder={t`Name on card`}
              label={t`Name on card`}
            />
            <CardInputs
              cardNumber={cardInputs.cardNumber}
              cardExpiry={cardInputs.cardExpiry}
              cardCvc={cardInputs.cardCvc}
              handleChangeCardNumber={(value) => setCardInputs({ ...cardInputs, cardNumber: value })}
              handleChangeCardExpiry={(value) => setCardInputs({ ...cardInputs, cardExpiry: value })}
              handleChangeCardCvc={(value) => setCardInputs({ ...cardInputs, cardCvc: value })}
              error={error}
            />
          </Grid>
          <Grid
            item
            flexDirection="row"
            justifyContent="flex-end"
            className={classes.footer}
          >
            <CustomButton
              data-cy="button-cancel-create-folder"
              onClick={onCloseModal}
              size="medium"
              className={classes.cancelButton}
              variant="outline"
              type="button"
              disabled={loading}
            >
              <Trans>Cancel</Trans>
            </CustomButton>
            <Button
              data-cy="button-create-folder"
              size="medium"
              variant="primary"
              type="submit"
              className={classes.okButton}
              loading={loading}
              disabled={loading}
            >
              <Trans>Add card</Trans>
            </Button>
          </Grid>
        </div>
      </form>
    </CustomModal>
  )
}

export default CreateFolderModal

import React, { useCallback, useRef, useState } from "react"
import { makeStyles, createStyles } from "@chainsafe/common-theme"
import { Button, FormikTextInput, Grid } from "@chainsafe/common-components"
import CustomModal from "../Elements/CustomModal"
import { CSSTheme } from "../../Themes/types"
import CustomButton from "../Elements/CustomButton"
import { t, Trans } from "@lingui/macro"
import { Formik, Form } from "formik"
import { useStorage } from "../../Contexts/StorageContext"
import { cidValidator } from "../../Utils/validationSchema"

const useStyles = makeStyles(({ constants, breakpoints, zIndex }: CSSTheme) =>
  createStyles({
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
    input: {
      marginBottom: constants.generalUnit * 2
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
      marginBottom: constants.generalUnit
    }
  })
)

interface IAddCIDModuleProps {
  modalOpen: boolean
  close: () => void
}

const AddCIDModal = ({ modalOpen = false, close }: IAddCIDModuleProps) => {
  const classes = useStyles()
  const { addPin } = useStorage()
  const inputRef = useRef<any>(null)
  const [accessingCID, setAccessingCID] = useState(false)

  const onSubmit = useCallback((values, helpers) => {
    helpers.setSubmitting(true)
    setAccessingCID(true)
    addPin(values.cid.trim())
      .then(() => {
        helpers.resetForm()
        close()
      })
      .catch((e) => {
        helpers.setFieldError("cid", e.message)
        console.error(e)
      })
      .finally(() => {
        // refreshPins()
        setAccessingCID(false)
        helpers.setSubmitting(false)
      })
  }, [addPin, close])

  return (
    <CustomModal
      className={classes.modalRoot}
      injectedClass={{
        inner: classes.modalInner
      }}
      active={modalOpen}
      closePosition="none"
      maxWidth="sm"
    >
      <Formik
        initialValues={{
          cid: ""
        }}
        validationSchema={cidValidator}
        validateOnChange={false}
        onSubmit={onSubmit}
      >
        <Form>
          <div
            className={classes.root}
            data-cy="form-pin-cid"
          >
            <Grid
              item
              xs={12}
              sm={12}
              className={classes.input}
            >
              <FormikTextInput
                name="cid"
                size="large"
                placeholder="QmNbbf...dps2Xw"
                labelClassName={classes.label}
                label={t`Paste the CID to pin it with ChainSafe Storage`}
                ref={inputRef}
                data-cy="input-cid"
              />
            </Grid>
            <Grid
              item
              flexDirection="row"
              justifyContent="flex-end"
            >
              <CustomButton
                onClick={() => close()}
                size="medium"
                className={classes.cancelButton}
                variant={"outline"}
                type="button"
                data-cy="button-cancel-add-pin"
              >
                <Trans>Cancel</Trans>
              </CustomButton>
              <Button
                size={"medium"}
                variant="primary"
                type="submit"
                className={classes.okButton}
                loading={accessingCID}
                data-cy="button-submit-pin"
              >
                <Trans>Pin</Trans>
              </Button>
            </Grid>
          </div>
        </Form>
      </Formik>
    </CustomModal>
  )
}

export default AddCIDModal

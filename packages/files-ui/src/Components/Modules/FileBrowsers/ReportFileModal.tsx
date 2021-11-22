import {
  createStyles,
  debounce,
  makeStyles
} from "@chainsafe/common-theme"
import React, { useState, useEffect } from "react"
import CustomModal from "../../Elements/CustomModal"
import CustomButton from "../../Elements/CustomButton"
import { Trans } from "@lingui/macro"
import {
  Button,
  Grid,
  Loading,
  Typography
} from "@chainsafe/common-components"
import clsx from "clsx"
import { CSFTheme } from "../../../Themes/types"
import { useFileBrowser } from "../../../Contexts/FileBrowserContext"
import { useThresholdKey } from "../../../Contexts/ThresholdKeyContext"
import { useCallback } from "react"
import { ROUTE_LINKS } from "../../FilesRoutes"
import { useFilesApi } from "../../../Contexts/FilesApiContext"

const useStyles = makeStyles(
  ({ breakpoints, constants, palette, typography, zIndex, animation }: CSFTheme) => {
    return createStyles({
      modalRoot: {
        zIndex: zIndex?.blocker,
        [breakpoints.down("md")]: {
          paddingBottom: Number(constants?.mobileButtonHeight) + constants.generalUnit
        }
      },
      modalInner: {
        backgroundColor: constants.fileInfoModal.background,
        color: constants.fileInfoModal.color,
        [breakpoints.down("md")]: {
          bottom:
            Number(constants?.mobileButtonHeight) + constants.generalUnit,
          borderTopLeftRadius: `${constants.generalUnit * 1.5}px`,
          borderTopRightRadius: `${constants.generalUnit * 1.5}px`,
          maxWidth: `${breakpoints.width("md")}px !important`
        }
      },
      closeButton: {
        flex: 1,
        marginLeft: constants.generalUnit * 2,
        [breakpoints.down("md")]: {
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          height: constants?.mobileButtonHeight,
          margin: 0
        }
      },
      title: {
        fontWeight: typography.fontWeight.semibold,
        textAlign: "left",
        [breakpoints.down("md")]: {
          textAlign: "center"
        }
      },
      infoContainer: {
        borderTop: constants.fileInfoModal.infoContainerBorderTop,
        padding: `${constants.generalUnit * 2}px ${
          constants.generalUnit * 3
        }px`
      },
      infoBox: {
        paddingLeft: constants.generalUnit
      },
      subInfoBox: {
        padding: `${constants.generalUnit * 1}px 0`
      },
      subSubtitle: {
        color: palette.additional["gray"][8]
      },
      paddedContainer: {
        padding: `${constants.generalUnit * 2}px ${
          constants.generalUnit * 4
        }px`,
        borderBottom: `1px solid ${palette.additional["gray"][3]}`
      },
      loadingContainer: {
        margin: constants.generalUnit * 2
      },
      buttonsContainer: {
        display: "flex",
        padding: `0 ${constants.generalUnit * 4}px ${constants.generalUnit * 4}px`
      },
      copiedFlag: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        left: "50%",
        bottom: "calc(100% + 5px)",
        position: "absolute",
        transform: "translate(-50%, 0%)",
        zIndex: zIndex?.layer1,
        transitionDuration: `${animation.transform}ms`,
        opacity: 0,
        visibility: "hidden",
        backgroundColor: palette.additional["gray"][9],
        color: palette.additional["gray"][1],
        padding: `${constants.generalUnit / 2}px ${constants.generalUnit}px`,
        borderRadius: 2,
        "&:after": {
          transitionDuration: `${animation.transform}ms`,
          content: "''",
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translate(-50%,0)",
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `5px solid ${ palette.additional["gray"][9]}`
        },
        "&.active": {
          opacity: 1,
          visibility: "visible"
        }
      },
      copyButton: {
        width: "100%"
      },
      copyContainer: {
        position: "relative",
        flexBasis: "75%",
        color: palette.additional["gray"][9],
        [breakpoints.down("md")]: {
          flexBasis: "100%",
          margin: constants.generalUnit * 2
        }
      },
      decryptionKey: {
        width: "100%",
        wordBreak: "break-all"
      },
      infoText: {
        marginBottom: constants.generalUnit * 2
      },
      keysWrapper: {
        maxHeight: constants.generalUnit * 10,
        overflow: "scroll"
      }
    })
  }
)

interface IReportFileModalProps {
  filePath: string
  close: () => void
}

interface KeyMap {
  pubKey: string
  encryptedDecryptionKey: string
}

const ReportFileModal = ({ filePath, close }: IReportFileModalProps) => {
  const classes = useStyles()
  const { bucket } = useFileBrowser()
  const { encryptionKey, id } = bucket || {}
  const [isLoadingAdminKey, setIsloadingAdminKey] = useState(true)
  const [adminPubKeys, setAdminPubkeys] = useState<string[]>([])
  const [encryptedDecryptionKeyMap, setEncryptedDecryptionKeyMap] = useState<KeyMap[]>([])
  const { encryptForPublicKey } = useThresholdKey()
  const [copied, setCopied] = useState(false)
  const { filesApiClient } = useFilesApi()

  useEffect(() => {
    filesApiClient.abuseUser()
      .then((keys) => {
        if (!keys.length){
          console.error("No admin public key received")
        }

        setAdminPubkeys(keys)
      })
      .catch(console.error)
  }, [filesApiClient])

  useEffect(() => {
    if(!adminPubKeys.length || !encryptionKey) return

    Promise.all(adminPubKeys.map((adminPubKey) =>
      // we need to remove the 0x
      encryptForPublicKey(adminPubKey.slice(2), encryptionKey)
    ))
      .then((encryptedDecryptionKeys) => {
        const map = adminPubKeys.map((adminPubKey, index) => ({
          "pubKey": adminPubKey,
          "encryptedDecryptionKey": encryptedDecryptionKeys[index]
        }))

        setEncryptedDecryptionKeyMap(map)
      })
      .catch(console.error)
      .finally(() => setIsloadingAdminKey(false))

  }, [adminPubKeys, encryptForPublicKey, encryptionKey])

  const debouncedSwitchCopied = debounce(() => setCopied(false), 3000)

  const onCopyInfo = useCallback(() => {
    navigator.clipboard.writeText(`{
  bucketId: "${id}",
  path: "${filePath}",
  encryptedDecryptionKey: ${JSON.stringify(encryptedDecryptionKeyMap)}
}`)
      .then(() => {
        setCopied(true)
        debouncedSwitchCopied()
      })
      .catch(console.error)
  }, [debouncedSwitchCopied, encryptedDecryptionKeyMap, filePath, id])

  return (
    <CustomModal
      className={classes.modalRoot}
      injectedClass={{
        inner: classes.modalInner
      }}
      active={true}
      closePosition="none"
      maxWidth="sm"
    >
      <Grid
        item
        xs={12}
        sm={12}
        className={classes.paddedContainer}
      >
        <Typography
          className={classes.title}
          variant="h5"
          component="h5"
        >
          <Trans>Report a File</Trans>
        </Typography>
      </Grid>
      { isLoadingAdminKey && (
        <Grid
          item
          flexDirection="row"
          justifyContent="center"
        >
          <div className={classes.loadingContainer}>
            <Loading
              size={32}
              type="initial"
            />
          </div>
        </Grid>
      )}
      <>
        <Grid
          item
          xs={12}
          sm={12}
          className={classes.infoContainer}
        >
          {!isLoadingAdminKey && (
            <div className={classes.infoBox}>
              <div>
                <Typography
                  className={classes.infoText}
                  variant="body1"
                  component="p"
                >
                  <Trans>
                    If you think this file does not comply with our <a
                      href={ROUTE_LINKS.Terms}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Trans>Terms of Service</Trans>
                    </a>, please send the following information to report@files.chainsafe.io.
                    Beware that by sending the file&apos;s decryption key, an admin can then decrypt
                    any file in this shared folder.
                  </Trans>
                </Typography>
                <div className={classes.subInfoBox}>
                  <Typography
                    variant="body1"
                    component="p"
                  >
                    <Trans>Bucket id</Trans>
                  </Typography>
                  <Typography
                    className={classes.subSubtitle}
                    variant="body2"
                    component="p"
                  >
                    {id}
                  </Typography>
                </div>
                <div className={classes.subInfoBox}>
                  <Typography
                    variant="body1"
                    component="p"
                  >
                    <Trans>File path</Trans>
                  </Typography>
                  <Typography
                    className={classes.subSubtitle}
                    variant="body2"
                    component="p"
                  >
                    {filePath}
                  </Typography>
                </div>
                <div className={classes.subInfoBox}>
                  <Typography
                    variant="body1"
                    component="p"
                  >
                    <Trans>Decryption key</Trans>
                  </Typography>
                  <div className={classes.keysWrapper}>
                    <Typography
                      className={clsx(classes.decryptionKey, classes.subSubtitle)}
                      variant="body2"
                      component="p"
                    >
                      {JSON.stringify(encryptedDecryptionKeyMap)}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Grid>
        <Grid
          item
          flexDirection="row"
          className={classes.buttonsContainer}
        >
          <div className={classes.copyContainer}>
            <Button
              type="submit"
              size="large"
              variant="primary"
              className={classes.copyButton}
              onClick={onCopyInfo}
              disabled={isLoadingAdminKey}
            >
              <Trans>Copy info</Trans>
            </Button>
            <div className={clsx(classes.copiedFlag, { "active": copied })}>
              <span>
                <Trans>
                      Copied!
                </Trans>
              </span>
            </div>
          </div>
          <CustomButton
            onClick={() => close()}
            size="large"
            className={classes.closeButton}
            variant="outline"
            type="button"
          >
            <Trans>Close</Trans>
          </CustomButton>
        </Grid>
      </>
    </CustomModal>
  )
}

export default ReportFileModal

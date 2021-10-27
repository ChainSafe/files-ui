import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, CheckCircleIcon, Loading, Typography, useHistory, useLocation } from "@chainsafe/common-components"
import { getBucketDecryptionFromHash, getJWT } from "../../Utils/pathUtils"
import { useFilesApi } from "../../Contexts/FilesApiContext"
import { useThresholdKey } from "../../Contexts/ThresholdKeyContext"
import { Trans } from "@lingui/macro"
import { useFiles } from "../../Contexts/FilesContext"
import jwtDecode from "jwt-decode"
import { createStyles, makeStyles } from "@chainsafe/common-theme"
import { CSFTheme } from "../../Themes/types"
import { ROUTE_LINKS } from "../FilesRoutes"
import { translatedPermission } from "./FileBrowsers/LinkSharing/LinkList"
import { NonceResponsePermission } from "@chainsafe/files-api-client"

const useStyles = makeStyles(
  ({ constants, palette, breakpoints }: CSFTheme) =>
    createStyles({
      root:{
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      },
      box: {
        backgroundColor: constants.loginModule.background,
        border: `1px solid ${constants.landing.border}`,
        boxShadow: constants.landing.boxShadow,
        borderRadius: 6,
        maxWidth: constants.generalUnit * 70,
        padding: constants.generalUnit * 5,
        [breakpoints.down("md")]: {
          justifyContent: "center",
          width: "100%"
        }
      },
      icon : {
        display: "flex",
        alignItems: "center",
        fontSize: constants.generalUnit * 6,
        "& svg": {
          marginRight: constants.generalUnit,
          fill: palette.additional["gray"][7]
        }
      },
      error: {
        color: palette.error.main
      },
      messageWrapper: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      },
      browseButton : {
        marginTop: constants.generalUnit * 2
      }
    })
)

interface DecodedJwt {
  bucket_id?: string
  permission?: NonceResponsePermission
}
const LinkSharingModule = () => {
  const { pathname, hash } = useLocation()
  const { redirect } = useHistory()
  const jwt = useMemo(() => getJWT(pathname), [pathname])
  const bucketDecryptionKey = useMemo(() => getBucketDecryptionFromHash(hash), [hash])
  const { filesApiClient } = useFilesApi()
  const { refreshBuckets, buckets } = useFiles()
  const { publicKey, encryptForPublicKey } = useThresholdKey()
  const [encryptedEncryptionKey, setEncryptedEncryptionKey] = useState("")
  const [error, setError] = useState("")
  const classes = useStyles()
  const { bucket_id: bucketId, permission } = useMemo(() => {
    try {
      return (jwt && jwtDecode<DecodedJwt>(jwt)) || {}
    }catch (e) {
      console.error(e)
      return {}
    }
  }, [jwt])
  const newBucket = useMemo(() => buckets.find((b) => b.id === bucketId), [bucketId, buckets])

  useEffect(() => {
    if(!publicKey || !bucketDecryptionKey) return

    encryptForPublicKey(publicKey, bucketDecryptionKey)
      .then(setEncryptedEncryptionKey)
      .catch(console.error)

  }, [bucketDecryptionKey, encryptForPublicKey, publicKey])

  useEffect(() => {
    if(!jwt || !encryptedEncryptionKey || !!newBucket) return

    filesApiClient.verifyNonce({ jwt, encryption_key: encryptedEncryptionKey })
      .catch((e:any) => {
        console.error(e)
        setError(e.error.message)
      })
      .finally(() => {
        refreshBuckets()
      })
  }, [encryptedEncryptionKey, error, filesApiClient, jwt, newBucket, refreshBuckets])

  const onBrowseBucket = useCallback(() => {
    newBucket && redirect(ROUTE_LINKS.SharedFolderExplorer(newBucket.id, "/"))
  }, [newBucket, redirect])

  return (
    <div className={classes.root}>
      <div className={classes.box}>
        <div className={classes.messageWrapper}>
          {!error && !newBucket && (
            <>
              <Loading
                type="inherit"
                size={48}
                className={classes.icon}
              />
              <Typography variant={"h4"} >
                <Trans>Adding you to the shared folder...</Trans>
              </Typography>
            </>
          )}
          {!error && newBucket && permission && (
            <>
              <CheckCircleIcon
                size={48}
                className={classes.icon}
              />
              <Typography variant={"h4"} >
                <Trans>
                  You were added to the shared folder ({translatedPermission(permission)}): {newBucket.name}
                </Trans>
              </Typography>
              <Button
                className={classes.browseButton}
                onClick={onBrowseBucket}
              >
                <Trans>Browse {newBucket.name}</Trans>
              </Button>
            </>
          )}
        </div>
        {!!error && (
          <Typography
            variant="body2"
            className={classes.error}
          >
            {error}
          </Typography>
        )}
      </div>
    </div>
  )
}

export default LinkSharingModule
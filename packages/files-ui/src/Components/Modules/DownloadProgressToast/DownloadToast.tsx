import React from "react"
import { createStyles, ITheme, makeStyles } from "@chainsafe/common-theme"
import { DownloadProgress } from "../../../Contexts/FilesContext"
import { ProgressBar, Typography, CheckCircleIcon, CloseCircleIcon } from "@chainsafe/common-components"
import clsx from "clsx"
import { Trans } from "@lingui/macro"

const useStyles = makeStyles(
  ({ constants, palette, animation, breakpoints }: ITheme) => {
    return createStyles({
      boxContainer: {
        backgroundColor: palette.additional["gray"][3],
        margin: `${constants.generalUnit}px 0`,
        border: `1px solid ${palette.additional["gray"][6]}`,
        padding: constants.generalUnit * 2,
        borderRadius: 4
      },
      appearBox: {
        animation: `$slideLeft ${animation.translate}ms`,
        [breakpoints.down("md")]: {
          animation: `$slideUp ${animation.translate}ms`
        }
      },
      "@keyframes slideLeft": {
        from: { transform: "translate(100%)" },
        to: { transform: "translate(0)" }
      },
      "@keyframes slideUp": {
        from: { transform: "translate(0, 100%)" },
        to: { transform: "translate(0, 0)" }
      },
      contentContainer: {
        display: "flex",
        alignItems: "center"
      },
      marginBottom: {
        marginBottom: constants.generalUnit
      },
      marginRight: {
        marginRight: constants.generalUnit * 2
      }
    })
  }
)

interface IDownloadToast {
  downloadInProgress: DownloadProgress
}

const DownloadToast: React.FC<IDownloadToast> = ({ downloadInProgress }) => {
  const { fileName, complete, error, progress, errorMessage, currentFileNumber, totalFileNumber } = downloadInProgress
  const classes = useStyles()
  const fileProgress = totalFileNumber > 1 && `${currentFileNumber}/${totalFileNumber}`

  return (
    <>
      <div className={clsx(classes.appearBox, classes.boxContainer)}>
        {!!complete && !error && (
          <div className={classes.contentContainer}>
            <CheckCircleIcon className={classes.marginRight} />
            <Typography
              variant="body1"
              component="p"
            >
              <Trans>Download complete</Trans>
            </Typography>
          </div>
        )}
        {error && (
          <div className={classes.contentContainer}>
            <CloseCircleIcon className={classes.marginRight} />
            <Typography
              variant="body1"
              component="p"
            >
              {errorMessage}
            </Typography>
          </div>
        )}
        {!complete && !error && (
          <div>
            <Typography
              variant="body2"
              component="p"
              className={classes.marginBottom}
            >
              <Trans>Downloading</Trans> {fileProgress} - {fileName}
            </Typography>
            <ProgressBar
              progress={progress}
              size="small"
            />
          </div>
        )}
      </div>
    </>
  )
}

export default DownloadToast

import React from "react"
import {
  makeStyles,
  createStyles,
  useThemeSwitcher
} from "@chainsafe/common-theme"
import { useThresholdKey } from "../../Contexts/ThresholdKeyContext"
import InitializeAccount from "../Modules/LoginModule/InitializeAccount"
import SaveNewDevice from "../Modules/LoginModule/SaveNewDevice"
import MissingShares from "../Modules/LoginModule/MissingShares"
import { CSFTheme } from "../../Themes/types"
import MigrateAccount from "../Modules/LoginModule/MigrateAccount"
import InitialScreen from "../Modules/LoginModule/InitialScreen"
import { ChainsafeFilesLogo, Typography } from "@chainsafe/common-components"
import { ROUTE_LINKS } from "../FilesRoutes"
import { Trans } from "@lingui/macro"
import BottomDarkSVG from "../../Media/landing/layers/dark/Bottom.dark.svg"
import TopDarkSVG from "../../Media/landing/layers/dark/Top.dark.svg"
import BottomLightSVG from "../../Media/landing/layers/light/Bottom.light.svg"
import TopLightSVG from "../../Media/landing/layers/light/Top.light.svg"
import { ForegroundSVG } from "../../Media/landing/layers/ForegroundSVG"
import { useImployApi } from "@chainsafe/common-contexts"

const useStyles = makeStyles(
  ({ constants, breakpoints, typography, zIndex }: CSFTheme) =>
    createStyles({
      root: {
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden"
      },
      bgBottom: {
        position: "absolute",
        left: "50%",
        transform: "translate(-50%, 0%)",
        zIndex: zIndex?.background,
        [breakpoints.up("md")]: {
          bottom: constants.generalUnit * 4,
          maxHeight: `calc(80vh - ${constants.generalUnit * 4}px)`
        },
        [breakpoints.down("md")]: {
          bottom: constants.generalUnit * 5,
          width: "80vw"
        }
      },
      bgTop: {
        position: "absolute",
        top: constants.generalUnit * 10,
        zIndex: zIndex?.background,
        [breakpoints.up("md")]: {
          left: "calc(50% + 15vw)",
          transform: "translate(-50%, 0%)",
          width: "30vw"
        },
        [breakpoints.down("md")]: {
          width: "50vw",
          right: constants.generalUnit * 2
        }
      },
      bgForeground: {
        position: "absolute",
        left: "50%",
        top: "calc(50% + 3vh)",
        transform: "translate(-50%, -50%)",
        zIndex: zIndex?.layer0,
        [breakpoints.up("md")]: {
          minHeight: "85vh",
          maxHeight: "90vh"
        },
        [breakpoints.down("md")]: {
          width: "120vw"
        }
      },
      title: {
        position: "absolute",
        top: constants.generalUnit * 5.25,
        left: "50%",
        transform: "translate(-50%, 0)",
        fontWeight: typography.fontWeight.regular,
        textAlign: "center",
        width: "100%",
        [breakpoints.up("md")]:{
          ...typography.h2
        },
        [breakpoints.down("md")]:{
          ...typography.h4
        }
      },
      cta: {
        position: "absolute",
        bottom: 0,
        right: 0,
        padding: `${constants.generalUnit * 2.5}px ${constants.generalUnit * 1.5}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textDecoration: "none",
        "& *:first-child": {
          marginBottom: constants.generalUnit
        },
        [breakpoints.down("md")]: {
          display: "none"
        }
      },
      inner: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: "1 1 0",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: zIndex?.layer1,
        backgroundColor: constants.landing.background,
        border: `1px solid ${constants.landing.border}`,
        boxShadow: constants.landing.boxShadow,
        borderRadius: 6,
        [breakpoints.up("md")]:{
          minHeight: "64vh",
          justifyContent: "space-between",
          width: 440
        },
        [breakpoints.down("md")]: {
          padding: `${constants.generalUnit * 4}px ${constants.generalUnit * 2}px`,
          justifyContent: "center",
          width: `calc(100vw - ${constants.generalUnit * 2}px)`
        }
      }
    })
)

const Content = () => {
  const { isMasterPasswordSet } = useImployApi()
  const { keyDetails, isNewDevice, shouldInitializeAccount } = useThresholdKey()
  const shouldSaveNewDevice = !!keyDetails && isNewDevice && keyDetails.requiredShares <= 0
  const areSharesMissing = !!keyDetails && keyDetails.requiredShares > 0

  if (!keyDetails) {
    return <InitialScreen />
  }

  if (areSharesMissing) {
    return <MissingShares />
  }

  if (shouldInitializeAccount){
    return (
      isMasterPasswordSet
        ? <MigrateAccount />
        : <InitializeAccount />
    )
  }

  if (shouldSaveNewDevice) {
    return <SaveNewDevice />
  }

  return null
}

const LoginPage = () => {
  const classes = useStyles()
  const { themeKey } = useThemeSwitcher()

  return (
    <div className={classes.root}>
      <Typography className={classes.title}>
        ChainSafe Files
      </Typography>
      <>
      </>
      {
        themeKey === "dark" ? 
          <>
            <BottomDarkSVG className={classes.bgBottom} />
            <TopDarkSVG className={classes.bgTop} />
          </>
          :
          <>
            <BottomLightSVG className={classes.bgBottom} />
            <TopLightSVG className={classes.bgTop} />
          </>
          
      }
      <ForegroundSVG className={classes.bgForeground} />
      <a
        className={classes.cta}
        href={ROUTE_LINKS.ChainSafe}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ChainsafeFilesLogo />
        <Typography>
          <Trans>
            Learn more about ChainSafe
          </Trans>
        </Typography>
      </a>
      <div className={classes.inner}>
        <Content />
      </div>
    </div>
  )
}

export default LoginPage

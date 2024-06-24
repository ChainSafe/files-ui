import { Typography, Button } from "@chainsafe/common-components"
import { createStyles, makeStyles, useThemeSwitcher } from "@chainsafe/common-theme"
import { Trans } from "@lingui/macro"
import React from "react"
import { CSSTheme } from "../../Themes/types"
import { ROUTE_LINKS } from "../StorageRoutes"

const useStyles = makeStyles(
  ({ breakpoints, constants, palette }: CSSTheme) => {
    return createStyles({
      accountRestrictedNotification: {
        position: "fixed",
        bottom: 0,
        backgroundColor: palette.additional["gray"][10],
        color: palette.additional["gray"][1],
        padding: `${constants.generalUnit * 2}px ${constants.generalUnit * 3}px`,
        left: 0,
        width: "100vw",
        [breakpoints.up("md")]: {
          left: `${constants.navWidth}px`,
          width:`calc(100vw - ${constants.navWidth}px)`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }
      }
    })
  }
)

const BlacklistedModeBanner = () => {
  const classes = useStyles()
  const { desktop } = useThemeSwitcher()

  return (
    <div className={classes.accountRestrictedNotification}>
      <Typography variant={desktop ? "body1" : "body2"}>
        <Trans>Your account has been blacklisted due to unusual activity</Trans>
      </Typography>
      <Button
        onClick={() => window.open(ROUTE_LINKS.DiscordInvite, "_blank")}
        fullsize={!desktop}>
        <Trans>Discord support</Trans>
      </Button>
    </div>)
}

export default BlacklistedModeBanner
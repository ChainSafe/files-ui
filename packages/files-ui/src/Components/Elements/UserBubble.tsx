import React, { useState } from "react"
import { makeStyles, createStyles } from "@chainsafe/common-theme"
import { CSFTheme } from "../../Themes/types"
import { Typography, UserIcon } from "@chainsafe/common-components"
import clsx from "clsx"
import { useCallback } from "react"

const useStyles = makeStyles(({ zIndex, animation, constants, palette }: CSFTheme) => {
  return createStyles({
    bubble: {
      position: "relative",
      borderRadius: "50%",
      backgroundColor: palette.additional["gray"][6],
      color: palette.common.white.main,
      width: constants.generalUnit * 5,
      height: constants.generalUnit * 5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      "& svg": {
        fill: palette.common.white.main
      }
    },
    text : {
      textAlign: "center"
    },
    tooltip: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      bottom: constants.generalUnit * 5 + 5, //bubble height + the 5 from the triangle in &:after
      position: "absolute",
      zIndex: zIndex?.layer1,
      transitionDuration: `${animation.transform}ms`,
      opacity: 0,
      visibility: "hidden",
      backgroundColor: constants.loginModule.flagBg,
      color: constants.loginModule.flagText,
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
        borderTop: `5px solid ${constants.loginModule.flagBg}`
      },
      "&.active": {
        opacity: 1,
        visibility: "visible"
      }
    }
  })
})

interface Props {
  text?: string
  tooltip: string | string[]
  className?: string
}

const UserBubble = ({ text, tooltip, className }: Props) => {
  const classes = useStyles()
  const [showTooltip, setShowTooltip] = useState(false)

  const toggleTooltip = useCallback(() => {
    setShowTooltip(!showTooltip)
  }, [showTooltip])

  return (
    <div
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={clsx(classes.bubble, className)}
      onClick={toggleTooltip}
    >
      <div className={clsx(classes.tooltip, { "active": showTooltip })}>
        {
          Array.isArray(tooltip)
            ? tooltip.map((user) => <div key={user}>{user}</div>)
            : tooltip
        }
      </div>
      {text
        ? <Typography
          variant="h4"
          className={classes.text}
        >
          {text}
        </Typography>
        : <UserIcon/>
      }
    </div>
  )
}


export default UserBubble
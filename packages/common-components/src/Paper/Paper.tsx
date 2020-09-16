import React, { ReactNode } from "react"
import { makeStyles, createStyles } from "@chainsafe/common-themes"
import clsx from "clsx"
import { ITheme } from "@chainsafe/common-themes"

const useStyles = makeStyles((theme: ITheme) => {
  const shadowStyles = {}
  Object.keys(theme.shadows).forEach((shadow) => {
    shadowStyles[`shadow-${shadow}`] = {
      boxShadow: theme.shadows[shadow],
    }
  })

  return createStyles({
    root: {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      width: "max-content",
      padding: `${theme.constants.generalUnit}px`,
    },
    fullWidth: {
      width: "inherit",
    },
    rounded: {
      borderRadius: 4,
    },
    bordered: {
      border: `1px solid ${theme.palette["gray"][5]}`,
    },
    ...shadowStyles,
  })
})

export type PaperShape = "square" | "rounded"

export interface IPaperProps {
  children?: ReactNode | ReactNode[]
  className?: string
  shape?: PaperShape
  border?: boolean
  fullWidth?: boolean
  shadow?: string | "none"
}

const Paper: React.FC<IPaperProps> = ({
  children,
  className,
  shape = "rounded",
  border,
  fullWidth,
  shadow = "shadow1",
  ...rest
}: IPaperProps) => {
  const classes = useStyles()

  return (
    <div
      className={clsx(
        classes.root,
        shape === "rounded" && classes.rounded,
        border && classes.bordered,
        fullWidth && classes.fullWidth,
        shadow !== "none" && classes[`shadow-${shadow}`],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export default Paper

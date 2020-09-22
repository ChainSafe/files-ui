import React, { ReactNode } from "react"
import { makeStyles, ITheme, createStyles } from "@chainsafe/common-themes"
import clsx from "clsx"

const useStyles = makeStyles(({ palette }: ITheme) =>
  createStyles({
    divider: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
      marginBottom: 22,
      "& span": {
        display: "block",
        margin: "0 5px",
      },
      "&:before, &:after": {
        height: 1,
        width: 0,
        flex: "1 1 0",
        backgroundColor: palette.additional["gray"][5],
        display: "block",
        content: "''",
      },
    },
  }),
)

const Divider: React.FC<{ children?: ReactNode, className?: string }> = ({ children, className }) => {
  const classes = useStyles()
  return <div className={clsx(classes.divider, className)}>{children}</div>
}

export default Divider

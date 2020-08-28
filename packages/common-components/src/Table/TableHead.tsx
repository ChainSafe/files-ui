import React, { ReactNode } from "react"
import { makeStyles, createStyles } from "@material-ui/styles"
import { ITheme } from "@chainsafe/common-themes"
import clsx from "clsx"

const useStyles = makeStyles((theme: ITheme) =>
  createStyles({
    root: {
      ...theme.typography.body1,
      display: "table-header-group",
      backgroundColor: theme.palette.secondary.background,
      borderBottom: `1px solid ${theme.palette.secondary.border}`,
    },
  }),
)

export interface ITableHeadProps {
  className?: string
  children: ReactNode | ReactNode[]
}

const TableHead: React.FC<ITableHeadProps> = ({
  children,
  className,
  ...rest
}: ITableHeadProps) => {
  const classes = useStyles()
  const Component = "thead"

  return (
    <Component className={clsx(classes.root, className)} {...rest}>
      {children}
    </Component>
  )
}

export default TableHead

import React, { ReactNode } from "react"
import { makeStyles, createStyles } from "@material-ui/styles"
import clsx from "clsx"
import { createFlexStyles, createGridStyles } from "./Styles"
import { ITheme } from "@chainsafe/common-themes"

const useStyles = makeStyles((theme: ITheme) =>
  createStyles({
    root: {
      display: "flex",
    },
    ...createFlexStyles(),
    ...createGridStyles(theme),
  }),
)

export interface IGridProps {
  children?: ReactNode | ReactNode[]
  className?: string
  container?: boolean
  item?: boolean
  flexDirection?: FlexDirection
  alignItems?: AlignItems
  justifyContent?: JustifyContent
  flexWrap?: FlexWrap
  xs?: GridSize
  sm?: GridSize
  md?: GridSize
  lg?: GridSize
  xl?: GridSize
}

const Grid: React.FC<IGridProps> = ({
  className,
  container,
  item,
  flexDirection = "column",
  alignItems,
  justifyContent,
  flexWrap = "wrap",
  children,
  xs,
  sm,
  md,
  lg,
  xl,
  ...rest
}: IGridProps) => {
  const classes = useStyles()

  const isContainer = container || !item

  const Component = "div"

  return (
    <Component
      className={clsx(
        classes.root,
        {
          [classes["container"]]: isContainer,
          [classes["item"]]: !isContainer,
          [classes[`flex-direction-${flexDirection}`]]: !isContainer,
          [classes[`align-${alignItems}`]]: alignItems !== undefined,
          [classes[`justify-${justifyContent}`]]: justifyContent !== undefined,
          [classes[`flex-wrap-${flexWrap}`]]: flexWrap !== undefined,
          [classes[`grid-xs-${String(xs)}`]]: xs !== undefined,
          [classes[`grid-sm-${String(sm)}`]]: sm !== undefined,
          [classes[`grid-md-${String(md)}`]]: md !== undefined,
          [classes[`grid-lg-${String(lg)}`]]: lg !== undefined,
          [classes[`grid-xl-${String(xl)}`]]: xl !== undefined,
        },
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default Grid

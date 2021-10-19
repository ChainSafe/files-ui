import React, { useState, ReactNode, useMemo } from "react"
import { Menu as MaterialMenu, MenuItem } from "@material-ui/core"
import { makeStyles, createStyles } from "@chainsafe/common-theme"
import clsx from "clsx"
import { useCallback } from "react"
import { CSFTheme } from "../Themes/types"

interface Option {
  contents: ReactNode
  onClick?: () => void
  disabled?: boolean
}

interface CustomClasses {
  iconContainer?: string
  menuWrapper?: string
  focusVisible?: string
  root?: string
}

interface Props {
  icon?: ReactNode
  options: Option[]
  style?: CustomClasses
  testId?: string
}

const useStyles = makeStyles(({ constants }: CSFTheme) => {
  return createStyles({
    paper:{
      backgroundColor: `${constants.menu.backgroundColor} !important`,
      color: `${constants.menu.color} !important`
    },
    iconContainer: {
      cursor: "pointer"
    },
    options: {
      "&:hover": {
        backgroundColor: `${constants.menu.backgroundOptionHover} !important`
      }
    }
  })})

export default function Menu({ icon, options, style, testId }: Props) {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = useMemo(() => Boolean(anchorEl), [anchorEl])
  const classes = useStyles()

  const handleClick = useCallback((event: any) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  return (
    <div className={clsx(style?.menuWrapper)}>
      <div
        data-testid={`menu-title-${testId}`}
        className={clsx(classes.iconContainer, style?.iconContainer)}
        onClick={handleClick}
      >
        {icon}
      </div>
      <MaterialMenu
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PopoverClasses={{ paper: classes.paper, root: style?.root }}
      >
        {options.map((option, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              handleClose()
              option.onClick && option.onClick()
            }}
            focusVisibleClassName={clsx(style?.focusVisible)}
            className={classes.options}
            disabled={option.disabled}
          >
            {option.contents}
          </MenuItem>
        ))}
      </MaterialMenu>
    </div>
  )
}
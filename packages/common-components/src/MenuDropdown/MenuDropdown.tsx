import React, { ReactNode, useCallback, useRef, useState } from "react"
import { makeStyles, createStyles, ITheme, useOnClickOutside } from "@chainsafe/common-theme"
import { Typography } from "../Typography"
import clsx from "clsx"
import { DirectionalDownIcon, SvgIcon } from "../Icons"
import { Paper } from "../Paper"
import { useOnScroll } from "../Scroll/useOnScroll.hook"

const useStyles = makeStyles(
  ({ constants, animation, typography, palette, overrides }: ITheme) =>
    createStyles({
      // JSS in CSS goes here
      root: {
        display: "inline-block",
        position: "relative",
        "&.open": {},
        ...overrides?.MenuDropdown?.root
      },
      title: {
        ...typography.body1,
        cursor: "pointer",
        display: "inline-flex",
        padding: `${constants.generalUnit * 1.5}px ${constants.generalUnit}px`,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        "& p": {
          position: "relative",
          "& ~ * svg": {
            marginLeft: constants.generalUnit
          }
        },
        ...overrides?.MenuDropdown?.title
      },
      icon: {
        fontSize: "unset",
        height: 14,
        width: 14,
        padding: 0,
        position: "relative",
        // Can create animation variant here
        "&.none": {
          "& svg": {
            transform: "translateY(-50%)"
          }
        },
        "&.flip": {
          "& svg": {
            top: "50%",
            transform: "translateY(-50%) rotateX(0deg)"
          },
          "&.open svg": {
            transform: "translateY(-50%) rotateX(180deg)"
          },
          ...overrides?.MenuDropdown?.icon?.flip
        },
        "&.rotate": {
          "& svg": {
            transform: "translateY(-50%) rotateZ(0deg)"
          },
          "&.open svg": {
            transform: "translateY(-50%) rotateZ(180deg)"
          },
          ...overrides?.MenuDropdown?.icon?.rotate
        },
        "& svg": {
          height: 14,
          width: 14,
          top: "50%",
          left: 0,
          position: "absolute",
          transitionDuration: `${animation.transform}ms`
        },
        ...overrides?.MenuDropdown?.icon?.root
      },
      options: {
        minWidth: "100%",
        backgroundColor: palette.common.white.main,
        height: 0,
        overflow: "hidden",
        visibility: "hidden",
        opacity: 0,
        transitionDuration: `${animation.transform}ms`,
        zIndex: 1000,
        padding: 0,
        "&.top-left": {
          "&.up": {
            bottom: 0
          },
          "&.down": {
            top: 0
          },
          left: 0,
          ...overrides?.MenuDropdown?.options?.position?.topLeft
        },
        "&.top-center": {
          "&.up": {
            bottom: 0
          },
          "&.down": {
            top: 0
          },
          left: "50%",
          transform: "translateX(-50%)",
          ...overrides?.MenuDropdown?.options?.position?.topCenter
        },
        "&.top-right": {
          "&.up": {
            bottom: 0
          },
          "&.down": {
            top: 0
          },
          right: 0,
          ...overrides?.MenuDropdown?.options?.position?.topRight
        },
        "&.bottom-left": {
          "&.up": {
            bottom: "100%"
          },
          "&.down": {
            top: "100%"
          },
          left: 0,
          ...overrides?.MenuDropdown?.options?.position?.bottomLeft
        },
        "&.bottom-center": {
          "&.up": {
            bottom: "100%"
          },
          "&.down": {
            top: "100%"
          },
          left: "50%",
          transform: "translateX(-50%)",
          ...overrides?.MenuDropdown?.options?.position?.bottomCenter
        },
        "&.bottom-right": {
          "&.up": {
            bottom: "100%"
          },
          "&.down": {
            top: "100%"
          },
          right: 0,
          ...overrides?.MenuDropdown?.options?.position?.bottomRight
        },
        position: "absolute",
        "&.open": {
          height: "auto",
          opacity: 1,
          visibility: "visible",
          ...overrides?.MenuDropdown?.options?.open
        },
        ...overrides?.MenuDropdown?.options?.root
      },
      item: {
        cursor: "pointer",
        ...typography.body1,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: `${constants.generalUnit * 1.5}px ${
          constants.generalUnit * 2
        }px`,
        color: palette.additional["gray"][7],
        transitionDuration: `${animation.transform}ms`,
        backgroundColor: "initial",
        "&:hover": {
          backgroundColor: palette.additional["gray"][3],
          ...overrides?.MenuDropdown?.item?.hover
        },
        "& > *:first-child ~ *": {
          marginLeft: constants.generalUnit / 2
        },
        "& > svg": {
          transitionDuration: `${animation.transform}ms`,
          fill: palette.additional["gray"][7]
        },
        ...overrides?.MenuDropdown?.item?.root
      }
    })
)

interface IMenuItem {
  contents: ReactNode | ReactNode[]
  onClick?: () => void
}

interface IMenuDropdownProps {
  className?: string
  autoclose?: boolean
  indicator?: typeof SvgIcon
  animation?: "rotate" | "flip" | "none"
  anchor?:
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  dynamicAnchor?: boolean
  menuItems: IMenuItem[]
  title?: string
  classNames?: {
    icon?: string
    options?: string
    item?: string
    title?: string
    titleText?: string
  }
  testId?: string
}

const MenuDropdown = ({
  className,
  menuItems,
  autoclose = true,
  anchor = "bottom-center",
  indicator = DirectionalDownIcon,
  animation = "flip",
  title,
  classNames,
  testId
}: IMenuDropdownProps) => {
  const Icon = indicator
  const classes = useStyles()
  const [open, setOpen] = useState<boolean>(false)

  const ref = useRef(null)
  useOnClickOutside(ref, () => {
    if (open) {
      setOpen(false)
    }
  })

  const [dropDirection, setDropDirection] = useState<"up" | "down">("down")

  const managePosition = useCallback(() => {
    // TODO: Debounce
    const { offsetTop } = ref.current as unknown as HTMLDivElement

    if (offsetTop < window.pageYOffset + (window.innerHeight / 2)) {
      setDropDirection("down")
    } else {
      setDropDirection("up")
    }
  }, [ref])


  useOnScroll({
    onScroll: managePosition
  })

  return (
    <div
      ref={ref}
      className={clsx(classes.root, className)}
    >
      <section
        data-testid={`dropdown-title-${testId}`}
        onClick={() => setOpen(!open)}
        className={clsx(classes.title, classNames?.title, {
          ["open"]: open
        })}
      >
        {title && (
          <Typography
            component="p"
            variant="body1"
            className={classNames?.titleText}
          >
            {title}
          </Typography>
        )}
        <Icon
          className={clsx(classes.icon, animation, classNames?.icon, {
            ["open"]: open
          })}
        />
      </section>
      <Paper
        shadow="shadow2"
        className={clsx(classes.options, classNames?.options, anchor, dropDirection, {
          ["open"]: open
        })}
      >
        {menuItems.map((item: IMenuItem, index: number) => (
          <div
            data-testid={`dropdown-item-${testId}`}
            key={`menu-${index}`}
            className={clsx(classes.item, classNames?.item)}
            onClick={() => {
              autoclose && setOpen(false)
              item.onClick && item.onClick()
            }}
          >
            {item.contents}
          </div>
        ))}
      </Paper>
    </div>
  )
}

export default MenuDropdown

export { IMenuItem, IMenuDropdownProps }

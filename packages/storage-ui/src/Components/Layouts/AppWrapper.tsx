import { createStyles, ITheme, makeStyles } from "@chainsafe/common-theme"
import React, { useState } from "react"
import { ReactNode } from "react"
import clsx from "clsx"
import { useStorageApi } from "../../Contexts/StorageApiContext"
import {  CssBaseline } from "@chainsafe/common-components"
import AppHeader from "./AppHeader"
import AppNav from "./AppNav"

interface IAppWrapper {
  children: ReactNode | ReactNode[]
}

const useStyles = makeStyles(
  ({ animation, breakpoints, constants }: ITheme) => {
    return createStyles({
      root: {
        minHeight: "100vh"
      },
      bodyWrapper: {
        transitionDuration: `${animation.translate}ms`,
        [breakpoints.up("md")]: {
          padding: "0",
          "&.active": {
            // This moves the content areas based on the size of the nav bar

            padding: `${0}px ${constants.contentPadding}px ${0}px ${
              Number(constants.navWidth) +
              Number(constants.contentPadding)
            }px`
          }
        },
        [breakpoints.down("md")]: {}
      },
      content: {
        minHeight: "100vh",
        [breakpoints.up("md")]: {
          height: "100%",
          transitionDuration: `${animation.translate}ms`,
          padding: 0,
          "&.active": {
            height: "initial",
            padding: `${constants.contentTopPadding}px 0 0`
          }
        },
        [breakpoints.down("md")]: {
          "&.active": {
            height: "initial",
            padding: `${constants.mobileHeaderHeight}px 0 0`
          }
        }
      }
    })
  }
)

const AppWrapper: React.FC<IAppWrapper> = ({ children }: IAppWrapper) => {
  const classes = useStyles()
  const [navOpen, setNavOpen] = useState<boolean>(false)
  const { isLoggedIn } = useStorageApi()

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppNav
        setNavOpen={setNavOpen}
        navOpen={navOpen}
      />
      <article
        className={clsx(classes.bodyWrapper, {
          active: isLoggedIn
        })}
      >
        <AppHeader
          navOpen={navOpen}
          setNavOpen={setNavOpen}
        />
        <section
          className={clsx(classes.content, {
            active: isLoggedIn
          })}
        >
          {children}
        </section>
      </article>
    </div>
  )
}

export default AppWrapper

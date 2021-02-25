import React, { Fragment, useCallback, useState } from "react"
import { useImployApi, useUser } from "@imploy/common-contexts"
import {
  createStyles,
  ITheme,
  makeStyles,
  useThemeSwitcher,
} from "@chainsafe/common-theme"
import clsx from "clsx"
import {
  Link,
  Typography,
  ChainsafeFilesLogo,
  HamburgerMenu,
  MenuDropdown,
  PowerDownSvg,
  SunSvg,
  MoonSvg,
} from "@chainsafe/common-components"
import { ROUTE_LINKS } from "../FilesRoutes"
import SearchModule from "../Modules/SearchModule"
import { Trans } from "@lingui/macro"
import { useDrive } from "../../Contexts/DriveContext"

interface IStyleProps {
  themeKey: string
}

const useStyles = makeStyles(
  ({ palette, animation, breakpoints, constants, zIndex }: ITheme) => {
    return createStyles({
      root: ({ themeKey }: IStyleProps) => ({
        position: "fixed",
        display: "flex",
        flexDirection: "row",
        top: 0,
        transitionDuration: `${animation.translate}ms`,
        visibility: "hidden",
        [breakpoints.up("md")]: {
          width: `calc(100% - ${constants.navWidth}px)`,
          padding: `${0}px ${constants.contentPadding}px ${0}px ${
            constants.contentPadding
          }px`,
          left: constants.navWidth as number,
          opacity: 0,

          backgroundColor: "TODO: FILL",
          // backgroundColor:
          //   themeKey === "light"
          //     ? palette.common.white.main
          //     : themeKey === "dark"
          //     ? palette.additional["gray"][1]
          //     : palette.common.white.main,

          "& > *:first-child": {
            flex: "1 1 0",
          },
          "&.active": {
            opacity: 1,
            height: "auto",
            visibility: "visible",
            padding: `${constants.headerTopPadding}px ${
              constants.contentPadding
            }px ${0}px ${constants.contentPadding}px`,
            zIndex: zIndex?.layer1,
          },
        },
        [breakpoints.down("md")]: {
          left: 0,
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          position: "fixed",
          backgroundColor: palette.additional["gray"][3],
          "&.active": {
            opacity: 1,
            visibility: "visible",
            height: constants.mobileHeaderHeight as number,
            zIndex: zIndex?.layer1 as number,
          },
        },
      }),
      hamburgerMenu: {
        position: "absolute",
      },
      logo: {
        textDecoration: "none",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",

        [breakpoints.up("md")]: {
          "& img": {
            height: constants.generalUnit * 5,
            width: "auto",
          },
          "& > *:first-child": {
            marginRight: constants.generalUnit,
          },
        },
        [breakpoints.down("md")]: {
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          "& img": {
            height: constants.generalUnit * 3.25,
            width: "auto",
          },
        },
      },
      accountControls: {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        flexDirection: "row",
        [breakpoints.up("md")]: {
          marginLeft: constants.accountControlsPadding,
        },
        "& > *:first-child": {
          marginRight: constants.generalUnit * 2,
        },
      },
      searchModule: {
        [breakpoints.down("md")]: {
          height: constants.mobileHeaderHeight,
          position: "absolute",
          right: 2,
          width: "100%",
          zIndex: zIndex?.background,
          "&.active": {},
        },
      },
      options: ({ themeKey }: IStyleProps) => ({
        backgroundColor:
        "TODO: FILL",
        color: "TODO: FILL",

        // backgroundColor:
        //   themeKey === "dark" ? palette.additional.gray[2] : "initial",
        // color: themeKey === "dark" ? palette.additional.gray[9] : "initial",
        border:"TODO: FILL",
        //   themeKey === "dark"
        //     ? `1px solid ${palette.additional.gray[5]}`
        //     : "initial",
      }),
      menuItem: ({ themeKey }: IStyleProps) => ({
        width: 100,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        color: "TODO: FILL",
        // color:
        // themeKey === "dark"
        //   ? palette.additional["gray"][10]
        //   : palette.additional["gray"][8],
        "& svg": {
          width: constants.generalUnit * 2,
          height: constants.generalUnit * 2,
          marginRight: constants.generalUnit,
          fill: palette.additional["gray"][7],
          stroke: palette.additional["gray"][7],
        },
      }),
      icon: ({ themeKey }: IStyleProps) => ({
        "& svg": {
          fill: "TODO: FILL",
          // fill: themeKey === "dark" ? palette.additional.gray[7] : "initial",
        },
      }),
    })
  },
)

interface IAppHeader {
  navOpen: boolean
  setNavOpen: (state: boolean) => void
}

const AppHeader: React.FC<IAppHeader> = ({
  navOpen,
  setNavOpen,
}: IAppHeader) => {
  const { themeKey, setTheme, desktop } = useThemeSwitcher()

  const classes = useStyles({ themeKey })

  const { isLoggedIn, logout, secured } = useImployApi()
  const { isMasterPasswordSet } = useDrive()
  const { getProfileTitle, removeUser } = useUser()

  const signOut = useCallback(() => {
    logout()
    removeUser()
  }, [logout, removeUser])

  const [searchActive, setSearchActive] = useState(false)

  return (
    <header
      className={clsx(classes.root, {
        active: isLoggedIn && secured && !!isMasterPasswordSet,
      })}
    >
      {isLoggedIn && secured && !!isMasterPasswordSet && (
        <Fragment>
          {desktop ? (
            <Fragment>
              <section>
                <SearchModule
                  className={classes.searchModule}
                  searchActive={searchActive}
                  setSearchActive={setSearchActive}
                />
              </section>
              <section className={classes.accountControls}>
                <MenuDropdown
                  title={getProfileTitle()}
                  anchor="bottom-right"
                  classNames={{
                    icon: classes.icon,
                    options: classes.options,
                  }}
                  menuItems={[
                    {
                      onClick: () => signOut(),
                      contents: (
                        <div className={classes.menuItem}>
                          <PowerDownSvg />
                          <Typography>
                            <Trans>Sign Out</Trans>
                          </Typography>
                        </div>
                      ),
                    },
                    {
                      onClick: () =>
                        setTheme(themeKey === "dark" ? "light" : "dark"),
                      contents: (
                        <div className={classes.menuItem}>
                          {themeKey === "dark" ? <SunSvg /> : <MoonSvg />}
                          <Typography>
                            <Trans>
                              {themeKey === "dark" ? "Light mode" : "Dark mode"}
                            </Trans>
                          </Typography>
                        </div>
                      ),
                    },
                  ]}
                />
              </section>
            </Fragment>
          ) : (
            <Fragment>
              {!searchActive && (
                <>
                  <HamburgerMenu
                    onClick={() => setNavOpen(!navOpen)}
                    variant={navOpen ? "active" : "default"}
                    className={classes.hamburgerMenu}
                  />
                  <Link className={classes.logo} to={ROUTE_LINKS.Home()}>
                    <ChainsafeFilesLogo />
                    &nbsp;
                    <Typography variant="caption">beta</Typography>
                  </Link>
                </>
              )}
              <SearchModule
                className={clsx(classes.searchModule, searchActive && "active")}
                searchActive={searchActive}
                setSearchActive={setSearchActive}
              />
            </Fragment>
          )}
        </Fragment>
      )}
    </header>
  )
}

export default AppHeader

import { useFiles } from "../../Contexts/FilesContext"
import { createStyles, makeStyles, useThemeSwitcher } from "@chainsafe/common-theme"
import React, { useCallback } from "react"
import clsx from "clsx"
import {
  Link,
  Typography,
  DatabaseSvg,
  SettingSvg,
  PowerDownSvg,
  ProgressBar,
  formatBytes,
  DeleteSvg,
  UserShareSvg,
  MenuDropdown
} from "@chainsafe/common-components"
import { ROUTE_LINKS } from "../FilesRoutes"
import { Trans } from "@lingui/macro"
import { useThresholdKey } from "../../Contexts/ThresholdKeyContext"
import { CSFTheme } from "../../Themes/types"
import { useUser } from "../../Contexts/UserContext"
import { useFilesApi } from "../../Contexts/FilesApiContext"
import { Hashicon } from "@emeraldpay/hashicon-react"

const useStyles = makeStyles(
  ({ palette, animation, breakpoints, constants, zIndex }: CSFTheme) => {
    return createStyles({
      root: {
        width: 0,
        overflow: "auto",
        transitionDuration: `${animation.translate}ms`,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        opacity: 0,
        "&.active": {
          opacity: 1
        },
        [breakpoints.up("md")]: {
          padding: `${constants.topPadding}px ${
            constants.generalUnit * 4.5
          }px`,
          top: 0,
          height: "100%",
          backgroundColor: constants.nav.backgroundColor,
          "&.active": {
            width: `${constants.navWidth}px`
          }
        },
        [breakpoints.down("md")]: {
          height: `calc(100% - ${constants.mobileHeaderHeight}px)`,
          top: `${constants.mobileHeaderHeight}px`,
          backgroundColor: constants.nav.mobileBackgroundColor,
          zIndex: zIndex?.layer1,
          padding: `0 ${constants.generalUnit * 4}px`,
          maxWidth: "100vw",
          visibility: "hidden",
          "&.active": {
            visibility: "visible",
            width: `${constants.mobileNavWidth}px`
          }
        }
      },
      blocker: {
        display: "block",
        backgroundColor: constants.nav.blocker,
        position: "fixed",
        top: Number(constants.mobileHeaderHeight),
        left: 0,
        height: `calc(100% - ${constants.mobileHeaderHeight}px)`,
        width: "100%",
        transitionDuration: `${animation.translate}ms`,
        zIndex: zIndex?.background,
        opacity: 0,
        visibility: "hidden",
        "&.active": {
          visibility: "visible",
          [breakpoints.down("md")]: {
            opacity: 0.5
          }
        }
      },
      logo: {
        width: constants.generalUnit * 2,
        height: constants.generalUnit * 2,
        marginRight: constants.generalUnit
      },
      navMenu: {
        display: "flex",
        flexDirection: "column",
        marginBottom: constants.generalUnit * 8.5,
        transitionDuration: `${animation.translate}ms`
      },
      linksArea: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
        transitionDuration: `${animation.translate}ms`,
        "& > span": {
          marginBottom: constants.generalUnit * 2
        },
        [breakpoints.down("md")]: {
          transitionDuration: `${animation.translate}ms`,
          color: palette.additional["gray"][3],
          "&.active": {}
        }
      },
      navHead: {
        fontWeight: 600,
        color: constants.nav.headingColor
      },
      navItem: {
        textDecoration: "none",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        cursor: "pointer",
        padding: `${constants.generalUnit * 1.5}px 0`,
        transitionDuration: `${animation.transform}ms`,
        "& span": {
          transitionDuration: `${animation.transform}ms`,
          [breakpoints.up("md")]: {
            color: constants.nav.itemColor
          },
          [breakpoints.down("md")]: {
            color: constants.nav.itemColorHover
          }
        },
        "& svg": {
          "& path" : {
            fill: constants.nav.headingColor
          },
          transitionDuration: `${animation.transform}ms`,
          width: Number(constants.svgWidth),
          marginRight: constants.generalUnit * 2,
          [breakpoints.up("md")]: {
            fill: constants.nav.itemIconColor
          },
          [breakpoints.down("md")]: {
            fill: constants.nav.itemIconColorHover
          }
        },
        "&:hover": {
          "& span": {
            color: constants.nav.itemColorHover
          },
          "& svg": {
            fill: constants.nav.itemIconColorHover
          }
        },
        [breakpoints.down("md")]: {
          minWidth: Number(constants.mobileNavWidth)
        }
      },
      navItemText: {
        [breakpoints.down("md")]: {
          color: palette.additional["gray"][3]
        }
      },
      menuItem: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        color: constants.header.menuItemTextColor,
        "& svg": {
          width: constants.generalUnit * 2,
          height: constants.generalUnit * 2,
          marginRight: constants.generalUnit,
          fill: palette.additional["gray"][7],
          stroke: palette.additional["gray"][7]
        }
      },
      spaceUsedMargin: {
        marginBottom: constants.generalUnit
      },
      profileButton: {
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        padding: constants.generalUnit,
        background: palette.additional["gray"][1],
        boxShadow: constants.nav.profileButtonShadow
      },
      options: {
        backgroundColor: constants.header.optionsBackground,
        color: constants.header.optionsTextColor,
        border: `1px solid ${constants.header.optionsBorder}`,
        minWidth: 145
      },
      icon: {
        "& svg": {
          fill: constants.header.iconColor
        }
      },
      hashIconContainer: {
        marginRight: constants.generalUnit,
        display: "flex",
        alignItems: "center"
      },
      menuTitle: {
        padding: `${constants.generalUnit * 1.5}px 0`
      }
    })
  }
)

interface IAppNav {
  navOpen: boolean
  setNavOpen: (state: boolean) => void
}

const AppNav = ({ navOpen, setNavOpen }: IAppNav) => {
  const { desktop } = useThemeSwitcher()
  const classes = useStyles()
  const { storageSummary } = useFiles()
  const { isLoggedIn, secured } = useFilesApi()
  const { publicKey, isNewDevice, shouldInitializeAccount, logout } = useThresholdKey()
  const { removeUser, getProfileTitle, profile } = useUser()

  const signOut = useCallback(() => {
    logout()
    removeUser()
  }, [logout, removeUser])

  const handleOnClick = useCallback(() => {
    if (!desktop && navOpen) {
      setNavOpen(false)
    }
  }, [desktop, navOpen, setNavOpen])

  const profileTitle = getProfileTitle()

  return (
    <section
      className={clsx(classes.root, {
        active: desktop
          ? isLoggedIn &&
            secured &&
            !!publicKey &&
            !isNewDevice &&
            !shouldInitializeAccount
          : navOpen
      })}
    >
      {isLoggedIn &&
        secured &&
        !!publicKey &&
        !isNewDevice &&
        !shouldInitializeAccount && (
        <>
          {desktop && (
            <section>
              <MenuDropdown
                anchor="bottom-left"
                testId="sign-out"
                hideIndicator={true}
                classNames={{
                  icon: classes.icon,
                  options: classes.options,
                  title: classes.menuTitle
                }}
                className={classes.menuItem}
                menuItems={[
                  {
                    onClick: () => signOut(),
                    contents: (
                      <div
                        data-cy="menu-sign-out"
                        className={classes.menuItem}
                      >
                        <PowerDownSvg />
                        <Typography>
                          <Trans>Sign Out</Trans>
                        </Typography>
                      </div>
                    )
                  }
                ]}
              >
                {!!profileTitle &&
                  <div className={classes.profileButton}>
                    <div className={classes.hashIconContainer}>
                      <Hashicon value={profile?.userId || ""}
                        size={20} />
                    </div>
                    <Typography
                      variant="body1"
                      component="p"
                    >
                      {profileTitle}
                    </Typography>
                  </div>
                }
              </MenuDropdown>
            </section>
          )}
          <div className={classes.linksArea}>
            <Typography className={classes.navHead}>
              <Trans>Folders</Trans>
            </Typography>
            <nav className={classes.navMenu}>
              <Link
                data-cy="link-home"
                onClick={() => {
                  handleOnClick()
                }}
                className={classes.navItem}
                to={ROUTE_LINKS.Drive("/")}
              >
                <DatabaseSvg />
                <Typography
                  variant="h5"
                  className={classes.navItemText}
                >
                  <Trans>Home</Trans>
                </Typography>
              </Link>
              <Link
                data-cy="link-shared"
                onClick={handleOnClick}
                className={classes.navItem}
                to={ROUTE_LINKS.SharedFolders}
              >
                <UserShareSvg />
                <Typography
                  variant="h5"
                  className={classes.navItemText}
                >
                  <Trans>Shared</Trans>
                </Typography>
              </Link>
              <Link
                data-cy="link-bin"
                onClick={handleOnClick}
                className={classes.navItem}
                to={ROUTE_LINKS.Bin("/")}
              >
                <DeleteSvg />
                <Typography
                  variant="h5"
                  className={classes.navItemText}
                >
                  <Trans>Bin</Trans>
                </Typography>
              </Link>
            </nav>
            <Typography className={classes.navHead}>
              {desktop ? <Trans>Resources</Trans> : <Trans>Account</Trans>}
            </Typography>
            <nav className={classes.navMenu}>
              <Link
                data-cy="link-settings"
                onClick={handleOnClick}
                className={classes.navItem}
                to={ROUTE_LINKS.SettingsDefault}
              >
                <SettingSvg />
                <Typography
                  variant="h5"
                  className={classes.navItemText}
                >
                  <Trans>Settings</Trans>
                </Typography>
              </Link>
            </nav>
          </div>
          <section>
            {desktop && (
              <div data-cy="label-space-used">
                {storageSummary && (
                  <>
                    <Typography
                      variant="body2"
                      className={classes.spaceUsedMargin}
                      component="p"
                    >{`${formatBytes(storageSummary.used_storage, 2)} of ${formatBytes(
                        storageSummary.total_storage, 2
                      )} used`}</Typography>
                    <ProgressBar
                      data-cy="progress-bar-space-used"
                      className={classes.spaceUsedMargin}
                      progress={(storageSummary.used_storage / storageSummary.total_storage) * 100}
                      size="small"
                    />
                  </>
                )
                }
              </div>
            )}
            {!desktop && (
              <div
                data-cy="signout-nav"
                className={classes.navItem}
                onClick={() => {
                  handleOnClick()
                  signOut()
                }}
              >
                <PowerDownSvg />
                <Typography>
                  <Trans>Sign Out</Trans>
                </Typography>
              </div>
            )}
          </section>
          {!desktop && (
            <div
              onClick={() => setNavOpen(false)}
              className={clsx(classes.blocker, {
                active: navOpen
              })}
            ></div>
          )}
        </>
      )}
    </section>
  )
}

export default AppNav

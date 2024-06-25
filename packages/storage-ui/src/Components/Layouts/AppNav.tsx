import {
  createStyles,
  makeStyles,
  useThemeSwitcher
} from "@chainsafe/common-theme"
import React, { useCallback, useMemo } from "react"
import clsx from "clsx"
import {
  Link,
  Typography,
  DatabaseSvg,
  ProgressBar,
  formatBytes,
  ChainsafeLogo,
  FolderSvg,
  Button,
  PowerDownIcon,
  useLocation,
  KeySvg,
  CreditCardOutlinedSvg
} from "@chainsafe/common-components"
import { ROUTE_LINKS } from "../StorageRoutes"
import { Trans } from "@lingui/macro"
import { CSSTheme } from "../../Themes/types"
import { useStorageApi } from "../../Contexts/StorageApiContext"
import { useStorage } from "../../Contexts/StorageContext"
import { useBilling } from "../../Contexts/BillingContext"

const useStyles = makeStyles(
  ({ palette, animation, breakpoints, constants, zIndex }: CSSTheme) => {
    return createStyles({
      root: {
        width: 0,
        overflowX: "hidden",
        overflowY: "auto",
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
        textDecoration: "none",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        [breakpoints.up("md")]: {
          "& img": {
            height: constants.generalUnit * 5,
            width: "auto"
          },
          "& > *:first-child": {
            marginRight: constants.generalUnit
          }
        },
        [breakpoints.down("md")]: {
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          "& img": {
            height: constants.generalUnit * 3.25,
            width: "auto"
          }
        }
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
      navItem: {
        textDecoration: "none",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        cursor: "pointer",
        margin: `${constants.generalUnit * 0.5}px 0`,
        padding: `${constants.generalUnit}px ${constants.generalUnit * 1.5}px`,
        borderRadius: "4px",
        transitionDuration: `${animation.transform}ms`,
        "& span": {
          [breakpoints.up("md")]: {
            color: constants.nav.itemColor
          },
          [breakpoints.down("md")]: {
            color: constants.nav.itemColorHover
          }
        },
        "&:hover": {
          backgroundColor: palette.additional["gray"][5],
          [breakpoints.down("md")]: {
            color: constants.nav.backgroundColor
          }
        }
      },
      navItemIconFill: {
        "& svg": {
          "& path": {
            fill: constants.nav.headingColor
          },
          width: Number(constants.svgWidth),
          marginRight: constants.generalUnit * 2,
          [breakpoints.up("md")]: {
            fill: constants.nav.itemIconColor
          },
          [breakpoints.down("md")]: {
            fill: constants.nav.itemIconColorHover
          }
        },
        "&.selected": {
          backgroundColor: palette.additional["gray"][5],
          [breakpoints.down("md")]: {
            "& span": {
              color: constants.nav.mobileSelectedBackground
            },
            "& svg": {
              fill: constants.nav.mobileSelectedBackground
            }
          }
        }
      },
      navItemIconStroke: {
        "& svg": {
          width: Number(constants.svgWidth),
          marginRight: constants.generalUnit * 2,
          [breakpoints.down("md")]: {
            stroke: constants.nav.itemIconColorHover,
            "& path": {
              stroke: constants.nav.headingColor
            }
          }
        },
        "&.selected": {
          backgroundColor: palette.additional["gray"][5],
          [breakpoints.down("md")]: {
            "& span": {
              color: constants.nav.mobileSelectedBackground
            },
            "& svg": {
              stroke: constants.nav.mobileSelectedBackground
            }
          }
        }
      },
      menuItem: {
        width: 100,
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
      spaceUsedText: {
        marginBottom: constants.generalUnit,
        [breakpoints.down("md")]: {
          color: palette.additional["gray"][5]
        }
      },
      spaceUsedMargin: {
        marginBottom: constants.generalUnit * 2
      },
      betaCaption: {
        marginBottom: constants.generalUnit * 0.5
      },
      bottomSection: {
        [breakpoints.down("md")]: {
          marginBottom: constants.generalUnit * 2
        }
      },
      logoutButton: {
        backgroundColor: palette.additional["gray"][5],
        "& span": {
          marginRight: constants.generalUnit * 0.5
        },
        "& svg": {
          width: constants.generalUnit * 2,
          height: constants.generalUnit * 2,
          fill: palette.additional["gray"][9]
        }
      }
    })
  }
)

interface IAppNav {
  navOpen: boolean
  setNavOpen: (state: boolean) => void
}

type AppNavTab = "buckets" | "cids" | "nfts" | "settings" | "api-keys" | "subscription"

const AppNav: React.FC<IAppNav> = ({ navOpen, setNavOpen }: IAppNav) => {
  const { desktop } = useThemeSwitcher()
  const classes = useStyles()
  const location = useLocation()
  const { storageSummary } = useStorage()
  const { isBillingEnabled } = useBilling()
  const { isLoggedIn, logout } = useStorageApi()

  const signOut = useCallback(() => {
    logout()
  }, [logout])

  const handleOnClick = useCallback(() => {
    if (!desktop && navOpen) {
      setNavOpen(false)
    }
  }, [desktop, navOpen, setNavOpen])

  const appNavTab: AppNavTab | undefined = useMemo(() => {
    const firstPathParam = location.pathname.split("/")[1]
    switch(firstPathParam) {
      case "cids": return "cids"
      case "buckets": return "buckets"
      case "bucket": return "buckets"
      case "nfts": return "nfts"
      case "api-keys": return "api-keys"
      case "subscription": return "subscription"
      case "settings": return "settings"
      default: return
    }
  }, [location])

  return (
    <section
      className={clsx(classes.root, {
        active: desktop
          ? isLoggedIn
          : navOpen
      })}
    >
      {isLoggedIn && (
        <>
          {desktop && (
            <div>
              <Link
                data-cy="home-nav"
                className={classes.logo}
                to={ROUTE_LINKS.Buckets}
              >
                <ChainsafeLogo />
                <Typography variant="body1">
                  Storage
                </Typography>
              </Link>
            </div>
          )}
          <div className={classes.linksArea}>
            <nav className={classes.navMenu}>
              <Link
                data-cy="buckets-nav"
                onClick={handleOnClick}
                className={clsx(classes.navItem, classes.navItemIconFill, appNavTab === "buckets" && "selected")}
                to={ROUTE_LINKS.Buckets}
              >
                <FolderSvg />
                <Typography
                  variant="h5"
                >
                  <Trans>Buckets</Trans>
                </Typography>
              </Link>
              <Link
                data-cy="cids-nav"
                onClick={handleOnClick}
                className={clsx(classes.navItem, classes.navItemIconFill, appNavTab === "cids" && "selected")}
                to={ROUTE_LINKS.Cids}
              >
                <DatabaseSvg />
                <Typography
                  variant="h5"
                >
                  <Trans>CIDs</Trans>
                </Typography>
              </Link>
              {/* <Link
                data-cy="nfts-nav"
                onClick={handleOnClick}
                className={clsx(classes.navItem, classes.navItemIconStroke, appNavTab === "nfts" && "selected")}
                to={ROUTE_LINKS.NFTs}
              >
                <FileWithImageSvg />
                <Typography
                  variant="h5"
                >
                  <Trans>NFTs</Trans>
                </Typography>
              </Link> */}
              <Link
                data-cy="api-keys-nav"
                onClick={handleOnClick}
                className={clsx(classes.navItem, classes.navItemIconStroke, appNavTab === "api-keys" && "selected")}
                to={ROUTE_LINKS.ApiKeys}
              >
                <KeySvg />
                <Typography
                  variant="h5"
                >
                  <Trans>API Keys</Trans>
                </Typography>
              </Link>
              {isBillingEnabled &&
                <Link
                  data-cy="subscription-nav"
                  onClick={handleOnClick}
                  className={clsx(classes.navItem, classes.navItemIconStroke, appNavTab === "subscription" && "selected")}
                  to={ROUTE_LINKS.Subscription}
                >
                  <CreditCardOutlinedSvg />
                  <Typography
                    variant="h5"
                  >
                    <Trans>Subscription</Trans>
                  </Typography>
                </Link>
              }
              {/* <Link
                data-cy="settings-nav"
                onClick={handleOnClick}
                className={clsx(classes.navItem, appNavTab === "settings" && "selected")}
                to={ROUTE_LINKS.SettingsRoot}
              >
                <SettingSvg />
                <Typography
                  variant="h5"
                >
                  <Trans>Settings</Trans>
                </Typography>
              </Link> */}
            </nav>
          </div>
          <section className={classes.bottomSection}>
            <div data-cy="label-space-used">
              {
                storageSummary && (
                  <>
                    <Typography
                      variant="body2"
                      className={classes.spaceUsedText}
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
            {!desktop && (
              <Button
                data-cy="button-sign-out"
                onClick={() => {
                  handleOnClick()
                  signOut()
                }}
                className={classes.logoutButton}
                variant="tertiary"
              >
                <PowerDownIcon />
                <Trans>Log out</Trans>
              </Button>
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
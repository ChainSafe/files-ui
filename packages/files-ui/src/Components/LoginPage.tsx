import React, { useState } from "react"
import {
  Grid,
  Typography,
  Button,
  AppleLogoIcon,
  GoogleLogoIcon,
  ChainsafeFilesLogo,
  Link,
  Divider,
} from "@chainsafe/common-components"
import { useWeb3 } from "@chainsafe/web3-context"
import { useAuth } from "@chainsafe/common-contexts"
import {
  makeStyles,
  ITheme,
  createStyles,
  useTheme,
} from "@chainsafe/common-themes"

const useStyles = makeStyles((theme: ITheme) =>
  createStyles({
    imageSection: {
      backgroundColor: theme.palette.common.black.main,
      color: theme.palette.common.white.main,
      textAlign: "center",
      alignContent: "center",
      minHeight: "100vh",
      "& > img": {
        display: "block",
        width: `calc(100% - 116 * 2)`,
        maxWidth: 667,
        marginBottom: 50,
        marginTop: 125,
      },
    },
    buttonSection: {
      paddingTop: 26,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyItems: "flex-start",
    },
    button: {
      backgroundColor: theme.palette.common.black.main,
      color: theme.palette.common.white.main,
      width: 240,
      marginBottom: theme.constants.generalUnit * 2,
    },
    controls: {
      display: "flex",
      flexDirection: "column",
      height: 0,
      justifyContent: "center",
      flex: "1 1 0",
    },
    imageCaption: {
      fontSize: 20,
    },
    footerText: {
      marginTop: theme.constants.generalUnit * 6,
      fontSize: 16,
    },
    headerText: {
      paddingBottom: theme.constants.generalUnit * 8,
    },
    toggleMode: {
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: theme.constants.generalUnit * 4,
    },
  }),
)

const LoginPage = () => {
  const classes = useStyles()
  const theme: ITheme = useTheme()

  const { isReturningUser, web3Login } = useAuth()
  const [error, setError] = useState<string>("")
  const [activeMode, setActiveMode] = useState<"newUser" | "returningUser">(
    isReturningUser ? "returningUser" : "newUser",
  )

  const toggleActiveMode = () =>
    activeMode === "newUser"
      ? setActiveMode("returningUser")
      : setActiveMode("newUser")

  const [isConnecting, setIsConnecting] = useState(false)

  const handleSelectWalletAndConnect = async () => {
    setIsConnecting(true)
    try {
      web3Login()
    } catch (error) {
      setError("There was an error connecting your wallet")
    }
    setIsConnecting(false)
  }
  return (
    <div>
      <Grid container>
        <Grid item md={8} className={classes.imageSection}>
          <img src="abstract-image-large.png" alt="" />
          <Typography
            variant="subtitle2"
            component="h2"
            className={classes.imageCaption}
          >
            Making secure cloud storage easier than ever.
          </Typography>
        </Grid>
        <Grid item md={4} className={classes.buttonSection}>
          <ChainsafeFilesLogo />
          <div className={classes.controls}>
            <Typography
              variant="h6"
              component="h1"
              className={classes.headerText}
            >
              {activeMode === "newUser" ? "Create an account" : "Welcome back!"}
            </Typography>
            {error && (
              <Typography color={theme.palette.error.main}>{error}</Typography>
            )}
            <Button
              onClick={handleSelectWalletAndConnect}
              className={classes.button}
              size="large"
            >
              <Typography variant="button" disabled={isConnecting}>
                Continue with Web3 Wallet
              </Typography>
            </Button>
            <Divider>
              <Typography>or</Typography>
            </Divider>
            <Button disabled className={classes.button} size="large">
              <AppleLogoIcon />{" "}
              <Typography variant="button">Continue with Apple</Typography>
            </Button>
            <Button disabled className={classes.button} size="large">
              <GoogleLogoIcon />{" "}
              <Typography variant="button">Continue with Google</Typography>
            </Button>
            <Typography className={classes.footerText}>
              {activeMode === "newUser"
                ? "Already have an account?"
                : "Not registered yet?"}
            </Typography>
            <Typography
              onClick={toggleActiveMode}
              className={classes.toggleMode}
            >
              {activeMode === "newUser" ? "Sign in" : "Create an account"}
            </Typography>
            <Link to="">Privacy Policy</Link>
            <Link to="">Terms and Conditions</Link>
          </div>
        </Grid>
      </Grid>
    </div>
  )
}

export default LoginPage

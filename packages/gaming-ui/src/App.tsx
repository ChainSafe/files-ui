import React, { useCallback } from "react"
import { init as initSentry, ErrorBoundary, showReportDialog } from "@sentry/react"
import { Web3Provider } from "@chainsafe/web3-context"
import { ThemeSwitcher } from "@chainsafe/common-theme"
import "@chainsafe/common-theme/dist/font-faces.css"
import { Button, CssBaseline, Modal, Router, ToastProvider, Typography } from "@chainsafe/common-components"
import StorageRoutes from "./Components/GamingRoutes"
import AppWrapper from "./Components/Layouts/AppWrapper"
import { LanguageProvider } from "./Contexts/LanguageContext"
import { lightTheme } from "./Themes/LightTheme"
import { darkTheme } from "./Themes/DarkTheme"
import { useLocalStorage } from "@chainsafe/browser-storage-hooks"
import { GamingApiProvider }  from "./Contexts/GamingApiContext"

if (
  process.env.NODE_ENV === "production" &&
  process.env.REACT_APP_SENTRY_DSN_URL
) {
  initSentry({
    dsn: process.env.REACT_APP_SENTRY_DSN_URL,
    release: process.env.REACT_APP_SENTRY_RELEASE,
    environment: process.env.REACT_APP_SENTRY_ENV
  })
}

const availableLanguages = [
  { id: "en", label: "English" }
]

const onboardConfig = {
  dappId: process.env.REACT_APP_BLOCKNATIVE_ID || "",
  walletSelect: {
    wallets: [
      { walletName: "coinbase" },
      {
        walletName: "trust",
        rpcUrl:
          "https://mainnet.infura.io/v3/a7e16429d2254d488d396710084e2cd3"
      },
      { walletName: "metamask", preferred: true },
      { walletName: "authereum" },
      { walletName: "opera" },
      { walletName: "operaTouch" },
      { walletName: "torus" },
      { walletName: "status" },
      {
        walletName: "walletConnect",
        infuraKey: "a7e16429d2254d488d396710084e2cd3",
        preferred: true
      }
    ]
  }
}

const App = () => {
  const { canUseLocalStorage } = useLocalStorage()
  const apiUrl = process.env.REACT_APP_API_URL || "https://stage.imploy.site/api/v1"
  // This will default to testnet unless mainnet is specifically set in the ENV

  const fallBack = useCallback(({ error, componentStack, eventId, resetError }) => (
    <Modal
      active
      closePosition="none"
      onClose={resetError}
    >
      <Typography>
        An error occurred and has been logged. If you would like to
        provide additional info to help us debug and resolve the issue,
        click the `&quot;`Provide Additional Details`&quot;` button
      </Typography>
      <Typography>{error?.message.toString()}</Typography>
      <Typography>{componentStack}</Typography>
      <Typography>{eventId}</Typography>
      <Button
        onClick={() => showReportDialog({ eventId: eventId || "" })}
      >
      Provide Additional Details
      </Button>
      <Button onClick={resetError}>Reset error</Button>
    </Modal>
  ), [])

  return (
    <ThemeSwitcher
      storageKey="csg.themeKey"
      themes={{ light: lightTheme, dark: darkTheme }}
    >
      <ErrorBoundary
        fallback={fallBack}
        onReset={() => window.location.reload()}
      >
        <CssBaseline />
        <LanguageProvider availableLanguages={availableLanguages}>
          <ToastProvider autoDismiss>
            <Web3Provider
              onboardConfig={onboardConfig}
              checkNetwork={false}
              cacheWalletSelection={canUseLocalStorage}
            >
              <GamingApiProvider
                apiUrl={apiUrl}
                withLocalStorage={true}
              >
                <Router>
                  <AppWrapper>
                    <StorageRoutes />
                  </AppWrapper>
                </Router>
              </GamingApiProvider>
            </Web3Provider>
          </ToastProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </ThemeSwitcher>
  )
}

export default App

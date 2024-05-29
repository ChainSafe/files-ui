import { useWeb3 } from "@chainsafe/web3-context"
import * as React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { IFilesApiClient, FilesApiClient, Token, IdentityProvider, IdentityToken } from "@chainsafe/files-api-client"
import jwtDecode from "jwt-decode"
import axios from "axios"
import { useLocalStorage, useSessionStorage } from "@chainsafe/browser-storage-hooks"
import { createHandler, ILoginHandler, LoginWindowResponse, LOGIN_TYPE } from "@toruslabs/torus-direct-web-sdk"
import { t } from "@lingui/macro"
import { capitalize, centerEllipsis } from "../Utils/Helpers"
export type { IdentityProvider as OAuthProvider }

const tokenStorageKey = "css.refreshToken"
const isReturningUserStorageKey = "css.isReturningUser"
const TORUS_USERINFO_KEY = "css.userInfo"

const getProviderSpecificParams = (loginType: LOGIN_TYPE):
{typeOfLogin: LOGIN_TYPE; clientId: string; verifier: string; jwtParams?: any} => {
  switch (loginType) {
    case "google": {
      return {
        typeOfLogin: loginType,
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || "",
        verifier: "chainsafe-uuid-testnet"
      }
    }
    case "github":{
      return {
        typeOfLogin: loginType,
        clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || "",
        verifier: "chainsafe-uuid-testnet",
        jwtParams: {
          domain: process.env.REACT_APP_AUTH0_DOMAIN || ""
        }
      }
    }
    default:{
      throw new Error(`${loginType} is unsupported`)
    }
  }
}

export interface StorageUserInfo {
  typeOfLogin: IdentityProvider
  email?: string
  publicAddress?: string
}

export type DirectAuthContextStatus = "initializing"|"initialized"|"awaiting confirmation"|"logging in"|"done"
type StorageApiContextProps = {
  apiUrl?: string
  withLocalStorage?: boolean
  children: React.ReactNode | React.ReactNode[]
}

interface ExtendedTorusResponse extends LoginWindowResponse {
  expires_in: string
}

type StorageApiContext = {
  userInfo?: StorageUserInfo
  storageApiClient: IFilesApiClient
  isLoggedIn: boolean | undefined
  isReturningUser: boolean
  selectWallet: () => Promise<void>
  resetAndSelectWallet: () => Promise<void>
  login(loginType: IdentityProvider, tokenInfo?: {token: IdentityToken; email: string}): Promise<void>
  loggedinAs: string
  logout: () => void
  status: DirectAuthContextStatus
  resetStatus(): void
  accountRestricted?: boolean
  accountBlacklisted?: boolean
}

const StorageApiContext = React.createContext<StorageApiContext | undefined>(undefined)

const StorageApiProvider = ({ apiUrl, withLocalStorage = true, children }: StorageApiContextProps) => {
  const maintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === "true"

  const { wallet, onboard, checkIsReady, isReady, provider, address } = useWeb3()
  const { canUseLocalStorage, localStorageRemove, localStorageGet, localStorageSet } = useLocalStorage()
  const { sessionStorageRemove, sessionStorageGet, sessionStorageSet } = useSessionStorage()

  // initializing api
  const initialAxiosInstance = useMemo(() => axios.create({
    // Disable the internal Axios JSON de serialization as this is handled by the client
    transformResponse: []
  }), [])

  const initialApiClient = useMemo(() => {
    return new FilesApiClient({}, apiUrl, initialAxiosInstance)
  }, [apiUrl, initialAxiosInstance]
  )

  const [storageApiClient, setStorageApiClient] = useState<FilesApiClient>(initialApiClient)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [loggedinAs, setLoggedinAs] = useState("")
  const [userInfo, setUserInfo] = useState<StorageUserInfo | undefined>()
  const [status, setStatus] = useState<DirectAuthContextStatus>("initialized")

  // access tokens
  const [accessToken, setAccessToken] = useState<Token | undefined>(undefined)
  const [refreshToken, setRefreshToken] = useState<Token | undefined>(undefined)
  const [decodedRefreshToken, setDecodedRefreshToken] = useState<
  { exp: number; enckey?: string; mps?: string; uuid: string } | undefined
  >(undefined)
  const [accountRestricted, setAccountRestricted] = useState(false)
  const [accountBlacklisted, setAccountBlacklisted] = useState(false)

  // returning user
  const isReturningUserLocal = localStorageGet(isReturningUserStorageKey)
  const [isReturningUser, setIsReturningUser] = useState(!!isReturningUserLocal)

  const setTokensAndSave = useCallback((accessToken: Token, refreshToken: Token) => {
    setAccessToken(accessToken)
    setRefreshToken(refreshToken)
    refreshToken.token && withLocalStorage && localStorageSet(tokenStorageKey, refreshToken.token)
    !withLocalStorage && sessionStorageSet(tokenStorageKey, refreshToken.token)
    accessToken.token && storageApiClient.setToken(accessToken.token)
  }, [storageApiClient, localStorageSet, sessionStorageSet, withLocalStorage])

  const setReturningUser = () => {
    // set returning user
    localStorageSet(isReturningUserStorageKey, "returning")
    setIsReturningUser(true)
  }

  useEffect(() => {
    if (userInfo) {
      sessionStorage.setItem(TORUS_USERINFO_KEY, JSON.stringify(userInfo))
    }
  }, [userInfo])

  useEffect(() => {
    const loginType = userInfo?.typeOfLogin as LOGIN_TYPE

    if (userInfo && loginType) {
      switch (loginType) {
        case "jwt":
          setLoggedinAs(t`Web3: ${centerEllipsis(String(address), 4)}`)
          break
        case "google":
          setLoggedinAs(`${capitalize(loginType)}: ${centerEllipsis(`${userInfo.email}`, 4)}`)
          break
        case "github":
          setLoggedinAs(`${capitalize(loginType)}: ${centerEllipsis(`${userInfo.email}`, 4)}`)
          break
        default:
          setLoggedinAs(`${centerEllipsis(`${userInfo.publicAddress}`, 4)}`)
          break
      }
    }
  }, [userInfo, address])


  useEffect(() => {
    const initializeApiClient = async () => {
      const axiosInstance = axios.create({
        // Disable the internal Axios JSON de serialization as this is handled by the client
        transformResponse: []
      })

      axiosInstance.interceptors.response.use(
        (response) => {
          return response
        },
        async (error) => {
          if (!error?.config?._retry && error?.response?.status === 401 && !maintenanceMode) {
            error.config._retry = true
            const refreshTokenLocal =
              (withLocalStorage)
                ? localStorageGet(tokenStorageKey)
                : sessionStorageGet(tokenStorageKey)
            if (refreshTokenLocal) {
              const refreshTokenApiClient = new FilesApiClient(
                {},
                apiUrl,
                axiosInstance
              )
              try {
                const {
                  access_token,
                  refresh_token
                } = await refreshTokenApiClient.getRefreshToken({
                  refresh: refreshTokenLocal
                })

                setTokensAndSave(access_token, refresh_token)
                error.response.config.headers.Authorization = `Bearer ${access_token.token}`
                return axios(error.response.config)
              } catch (err) {
                localStorageRemove(tokenStorageKey)
                !withLocalStorage && sessionStorageRemove(tokenStorageKey)
                setRefreshToken(undefined)
                return Promise.reject(error)
              }
            } else {
              localStorageRemove(tokenStorageKey)
              !withLocalStorage && sessionStorageRemove(tokenStorageKey)
              setRefreshToken(undefined)
              return Promise.reject(error)
            }
          }
          return Promise.reject(error)
        }
      )

      const apiClient = new FilesApiClient({}, apiUrl, axiosInstance)
      const savedRefreshToken = withLocalStorage
        ? localStorageGet(tokenStorageKey)
        : sessionStorageGet(tokenStorageKey)

      setStorageApiClient(apiClient)
      if (!maintenanceMode && savedRefreshToken) {
        try {
          const {
            access_token,
            refresh_token
          } = await apiClient.getRefreshToken({ refresh: savedRefreshToken })

          setTokensAndSave(access_token, refresh_token)
        } catch (error) {
          console.error("There was an error refreshing the saved token")
          console.error(error)
        }
      }
      setIsLoadingUser(false)
    }

    initializeApiClient()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseLocalStorage])


  useEffect(() => {
    if (accessToken && accessToken.token && storageApiClient) {
      storageApiClient?.setToken(accessToken.token)
      const decodedAccessToken = jwtDecode<{ perm: { secured?: string; files?: string; storage?: string } }>(
        accessToken.token
      )

      if (decodedAccessToken.perm.files === "restricted") {
        setAccountRestricted(true)
      } else {
        setAccountRestricted(false)
      }

      if (decodedAccessToken.perm.storage === "blacklisted") {
        setAccountBlacklisted(true)
      } else {
        setAccountBlacklisted(false)
      }
    }
  }, [accessToken, storageApiClient])

  const selectWallet = async () => {
    if (onboard && !isReady) {
      let walletSelected = !!wallet
      if (!walletSelected) {
        walletSelected = await onboard.walletSelect()
      }
      walletSelected && (await checkIsReady())
    }
  }

  const resetAndSelectWallet = async () => {
    if (onboard) {
      const walletReady = await onboard.walletSelect()
      walletReady && (await checkIsReady())
    }
  }


  useEffect(() => {
    if (refreshToken?.token) {
      try {
        const decodedRefresh = jwtDecode<{ mps?: string; enckey?: string; exp: number; uuid: string }>(
          refreshToken.token
        )
        setDecodedRefreshToken(decodedRefresh)
      } catch (error) {
        console.error("Error decoding access token")
      }
    }
  }, [refreshToken])

  const isLoggedIn = () => {
    if (isLoadingUser) {
      return undefined
    }
    if (!decodedRefreshToken) {
      return false
    } else {
      try {
        const isLoggedIn = Date.now() / 1000 < decodedRefreshToken.exp
        return isLoggedIn
      } catch (error) {
        return false
      }
    }
  }

  const getIdentityToken = async (
    loginType: IdentityProvider,
    tokenInfo?: {token: IdentityToken; email: string}
  ): Promise<{identityToken: IdentityToken; userInfo: any}> => {
    if (loginType === "email") {
      if (!tokenInfo) {
        throw new Error("token not provided")
      } else {
        return {
          identityToken: tokenInfo.token,
          userInfo: { email: tokenInfo?.email }
        }
      }
    }
    if (loginType === "web3") {
      let addressToUse = address

      if (!isReady  || !provider) {
        const connected = await checkIsReady()

        if (!connected || !provider) throw new Error("Unable to connect to wallet.")
      }

      const signer = provider.getSigner()
      if (!signer) throw new Error("Signer undefined")

      if(!addressToUse){
        // checkIsReady above doesn't make sure that the address is defined
        // we pull the address here to have it defined for sure
        addressToUse = await signer.getAddress()
      }

      const { token } = await storageApiClient.getIdentityWeb3Token(addressToUse)

      if (!token) throw new Error("Token undefined")

      setStatus("awaiting confirmation")
      const signature = (wallet?.name === "WalletConnect" || wallet?.name === "Connected")
        ? await signer.provider.send("personal_sign", [token, addressToUse])
        : await signer.signMessage(token)

      setStatus("logging in")
      const web3IdentityToken = await storageApiClient.postIdentityWeb3Token({
        signature: signature,
        token: token,
        public_address: addressToUse
      })

      return {
        identityToken: web3IdentityToken,
        userInfo: { address: addressToUse }
      }

    } else {
      const providerSpecificHandlerProps = getProviderSpecificParams(loginType)

      const loginHandler: ILoginHandler = createHandler({
        ...providerSpecificHandlerProps,
        redirect_uri: `${window.location.origin}/serviceworker/redirect`,
        redirectToOpener: false,
        uxMode: "popup",
        customState: {}
      })
      setStatus("awaiting confirmation")
      const oauthIdToken = await loginHandler.handleLoginWindow({})
      setStatus("logging in")
      const userInfo = await loginHandler.getUserInfo(oauthIdToken)

      return {
        identityToken: {
          expires: (oauthIdToken as ExtendedTorusResponse).expires_in,
          token:  oauthIdToken.idToken || oauthIdToken.accessToken
        },
        userInfo
      }
    }
  }

  const login = async (loginType: IdentityProvider, tokenInfo?: {token: IdentityToken; email: string}) => {
    if (!storageApiClient || maintenanceMode) return

    try {
      setStatus("awaiting confirmation")
      const { identityToken, userInfo } = await getIdentityToken(loginType, tokenInfo)
      const { access_token, refresh_token } = await storageApiClient.loginUser({
        provider: loginType,
        service: "storage",
        token: identityToken.token
      })
      setStatus("logging in")

      setUserInfo({
        typeOfLogin: loginType,
        email: userInfo.email,
        publicAddress: userInfo.address
      })
      setTokensAndSave(access_token, refresh_token)
      setReturningUser()
    } catch(error) {
      console.error(error)
      throw new Error("Login Error")
    }
  }

  const logout = () => {
    setAccessToken(undefined)
    setRefreshToken(undefined)
    setDecodedRefreshToken(undefined)
    storageApiClient.setToken("")
    localStorageRemove(tokenStorageKey)
    setLoggedinAs("")
    setStatus("initialized")
    !withLocalStorage && sessionStorageRemove(tokenStorageKey)
  }

  return (
    <StorageApiContext.Provider
      value={{
        storageApiClient,
        isLoggedIn: isLoggedIn(),
        isReturningUser: isReturningUser,
        login,
        resetStatus: () => setStatus("initialized"),
        status,
        loggedinAs,
        userInfo,
        selectWallet,
        resetAndSelectWallet,
        logout,
        accountRestricted,
        accountBlacklisted
      }}
    >
      {children}
    </StorageApiContext.Provider>
  )
}

const useStorageApi = () => {
  const context = React.useContext(StorageApiContext)
  if (context === undefined) {
    throw new Error("useStorage must be used within a StorageProvider")
  }
  return context
}

export { StorageApiProvider, useStorageApi }

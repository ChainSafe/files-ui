import React from "react"
import { Switch, ConditionalRoute } from "@chainsafe/common-components"
import LoginPage from "./Pages/LoginPage"
import { useStorageApi }  from "../Contexts/StorageApiContext"
import CidsPage from "./Pages/CidsPage"
import BucketsPage from "./Pages/BucketsPage"
import SettingsPage from "./Pages/SettingsPage"
import BucketPage from "./Pages/BucketPage"
import BillingHistory from "./Pages/BillingHistory"

export const SETTINGS_PATHS = ["apiKeys", "plan"] as const
export type SettingsPath = typeof SETTINGS_PATHS[number]

export const ROUTE_LINKS = {
  Landing: "/",
  Cids: "/cids",
  Buckets: "/buckets",
  SettingsRoot: "/settings",
  Settings: (path: SettingsPath) => `/settings/${path}`,
  BillingHistory: "/billing-history",
  UserSurvey: "https://blocksurvey.io/survey/1K4bjDmqwtyAsehm1r4KbsdzRRDVyRCDoe/1541a8c4-275a-4e22-9547-570e94c5a55f",
  PrivacyPolicy: "https://storage.chainsafe.io/privacy-policy",
  Terms: "https://storage.chainsafe.io/terms-of-service",
  ChainSafe: "https://chainsafe.io/",
  BucketRoot: "/bucket",
  Bucket: (id: string, bucketPath: string) => `/bucket/${id}${bucketPath}`,
  DiscordInvite: "https://discord.gg/YYFqgHp4Tu"
}

const StorageRoutes = () => {
  const { isLoggedIn } = useStorageApi()

  return (
    <Switch>
      <ConditionalRoute
        exact
        path={ROUTE_LINKS.Cids}
        isAuthorized={isLoggedIn}
        component={CidsPage}
        redirectPath={ROUTE_LINKS.Landing}
      />
      <ConditionalRoute
        exact
        path={ROUTE_LINKS.BillingHistory}
        isAuthorized={isLoggedIn}
        component={BillingHistory}
        redirectPath={ROUTE_LINKS.Landing}
      />
      <ConditionalRoute
        exact
        path={ROUTE_LINKS.Cids}
        isAuthorized={isLoggedIn}
        component={CidsPage}
        redirectPath={ROUTE_LINKS.Landing}
      />
      <ConditionalRoute
        exact
        path={ROUTE_LINKS.Buckets}
        isAuthorized={isLoggedIn}
        component={BucketsPage}
        redirectPath={ROUTE_LINKS.Landing}
      />
      <ConditionalRoute
        path={ROUTE_LINKS.BucketRoot}
        isAuthorized={isLoggedIn}
        component={BucketPage}
        redirectPath={ROUTE_LINKS.Landing}
      />
      <ConditionalRoute
        path={ROUTE_LINKS.SettingsRoot}
        isAuthorized={isLoggedIn}
        component={SettingsPage}
        redirectPath={ROUTE_LINKS.Landing}
      />
      <ConditionalRoute
        path={ROUTE_LINKS.Landing}
        isAuthorized={!isLoggedIn}
        component={LoginPage}
        redirectPath={ROUTE_LINKS.Buckets}
        redirectToSource
      />
    </Switch>
  )
}

export default StorageRoutes

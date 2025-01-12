import axios from "axios"
import { FilesApiClient, FileSystemType } from "@chainsafe/files-api-client"
import { BucketType } from "@chainsafe/files-api-client"

const REFRESH_TOKEN_KEY = "css.refreshToken"
const API_BASE_URL = "https://stage-api.chainsafe.io/api/v1"

const getApiClient = () => {
  // Disable the internal Axios JSON deserialization as this is handled by the client
  const axiosInstance = axios.create({ transformResponse: [] })
  const apiClient = new FilesApiClient({}, API_BASE_URL, axiosInstance)

  return apiClient
}

export const apiTestHelper = {
  createBucket(name: string, fileSystemType: FileSystemType) {
    const apiClient = getApiClient()
    return new Cypress.Promise(async (resolve, reject) => {
      cy.window().then(async (win) => {
        try {
          cy.log("creating bucket", name)
          const tokens = await apiClient.getRefreshToken({ refresh: win.localStorage.getItem(REFRESH_TOKEN_KEY) || "" })
          apiClient.setToken(tokens.access_token.token)
          await apiClient.createBucket({ name: name, file_system_type: fileSystemType, type: "fps", encryption_key: "" })
          cy.log("done with creating bucket")
          resolve()
          cy.reload()
        } catch (e: any) {
          cy.log(e)
          reject(e)
          throw new Error("Something wrong happened during the bucket creation")
        }
      })
    })
  },
  clearPins() {
    const apiClient = getApiClient()

    cy.window().then((win) => {
      apiClient
        .getRefreshToken({
          refresh: win.localStorage.getItem(REFRESH_TOKEN_KEY) || ""
        })
        .then((tokens) => {
          apiClient.setToken(tokens.access_token.token)
          // The ones in "queued" and "pinning" status can't be deleted 
          apiClient.listPins(undefined, undefined, ["pinned", "failed"])
            .then((pins) =>
              pins.results?.forEach(ps => apiClient.deletePin(ps.requestid)
              ))
        })
    })
  },
  deleteBuckets(type: BucketType | BucketType[]) {
    const apiClient = getApiClient()
    const typeToDelete = Array.isArray(type) ? type : [type]

    return new Cypress.Promise(async (resolve) => {
      cy.window()
        .then(async (win) => {
          const tokens = await apiClient.getRefreshToken({ refresh: win.localStorage.getItem(REFRESH_TOKEN_KEY) || "" })

          await apiClient.setToken(tokens.access_token.token)
          const buckets = await apiClient.listBuckets(typeToDelete)
          buckets.forEach(async (bucket) => {
            cy.log(`Deleting fps bucket: "${bucket.name}""`)
            await apiClient.removeBucket(bucket.id)
          })
          cy.log("Done deleting fps buckets.")
          resolve()
        })
    })
  },
  deleteApiKeys() {
    const apiClient = getApiClient()
    return new Cypress.Promise(async (resolve) => {
      cy.window()
        .then(async (win) => {
          const tokens = await apiClient.getRefreshToken({ refresh: win.localStorage.getItem(REFRESH_TOKEN_KEY) || "" })

          await apiClient.setToken(tokens.access_token.token)
          const keys = await apiClient.listAccessKeys()
          cy.log(keys.length.toString())
          keys.forEach(async (key) => {
            cy.log(`Deleting api key: "${key.id}""`)
            await apiClient.deleteAccessKey(key.id)
          })
          cy.log("Done deleting api keys.")
          resolve()
        })
    })
  }
}

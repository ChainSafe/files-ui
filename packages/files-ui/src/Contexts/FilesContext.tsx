import {
  FileContentResponse,
  DirectoryContentResponse,
  BucketType,
  Bucket as FilesBucket,
  SearchEntry,
  BucketFileFullInfoResponse,
  BucketSummaryResponse,
  LookupUser
} from "@chainsafe/files-api-client"
import React, { useCallback, useEffect, useReducer } from "react"
import { useState } from "react"
import { decryptFile, encryptFile  } from "../Utils/encryption"
import { v4 as uuidv4 } from "uuid"
import { useToaster } from "@chainsafe/common-components"
import { downloadsInProgressReducer, transfersInProgressReducer, uploadsInProgressReducer } from "./FilesReducers"
import axios, { CancelToken } from "axios"
import { t } from "@lingui/macro"
import { parseFileContentResponse, readFileAsync } from "../Utils/Helpers"
import { useBeforeunload } from "react-beforeunload"
import { useThresholdKey } from "./ThresholdKeyContext"
import { useFilesApi } from "./FilesApiContext"
import { useUser } from "./UserContext"
import { getPathWithFile, getRelativePath } from "../Utils/pathUtils"
import UploadProgressToasts from "../Components/Modules/UploadProgressToast"
import DownloadProgressToasts from "../Components/Modules/DownloadProgressToast"
import TransferProgressToasts from "../Components/Modules/TransferProgressToast"
import { Zippable, zipSync } from "fflate"

type FilesContextProps = {
  children: React.ReactNode | React.ReactNode[]
}

export type UploadProgress = {
  id: string
  fileName: string
  progress: number
  error: boolean
  errorMessage?: string
  complete: boolean
  noOfFiles: number
  path: string
}

export type DownloadProgress = {
  id: string
  fileName: string
  progress: number
  currentFileNumber?: number
  totalFileNumber: number
  error: boolean
  errorMessage?: string
  complete: boolean
}

export type TransferOperation = "Download" | "Encrypt & Upload"

export type TransferProgress = {
  id: string
  operation: TransferOperation
  progress: number
  error: boolean
  errorMessage?: string
  complete: boolean
}

export type SharedFolderUser = {
  uuid: string
  pubKey: string
}

export type UpdateSharedFolderUser = {
  uuid: string
  pubKey?: string
  encryption_key?: string
}

interface GetFileContentParams {
  cid: string
  cancelToken?: CancelToken
  onDownloadProgress?: (progressEvent: ProgressEvent<EventTarget>) => void
  file: FileSystemItem
  path: string
}

export type BucketPermission = "writer" | "owner" | "reader"

export type BucketKeyPermission = Omit<FilesBucket, "owners" | "writers" | "readers"> & {
  encryptionKey: string
  permission?: BucketPermission
  owners: LookupUser[]
  writers: LookupUser[]
  readers: LookupUser[]
}

type FilesContext = {
  buckets: BucketKeyPermission[]
  uploadsInProgress: UploadProgress[]
  downloadsInProgress: DownloadProgress[]
  storageSummary: BucketSummaryResponse | undefined
  personalEncryptionKey: string | undefined
  getStorageSummary: () => Promise<void>
  uploadFiles: (bucket: BucketKeyPermission, files: File[], path: string, encryptionKey?: string) => Promise<void>
  downloadFile: (bucketId: string, itemToDownload: FileSystemItem, path: string) => void
  getFileContent: (bucketId: string, params: GetFileContentParams) => Promise<Blob | undefined>
  refreshBuckets: (showLoading?: boolean) => Promise<void>
  secureAccountWithMasterPassword: (candidatePassword: string) => Promise<void>
  isLoadingBuckets?: boolean
  createSharedFolder: (
    name: string,
    writers?: SharedFolderUser[],
    readers?: SharedFolderUser[]
  ) => Promise<BucketKeyPermission | void>
  editSharedFolder: (
    bucket: BucketKeyPermission,
    writers?: UpdateSharedFolderUser[],
    readers?: UpdateSharedFolderUser[]
  ) => Promise<void>
  transferFileBetweenBuckets: (
    sourceBucketId: string,
    sourceFile: FileSystemItem,
    path: string,
    destinationBucket: BucketKeyPermission,
    deleteFromSource?: boolean
  ) => Promise<void>
  transfersInProgress: TransferProgress[]
  downloadMultipleFiles: (fileItems: FileSystemItem[], currentPath: string, bucketId: string) => void
}

// This represents a File or Folder
export interface FileSystemItem extends FileContentResponse {
  isFolder: boolean
}

interface FileSystemItemPath extends FileSystemItem {
  path: string
}

const REMOVE_TOAST_DELAY = 5000
const MAX_FILE_SIZE = 2 * 1024 ** 3

const FilesContext = React.createContext<FilesContext | undefined>(undefined)

const FilesProvider = ({ children }: FilesContextProps) => {
  const {
    filesApiClient,
    isLoggedIn,
    secured,
    secureThresholdKeyAccount,
    encryptedEncryptionKey,
    isMasterPasswordSet,
    validateMasterPassword
  } = useFilesApi()
  const { publicKey, encryptForPublicKey, decryptMessageWithThresholdKey } = useThresholdKey()
  const { addToastMessage } = useToaster()
  const [personalEncryptionKey, setPersonalEncryptionKey] = useState<string | undefined>()
  const [buckets, setBuckets] = useState<BucketKeyPermission[]>([])
  const [storageSummary, setStorageSummary] = useState<BucketSummaryResponse | undefined>()
  const { profile } = useUser()
  const { userId } = profile || {}
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false)

  const getStorageSummary = useCallback(async () => {
    try {
      const bucketSummaryData = await filesApiClient.bucketsSummary()
      setStorageSummary(bucketSummaryData)
    } catch (error) {
      console.error(error)
    }
  }, [filesApiClient, setStorageSummary])

  const getPermissionForBucket = useCallback((bucket: FilesBucket) => {
    return bucket.owners.find(owner => owner.uuid === userId)
      ? "owner" as BucketPermission
      : bucket.writers.find(writer => writer.uuid === userId)
        ? "writer" as BucketPermission
        : bucket.readers.find(reader => reader.uuid === userId)
          ? "reader" as BucketPermission
          : undefined
  }, [userId])

  const getKeyForSharedBucket = useCallback(async (bucket: FilesBucket) => {
    const bucketUsers = [...bucket.readers, ...bucket.writers, ...bucket.owners]
    const bucketUser = bucketUsers.find(bu => bu.uuid === userId)

    if (!bucketUser?.encryption_key) {
      console.error(`Unable to retrieve encryption key for ${bucket.id}`)
      return ""
    }

    const decrypted = await decryptMessageWithThresholdKey(bucketUser.encryption_key)

    return decrypted || ""
  }, [decryptMessageWithThresholdKey, userId])

  const getKeyForBucket = useCallback(async (bucket: FilesBucket) => {
    if (!personalEncryptionKey || !userId) return

    let encryptionKey = ""

    switch(bucket.type) {
    case "csf":
    case "trash": {
      encryptionKey = personalEncryptionKey
      break
    }
    case "share": {
      encryptionKey = await getKeyForSharedBucket(bucket)
      break
    }}

    return encryptionKey
  }, [getKeyForSharedBucket, personalEncryptionKey, userId])

  const refreshBuckets = useCallback(async (showLoading?: boolean) => {
    if (!personalEncryptionKey || !userId) return

    showLoading && setIsLoadingBuckets(true)
    const result = await filesApiClient.listBuckets()

    const bucketsWithKeys: BucketKeyPermission[] = await Promise.all(
      result.map(async (b) => {
        const userData = await filesApiClient.getBucketUsers(b.id)
        return {
          ...b,
          encryptionKey: await getKeyForBucket(b) || "",
          permission: getPermissionForBucket(b),
          owners: userData.owners || [],
          writers: userData.writers || [],
          readers: userData.readers || []
        }
      })
    )
    setBuckets(bucketsWithKeys)
    setIsLoadingBuckets(false)
    getStorageSummary()
    return Promise.resolve()
  }, [personalEncryptionKey, userId, filesApiClient, getStorageSummary, getKeyForBucket, getPermissionForBucket])

  useEffect(() => {
    refreshBuckets(true)
  }, [refreshBuckets])

  // Space used counter
  useEffect(() => {
    if (isLoggedIn) {
      getStorageSummary()
    }
  }, [isLoggedIn, getStorageSummary, profile])

  // Reset encryption keys on log out
  useEffect(() => {
    if (!isLoggedIn) {
      setPersonalEncryptionKey(undefined)
      setBuckets([])
    }
  }, [isLoggedIn])

  const secureAccount = useCallback(() => {
    if (!publicKey) return

    const key = Buffer.from(
      window.crypto.getRandomValues(new Uint8Array(32))
    ).toString("base64")
    console.log("New key", key)
    setPersonalEncryptionKey(key)
    encryptForPublicKey(publicKey, key)
      .then((encryptedKey) => {
        console.log("Encrypted encryption key", encryptedKey)
        secureThresholdKeyAccount(encryptedKey)
      })
      .catch(console.error)
  }, [encryptForPublicKey, publicKey, secureThresholdKeyAccount])

  const decryptKey = useCallback((encryptedKey: string) => {
    console.log("Decrypting retrieved key")

    decryptMessageWithThresholdKey(encryptedKey)
      .then((decryptedKey) => {
        console.log("Decrypted key: ", decryptedKey)
        setPersonalEncryptionKey(decryptedKey)
      })
      .catch(console.error)
  }, [decryptMessageWithThresholdKey])

  // Drive encryption handler
  useEffect(() => {
    if (isLoggedIn && publicKey && !personalEncryptionKey) {
      console.log("Checking whether account is secured ", secured)

      if (!secured && !isMasterPasswordSet) {
        console.log("Generating key and securing account")
        secureAccount()
      } else {
        console.log("decrypting key")
        if (encryptedEncryptionKey) {
          decryptKey(encryptedEncryptionKey)
        }
      }
    }
  }, [
    secured,
    isLoggedIn,
    encryptedEncryptionKey,
    publicKey,
    encryptForPublicKey,
    secureThresholdKeyAccount,
    decryptMessageWithThresholdKey,
    personalEncryptionKey,
    isMasterPasswordSet,
    secureAccount,
    decryptKey,
    isLoadingBuckets
  ])

  const secureAccountWithMasterPassword = async (candidatePassword: string) => {
    if (!publicKey || !validateMasterPassword(candidatePassword)) return

    const encryptedKey = await encryptForPublicKey(publicKey, candidatePassword)
    setPersonalEncryptionKey(candidatePassword)
    secureThresholdKeyAccount(encryptedKey)
  }

  const [uploadsInProgress, dispatchUploadsInProgress] = useReducer(uploadsInProgressReducer, [])
  const [downloadsInProgress, dispatchDownloadsInProgress] = useReducer(downloadsInProgressReducer, [])
  const [transfersInProgress, dispatchTransfersInProgress] = useReducer(transfersInProgressReducer, [])
  const [closeIntercept, setCloseIntercept] = useState<string | undefined>()

  useEffect(() => {
    if (downloadsInProgress.length > 0) {
      setCloseIntercept("Download in progress, are you sure?")
    } else if (uploadsInProgress.length > 0) {
      setCloseIntercept("Upload in progress, are you sure?")
    } else if (transfersInProgress.length > 0) {
      setCloseIntercept("Transfer is in progress, are you sure?")
    } else if (closeIntercept !== undefined) {
      setCloseIntercept(undefined)
    }
  }, [closeIntercept, downloadsInProgress, uploadsInProgress, transfersInProgress])

  useBeforeunload(() => {
    if (closeIntercept !== undefined) {
      return closeIntercept
    }
  })

  const encryptAndUploadFiles = useCallback(async (
    bucket: BucketKeyPermission,
    files: File[],
    path: string,
    onUploadProgress?: (progressEvent: ProgressEvent<EventTarget>) => void) => {

    const key = bucket.encryptionKey

    if (!key) {
      console.error("No encryption key for this bucket available.")
      return
    }
    const filesParam = await Promise.all(
      files
        .filter((f) => f.size <= MAX_FILE_SIZE)
        .map(async (f) => {
          const fileData = await readFileAsync(f)
          const encryptedData = await encryptFile(fileData, key)
          return {
            data: new Blob([encryptedData], { type: f.type }),
            fileName: f.name
          }
        })
    )

    await filesApiClient.uploadBucketObjects(
      bucket.id,
      filesParam,
      path,
      undefined,
      1,
      undefined,
      undefined,
      onUploadProgress
    )
  }, [filesApiClient])

  const uploadFiles = useCallback(async (bucket: BucketKeyPermission, files: File[], path: string) => {
    const id = uuidv4()
    const uploadProgress: UploadProgress = {
      id,
      fileName: files[0].name, // TODO: Do we need this?
      complete: false,
      error: false,
      noOfFiles: files.length,
      progress: 0,
      path
    }
    dispatchUploadsInProgress({ type: "add", payload: uploadProgress })
    const hasOversizedFile = files.some(file => file.size > MAX_FILE_SIZE)

    if (hasOversizedFile) {
      addToastMessage({
        message: t`We can't encrypt files larger than 2GB. Some items will not be uploaded`,
        appearance: "error"
      })
    }

    try {
      await encryptAndUploadFiles(
        bucket,
        files,
        path,
        (progressEvent: { loaded: number; total: number }) => {
          dispatchUploadsInProgress({
            type: "progress",
            payload: {
              id,
              progress: Math.ceil(
                (progressEvent.loaded / progressEvent.total) * 100
              )
            }
          })
        })

      await refreshBuckets()
      // setting complete
      dispatchUploadsInProgress({ type: "complete", payload: { id } })
      setTimeout(() => {
        dispatchUploadsInProgress({ type: "remove", payload: { id } })
      }, REMOVE_TOAST_DELAY)

      return Promise.resolve()
    } catch (error) {
      console.error(error)
      // setting error
      let errorMessage = t`Something went wrong. We couldn't upload your file`

      // we will need a method to parse server errors
      if (Array.isArray(error) && error[0].message.includes("conflict")) {
        errorMessage = t`A file with the same name already exists`
      }
      dispatchUploadsInProgress({
        type: "error",
        payload: { id, errorMessage }
      })
      setTimeout(() => {
        dispatchUploadsInProgress({ type: "remove", payload: { id } })
      }, REMOVE_TOAST_DELAY)

      return Promise.reject(error)
    }
  }, [addToastMessage, refreshBuckets, encryptAndUploadFiles])

  const getFileContent = useCallback(async (
    bucketId: string,
    { cid, cancelToken, onDownloadProgress, file, path }: GetFileContentParams
  ) => {
    const key = buckets.find(b => b.id === bucketId)?.encryptionKey

    if (!key) {
      throw new Error("No encryption key for this bucket found")
    }

    // when a file is accessed from the search page, a file  and a path are passed in
    // because the current path will not reflect the right state of the app 
    const fileToGet = file

    if (!fileToGet) {
      console.error("No file passed, and no file found for cid:", cid, "in pathContents:", path)
      throw new Error("No file found.")
    }

    try {
      const result = await filesApiClient.getBucketObjectContent(
        bucketId,
        { path: path },
        cancelToken,
        onDownloadProgress
      )

      if (fileToGet.version === 0) {
        return result.data
      } else {
        const decrypted = await decryptFile(
          await result.data.arrayBuffer(),
          key
        )
        if (decrypted) {
          return new Blob([decrypted], {
            type: fileToGet.content_type
          })
        }
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        return Promise.reject()
      } else {
        console.error(error)
        return Promise.reject(error)
      }
    }
  }, [buckets, filesApiClient])

  const getFileList = useCallback(async (
    itemsToDownload: FileSystemItem[],
    currentPath: string,
    bucketId: string
  ): Promise<FileSystemItemPath[]>  => {
    return await itemsToDownload.reduce(
      async (acc: Promise<FileSystemItemPath[]>, item: FileSystemItem): Promise<FileSystemItemPath[]> => {
        if (item.isFolder) {
          const folderPath = getPathWithFile(currentPath, item.name)
          const newList = await filesApiClient.getBucketObjectChildrenList(bucketId, { path: folderPath })

          const childFolderItems = newList.map(parseFileContentResponse)
          return childFolderItems.length
            ? [...await acc, ...await getFileList(childFolderItems, folderPath, bucketId)]
            : Promise.resolve(acc)
        }

        return [...await acc, { ...item, path: currentPath }]
      }, Promise.resolve([] as FileSystemItemPath[]))
  }, [filesApiClient])

  const downloadMultipleFiles = useCallback((itemsToDownload: FileSystemItem[], currentPath: string, bucketId: string) => {
    getFileList(itemsToDownload, currentPath, bucketId)
      .then(async (fullStructure) => {
        const zipList: Zippable = {}
        const toastId = uuidv4()

        const totalFileSize = fullStructure.reduce((sum, item) => sum + item.size, 0)
        const downloadProgress: DownloadProgress = {
          id: toastId,
          currentFileNumber: 1,
          totalFileNumber: fullStructure.length,
          fileName: fullStructure[0]?.name,
          complete: false,
          error: false,
          progress: 0
        }

        dispatchDownloadsInProgress({ type: "add", payload: downloadProgress })

        // if there are no file to download return early and show an error
        if (!fullStructure.length) {
          dispatchDownloadsInProgress({
            type: "error",
            payload: {
              id: toastId,
              errorMessage: t`No file to download.`
            }
          })

          setTimeout(() => {
            dispatchDownloadsInProgress({
              type: "remove",
              payload: { id: toastId }
            })
          }, REMOVE_TOAST_DELAY)
          return
        }

        // Idea for parrallel download https://glebbahmutov.com/blog/run-n-promises-in-parallel/
        // we need to use a reduce here because forEach doesn't wait for the Promise to resolve
        await fullStructure.reduce(async (totalDownloaded: Promise<number>, item: FileSystemItemPath, index: number): Promise<number> => {
          const file = await getFileContent(bucketId, {
            cid: item.cid,
            file: item,
            path: getPathWithFile(item.path, item.name),
            onDownloadProgress: async (progressEvent) => {
              dispatchDownloadsInProgress({
                type: "progress",
                payload: {
                  id: toastId,
                  fileName: item.name,
                  currentFileNumber: index + 1,
                  progress: Math.ceil(
                    ((await totalDownloaded + progressEvent.loaded) / totalFileSize) * 100
                  )
                }
              })
            }
          })

          if(file) {
            const fileArrayBuffer = await file.arrayBuffer()
            const fullPath = getPathWithFile(item.path, item.name)
            const relativeFilePath = getRelativePath(fullPath, currentPath)
            zipList[relativeFilePath] = new Uint8Array(fileArrayBuffer)
          }

          return await totalDownloaded + item.size
        }, Promise.resolve(0))

        // level 0 means without compression
        const zipped = zipSync(zipList, { level: 0 })

        if (!zipped) return

        const link = document.createElement("a")
        link.href = URL.createObjectURL(new Blob([zipped]))
        link.download = "archive.zip"
        link.click()

        dispatchDownloadsInProgress({
          type: "complete",
          payload: { id: toastId }
        })

        URL.revokeObjectURL(link.href)

        setTimeout(() => {
          dispatchDownloadsInProgress({
            type: "remove",
            payload: { id: toastId }
          })
        }, REMOVE_TOAST_DELAY)
      })
      .catch(console.error)
  }, [getFileContent, getFileList])

  const downloadFile = useCallback(async (bucketId: string, itemToDownload: FileSystemItem, path: string) => {
    const toastId = uuidv4()
    try {
      const downloadProgress: DownloadProgress = {
        id: toastId,
        fileName: itemToDownload.name,
        totalFileNumber: 1,
        complete: false,
        error: false,
        progress: 0
      }
      dispatchDownloadsInProgress({ type: "add", payload: downloadProgress })
      const result = await getFileContent(bucketId, {
        cid: itemToDownload.cid,
        file: itemToDownload,
        path: getPathWithFile(path, itemToDownload.name),
        onDownloadProgress: (progressEvent) => {
          dispatchDownloadsInProgress({
            type: "progress",
            payload: {
              id: toastId,
              fileName: itemToDownload.name,
              progress: Math.ceil(
                (progressEvent.loaded / itemToDownload.size) * 100
              )
            }
          })
        }
      })
      if (!result) return
      const link = document.createElement("a")
      link.href = URL.createObjectURL(result)
      link.download = itemToDownload?.name || "file"
      link.click()
      dispatchDownloadsInProgress({
        type: "complete",
        payload: { id: toastId }
      })
      URL.revokeObjectURL(link.href)
      setTimeout(() => {
        dispatchDownloadsInProgress({
          type: "remove",
          payload: { id: toastId }
        })
      }, REMOVE_TOAST_DELAY)
      return Promise.resolve()
    } catch (error) {
      dispatchDownloadsInProgress({ type: "error", payload: { id: toastId } })
      return Promise.reject()
    }
  }, [getFileContent])

  const createSharedFolder = useCallback(async (name: string, writerUsers?: SharedFolderUser[], readerUsers?: SharedFolderUser[]) =>  {
    if (!publicKey) return

    const bucketEncryptionKey = Buffer.from(
      window.crypto.getRandomValues(new Uint8Array(32))
    ).toString("base64")

    const ownerEncryptedEncryptionKey = await encryptForPublicKey(publicKey, bucketEncryptionKey)

    const readers = readerUsers ? await Promise.all(readerUsers?.map(async u => ({
      uuid: u.uuid,
      encryption_key: await encryptForPublicKey(u.pubKey, bucketEncryptionKey)
    }))) : []

    const writers = writerUsers ? await Promise.all(writerUsers?.map(async u => ({
      uuid: u.uuid,
      encryption_key: await encryptForPublicKey(u.pubKey, bucketEncryptionKey)
    }))) : []

    return filesApiClient.createBucket({
      name,
      encryption_key: ownerEncryptedEncryptionKey,
      type: "share",
      readers,
      writers
    }).then(async (bucket) => {
      refreshBuckets(false)

      return {
        ...bucket,
        encryptionKey: await getKeyForBucket(bucket) || "",
        permission: getPermissionForBucket(bucket)
      } as BucketKeyPermission
    })
      .catch(console.error)
  }, [publicKey, encryptForPublicKey, filesApiClient, refreshBuckets, getKeyForBucket, getPermissionForBucket])

  const editSharedFolder = useCallback(
    async (bucket: BucketKeyPermission, writerUsers?: UpdateSharedFolderUser[], readerUsers?: UpdateSharedFolderUser[]) => {
      if (!publicKey) return

      const readers = readerUsers ? await Promise.all(readerUsers?.map(async u => {
        return u.pubKey ? {
          uuid: u.uuid,
          encryption_key: await encryptForPublicKey(u.pubKey, bucket.encryptionKey)
        } : {
          uuid: u.uuid,
          encryption_key: u.encryption_key
        }
      })) : []

      const writers = writerUsers ? await Promise.all(writerUsers?.map(async u => {
        return u.pubKey ? {
          uuid: u.uuid,
          encryption_key: await encryptForPublicKey(u.pubKey, bucket.encryptionKey)
        } : {
          uuid: u.uuid,
          encryption_key: u.encryption_key
        }
      })) : []

      return filesApiClient.updateBucket(bucket.id, {
        name: bucket.name,
        readers,
        writers
      }).then(() => refreshBuckets(false))
        .catch(console.error)
    }, [filesApiClient, encryptForPublicKey, publicKey, refreshBuckets])

  const transferFileBetweenBuckets = useCallback(async (
    sourceBucketId: string,
    sourceFile: FileSystemItem,
    path: string,
    destinationBucket: BucketKeyPermission,
    keepOriginal = true
  ) => {
    const toastId = uuidv4()
    const UPLOAD_PATH = "/"

    const transferProgress: TransferProgress = {
      id: toastId,
      complete: false,
      error: false,
      progress: 0,
      operation: "Download"
    }
    dispatchTransfersInProgress({ type: "add", payload: transferProgress })

    getFileContent(sourceBucketId, {
      cid: sourceFile.cid,
      file: sourceFile,
      path: getPathWithFile(path, sourceFile.name),
      onDownloadProgress: (progressEvent) => {
        dispatchTransfersInProgress({
          type: "progress",
          payload: {
            id: toastId,
            progress: Math.ceil(
              (progressEvent.loaded / sourceFile.size) * 50
            )
          }
        })
      }
    }).then(async (fileContent) => {
      if (!fileContent) {
        dispatchTransfersInProgress({
          type: "error",
          payload: {
            id: toastId,
            errorMessage: t`An error occurred while downloading the file`
          }
        })
        return
      }

      dispatchTransfersInProgress({
        type: "operation",
        payload: {
          id: toastId,
          operation: "Encrypt & Upload"
        }
      })

      await encryptAndUploadFiles(
        destinationBucket,
        [new File([fileContent], sourceFile.name, { type: sourceFile.content_type })],
        UPLOAD_PATH,
        (progressEvent) => {
          dispatchTransfersInProgress({
            type: "progress",
            payload: {
              id: toastId,
              progress: Math.ceil(
                50 + (progressEvent.loaded / sourceFile.size) * 50
              )
            }
          })
        }
      )

      if (!keepOriginal) {
        await filesApiClient.removeBucketObject(sourceBucketId, { paths: [getPathWithFile(path, sourceFile.name)] })
      }

      dispatchTransfersInProgress({
        type:"complete",
        payload: {
          id: toastId
        }
      })
      return Promise.resolve()
    }).catch((error) => {
      console.error(error[0].message)
      dispatchTransfersInProgress({
        type: "error",
        payload: {
          id: toastId,
          errorMessage: `${t`An error occurred: `} ${typeof(error) === "string" ? error : error[0].message}`
        }
      })
    }).finally(() => {
      refreshBuckets()
      setTimeout(() => {
        dispatchTransfersInProgress({ type: "remove", payload: { id: toastId } })
      }, REMOVE_TOAST_DELAY)
    })
  }, [getFileContent, encryptAndUploadFiles, filesApiClient, refreshBuckets])

  return (
    <FilesContext.Provider
      value={{
        uploadFiles,
        downloadFile,
        downloadMultipleFiles,
        getFileContent,
        personalEncryptionKey,
        uploadsInProgress,
        storageSummary,
        getStorageSummary,
        downloadsInProgress,
        secureAccountWithMasterPassword,
        buckets,
        refreshBuckets,
        isLoadingBuckets,
        createSharedFolder,
        editSharedFolder,
        transferFileBetweenBuckets,
        transfersInProgress
      }}
    >
      {children}
      <UploadProgressToasts />
      <DownloadProgressToasts />
      <TransferProgressToasts />
    </FilesContext.Provider>
  )
}

const useFiles = () => {
  const context = React.useContext(FilesContext)
  if (context === undefined) {
    throw new Error("useFiles must be used within a FilesProvider")
  }
  return context
}

export { FilesProvider, useFiles }
export type {
  DirectoryContentResponse,
  BucketFileFullInfoResponse as FileFullInfo,
  BucketType,
  SearchEntry
}

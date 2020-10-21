import {
  FileContentResponse,
  FilesMvRequest,
  FilesPathRequest,
  FilesRmRequest,
} from "@imploy/api-client"
import React, { useCallback, useEffect, useReducer } from "react"
import { useState } from "react"
import { useImployApi } from "@imploy/common-contexts"
import dayjs from "dayjs"
import { v4 as uuidv4 } from "uuid"
import { useToaster } from "@imploy/common-components"

type DriveContextProps = {
  children: React.ReactNode | React.ReactNode[]
}

export type UploadProgress = {
  id: string
  fileName: string
  progress: number
  error: boolean
  complete: boolean
  noOfFiles: number
  path: string
}

type DriveContext = {
  // Upload file
  uploadFile(file: File, path: string): void
  // Create folder
  createFolder(body: FilesPathRequest): Promise<FileContentResponse>
  renameFile(body: FilesMvRequest): Promise<void>
  moveFile(body: FilesMvRequest): Promise<void>
  deleteFile(body: FilesRmRequest): Promise<void>
  downloadFile(fileName: string): Promise<void>
  getFileContent(fileName: string): Promise<Blob>
  list(body: FilesPathRequest): Promise<FileContentResponse[]>
  currentPath: string
  updateCurrentPath(newPath: string): void
  pathContents: IFile[]
  // uploads in progress
  uploadsInProgress: UploadProgress[]
  // space used by user in bytes
  spaceUsed: number
}

interface IFile extends FileContentResponse {
  date_uploaded: number // This can be removed when date is added to the schema
}

const REMOVE_UPLOAD_PROGRESS_DELAY = 5000

const DriveContext = React.createContext<DriveContext | undefined>(undefined)

const DriveProvider = ({ children }: DriveContextProps) => {
  const { imployApiClient, isLoggedIn } = useImployApi()
  const { addToastMessage } = useToaster()

  const currentPathReducer = (
    currentPath: string,
    action:
      | { type: "add"; payload: string }
      | { type: "refreshOnSamePath"; payload: string },
  ): string => {
    switch (action.type) {
      case "add": {
        return action.payload
      }
      case "refreshOnSamePath": {
        // check user has not navigated to other folder
        // using then catch as awaits won't working in reducer
        if (action.payload === currentPath) {
          imployApiClient
            ?.getCSFChildList({ path: currentPath })
            .then((newContents) => {
              setPathContents(
                // Remove this when the API returns dates
                newContents?.map((fcr) => ({
                  ...fcr,
                  date_uploaded: dayjs().subtract(2, "hour").unix() * 1000,
                })),
              )
            })
            .catch()
        }
        return currentPath
      }
      default:
        return currentPath
    }
  }
  const [currentPath, dispatchCurrentPath] = useReducer(currentPathReducer, "/")

  const [pathContents, setPathContents] = useState<IFile[]>([])
  const [spaceUsed, setSpaceUsed] = useState(0)

  const refreshContents = useCallback(async () => {
    try {
      const newContents = await imployApiClient?.getCSFChildList({
        path: currentPath,
      })

      if (newContents) {
        // Remove this when the API returns dates
        setPathContents(
          newContents?.map((fcr) => ({
            ...fcr,
            date_uploaded: dayjs().subtract(2, "hour").unix() * 1000,
          })),
        )
      }
    } catch (error) {}
  }, [imployApiClient, currentPath])

  const setCurrentPath = (newPath: string) =>
    dispatchCurrentPath({ type: "add", payload: newPath })

  useEffect(() => {
    if (isLoggedIn) {
      refreshContents()
    }
  }, [imployApiClient, refreshContents, currentPath, isLoggedIn])

  useEffect(() => {
    if (isLoggedIn) {
      const getSpaceUsage = async () => {
        try {
          const { csf_size } = await imployApiClient.getCSFFilesStoreInfo()
          setSpaceUsed(csf_size)
        } catch (error) {}
      }
      getSpaceUsage()
    }
  }, [imployApiClient, pathContents, isLoggedIn])

  function uploadsInProgressReducer(
    uploadsInProgress: UploadProgress[],
    action:
      | { type: "add"; payload: UploadProgress }
      | { type: "progress"; payload: { id: string; progress: number } }
      | { type: "complete"; payload: { id: string } }
      | { type: "error"; payload: { id: string } }
      | { type: "remove"; payload: { id: string } },
  ): UploadProgress[] {
    const getProgressIndex = () =>
      uploadsInProgress.findIndex(
        (progress) => progress.id === action.payload.id,
      )
    switch (action.type) {
      case "add": {
        return [...uploadsInProgress, action.payload]
      }
      case "progress": {
        const progressIndex = getProgressIndex()
        if (progressIndex > -1) {
          uploadsInProgress[progressIndex].progress = action.payload.progress
          return [...uploadsInProgress]
        } else {
          return uploadsInProgress
        }
      }
      case "complete": {
        const progressIndex = getProgressIndex()
        if (progressIndex > -1) {
          uploadsInProgress[progressIndex].complete = true
          return [...uploadsInProgress]
        } else {
          return uploadsInProgress
        }
      }
      case "error": {
        const progressIndex = getProgressIndex()
        if (progressIndex > -1) {
          uploadsInProgress[progressIndex].error = true
          return [...uploadsInProgress]
        } else {
          return uploadsInProgress
        }
      }
      case "remove": {
        const progressIndex = getProgressIndex()
        if (progressIndex > -1) {
          uploadsInProgress.splice(progressIndex, 1)
          return [...uploadsInProgress]
        } else {
          return uploadsInProgress
        }
      }
      default:
        return uploadsInProgress
    }
  }

  const [uploadsInProgress, dispatchUploadsInProgress] = useReducer(
    uploadsInProgressReducer,
    [],
  )

  const uploadFile = async (file: File, path: string) => {
    const startUploadFile = async () => {
      const id = uuidv4()
      const uploadProgress: UploadProgress = {
        id,
        fileName: file.name,
        complete: false,
        error: false,
        noOfFiles: 1,
        progress: 0,
        path,
      }
      dispatchUploadsInProgress({ type: "add", payload: uploadProgress })
      try {
        const fileParam = {
          data: file,
          fileName: file.name,
        }
        // API call

        const result = await imployApiClient.addCSFFiles(
          fileParam,
          path,
          undefined,
          (progressEvent: { loaded: number; total: number }) => {
            dispatchUploadsInProgress({
              type: "progress",
              payload: {
                id,
                progress: Math.ceil(
                  (progressEvent.loaded / progressEvent.total) * 100,
                ),
              },
            })
          },
        )

        // refresh contents
        // using reducer because user may navigate to other paths
        // need to check currentPath and upload path is same
        dispatchCurrentPath({ type: "refreshOnSamePath", payload: path })

        // setting complete
        dispatchUploadsInProgress({ type: "complete", payload: { id } })
        setTimeout(() => {
          dispatchUploadsInProgress({ type: "remove", payload: { id } })
        }, REMOVE_UPLOAD_PROGRESS_DELAY)

        return result
      } catch (error) {
        // setting error
        dispatchUploadsInProgress({ type: "error", payload: { id } })
        setTimeout(() => {
          dispatchUploadsInProgress({ type: "remove", payload: { id } })
        }, REMOVE_UPLOAD_PROGRESS_DELAY)
      }
    }
    startUploadFile()
  }

  const createFolder = async (body: FilesPathRequest) => {
    try {
      const result = await imployApiClient.addCSFDirectory(body)
      await refreshContents()
      addToastMessage({
        message: "Folder created successfully",
        appearance: "success",
      })
      return result
    } catch (error) {
      addToastMessage({
        message: "There was an error creating this folder",
        appearance: "error",
      })
      return Promise.reject()
    }
  }

  const renameFile = async (body: FilesMvRequest) => {
    try {
      await imployApiClient.moveCSFObject(body)
      await refreshContents()
      addToastMessage({
        message: "File renamed successfully",
        appearance: "success",
      })
      return Promise.resolve()
    } catch (error) {
      addToastMessage({
        message: "There was an error renaming this file",
        appearance: "error",
      })
      return Promise.reject()
    }
  }

  const moveFile = async (body: FilesMvRequest) => {
    try {
      await imployApiClient.moveCSFObject(body)
      await refreshContents()
      addToastMessage({
        message: "File moved successfully",
        appearance: "success",
      })
      return Promise.resolve()
    } catch (error) {
      addToastMessage({
        message: "There was an error moving this file",
        appearance: "error",
      })
      return Promise.reject()
    }
  }

  const deleteFile = async (body: FilesRmRequest) => {
    try {
      await imployApiClient.removeCSFObjects(body)
      await refreshContents()
      addToastMessage({
        message: "File deleted successfully",
        appearance: "success",
      })
      return Promise.resolve()
    } catch (error) {
      addToastMessage({
        message: "There was an error deleting this file",
        appearance: "error",
      })
      return Promise.reject()
    }
  }

  const getFileContent = async (fileName: string) => {
    try {
      //TODO: Fix the response of this method
      const result = await imployApiClient.getFileContent({
        path: currentPath + fileName,
      })
      //@ts-ignore
      return new Blob([result])
    } catch (error) {
      return Promise.reject()
    }
  }

  const downloadFile = async (fileName: string) => {
    addToastMessage({
      message: "Preparing your download",
      appearance: "info",
    })
    try {
      const result = await getFileContent(fileName)
      const link = document.createElement("a")
      link.href = window.URL.createObjectURL(result)
      link.download = fileName
      link.click()
      addToastMessage({
        message: "Download is ready",
        appearance: "info",
      })
      return Promise.resolve()
    } catch (error) {
      addToastMessage({
        message: "There was an error downloading this file",
        appearance: "error",
      })
      return Promise.reject()
    }
  }

  const list = async (body: FilesPathRequest) => {
    try {
      return imployApiClient.getCSFChildList(body)
    } catch (error) {
      return Promise.reject()
    }
  }

  return (
    <DriveContext.Provider
      value={{
        uploadFile,
        createFolder,
        renameFile,
        moveFile,
        deleteFile,
        downloadFile,
        getFileContent: getFileContent,
        list,
        currentPath,
        updateCurrentPath: (newPath: string) =>
          newPath.endsWith("/")
            ? setCurrentPath(`${newPath}`)
            : setCurrentPath(`${newPath}/`),
        pathContents,
        uploadsInProgress,
        spaceUsed,
      }}
    >
      {children}
    </DriveContext.Provider>
  )
}

const useDrive = () => {
  const context = React.useContext(DriveContext)
  if (context === undefined) {
    throw new Error("useDrive must be used within a DriveProvider")
  }
  return context
}

export { DriveProvider, useDrive }
export type { IFile }

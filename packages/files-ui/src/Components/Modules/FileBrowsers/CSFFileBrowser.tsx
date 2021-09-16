import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Crumb, useToasts, useHistory, useLocation } from "@chainsafe/common-components"
import { useFiles, FileSystemItem } from "../../../Contexts/FilesContext"
import {
  getArrayOfPaths,
  getURISafePathFromArray,
  getPathWithFile,
  extractFileBrowserPathFromURL,
  getUrlSafePathWithFile
} from "../../../Utils/pathUtils"
import { IBulkOperations, IFileBrowserModuleProps, IFilesTableBrowserProps } from "./types"
import FilesList from "./views/FilesList"
import { CONTENT_TYPES } from "../../../Utils/Constants"
import DragAndDrop from "../../../Contexts/DnDContext"
import { t } from "@lingui/macro"
import { ROUTE_LINKS } from "../../FilesRoutes"
import dayjs from "dayjs"
import { useFilesApi } from "../../../Contexts/FilesApiContext"
import { useUser } from "../../../Contexts/UserContext"
import { useLocalStorage } from "@chainsafe/browser-storage-hooks"
import { DISMISSED_SURVEY_KEY } from "../../SurveyBanner"
import { FileBrowserContext } from "../../../Contexts/FileBrowserContext"
import { parseFileContentResponse } from "../../../Utils/Helpers"
import getFilesFromDataTransferItems from "../../../Utils/getFilesFromDataTransferItems"

const CSFFileBrowser: React.FC<IFileBrowserModuleProps> = () => {
  const { downloadFile, uploadFiles, buckets } = useFiles()
  const { filesApiClient } = useFilesApi()
  const { addToast } = useToasts()
  const [loadingCurrentPath, setLoadingCurrentPath] = useState(false)
  const [pathContents, setPathContents] = useState<FileSystemItem[]>([])
  const { redirect } = useHistory()
  const { pathname } = useLocation()
  const currentPath = useMemo(() => extractFileBrowserPathFromURL(pathname, ROUTE_LINKS.Drive("")), [pathname])
  const bucket = useMemo(() => buckets.find(b => b.type === "csf"), [buckets])

  const refreshContents = useCallback((showLoading?: boolean) => {
    if (!bucket) return
    showLoading && setLoadingCurrentPath(true)
    filesApiClient.getBucketObjectChildrenList(bucket.id, { path: currentPath })
      .then((newContents) => {
        showLoading && setLoadingCurrentPath(false)

        setPathContents(
          newContents.map((fcr) => parseFileContentResponse(fcr))
        )
      }).catch(error => {
        console.error(error)
      }).finally(() => showLoading && setLoadingCurrentPath(false))
  }, [bucket, filesApiClient, currentPath])

  const { localStorageGet, localStorageSet } = useLocalStorage()
  const { profile } = useUser()

  const showSurvey = localStorageGet(DISMISSED_SURVEY_KEY) === "false"

  const olderThanOneWeek = useMemo(
    () => profile?.createdAt
      ? dayjs(Date.now()).diff(profile.createdAt, "day") > 7
      : false
    , [profile]
  )

  useEffect(() => {
    const dismissedFlag = localStorageGet(DISMISSED_SURVEY_KEY)
    if (dismissedFlag === undefined || dismissedFlag === null) {
      localStorageSet(DISMISSED_SURVEY_KEY, "false")
    }
  }, [localStorageGet, localStorageSet])

  useEffect(() => {
    refreshContents(true)
  }, [bucket, refreshContents])

  const moveItemsToBin = useCallback(async (cids: string[], hideToast?: boolean) => {
    if (!bucket) return
    await Promise.all(
      cids.map(async (cid: string) => {
        const itemToDelete = pathContents.find((i) => i.cid === cid)
        if (!itemToDelete) {
          console.error("No item found to move to the trash")
          return
        }

        try {
          await filesApiClient.moveBucketObjects(bucket.id, {
            paths: [getPathWithFile(currentPath, itemToDelete.name)],
            new_path: getPathWithFile("/", itemToDelete.name),
            destination: buckets.find(b => b.type === "trash")?.id
          })
          if (!hideToast) {
            const message = `${
              itemToDelete.isFolder ? t`Folder` : t`File`
            } ${t`deleted successfully`}`
            const id = addToast({
              title: message,
              type: "success"
            })
            console.log(id)
          }
          return Promise.resolve()
        } catch (error) {
          const message = `${t`There was an error deleting this`} ${
            itemToDelete.isFolder ? t`folder` : t`file`
          }`
          addToast({
            title: message,
            type: "error"
          })
          return Promise.reject()
        }}
      )).finally(refreshContents)
  }, [addToast, currentPath, pathContents, refreshContents, filesApiClient, bucket, buckets])

  // Rename
  const renameItem = useCallback(async (cid: string, newName: string) => {
    const itemToRename = pathContents.find(i => i.cid === cid)
    if (!bucket || !itemToRename) return

    filesApiClient.moveBucketObjects(bucket.id, {
      paths: [getPathWithFile(currentPath, itemToRename.name)],
      new_path: getPathWithFile(currentPath, newName) })
      .then(() => refreshContents())
      .catch(console.error)
  }, [refreshContents, filesApiClient, bucket, currentPath, pathContents])

  const moveItems = useCallback(async (cids: string[], newPath: string) => {
    if (!bucket) return
    await Promise.all(
      cids.map(async (cid: string) => {
        const itemToMove = pathContents.find((i) => i.cid === cid)
        if (!itemToMove) return
        try {
          await filesApiClient.moveBucketObjects(bucket.id, {
            paths: [getPathWithFile(currentPath, itemToMove.name)],
            new_path: getPathWithFile(newPath, itemToMove.name)
          })
          const message = `${
            itemToMove.isFolder ? t`Folder` : t`File`
          } ${t`moved successfully`}`

          addToast({
            title: message,
            type: "success"
          })
        } catch (error) {
          const message = `${t`There was an error moving this`} ${
            itemToMove.isFolder ? t`folder` : t`file`
          }`
          addToast({
            title: message,
            type: "error"
          })
        }
      })).finally(refreshContents)
  }, [addToast, pathContents, refreshContents, filesApiClient, bucket, currentPath])

  const handleDownload = useCallback(async (cid: string) => {
    const itemToDownload = pathContents.find(item => item.cid === cid)
    if (!itemToDownload || !bucket) return

    downloadFile(bucket.id, itemToDownload, currentPath)
  }, [pathContents, downloadFile, currentPath, bucket])

  // Breadcrumbs/paths
  const arrayOfPaths = useMemo(() => getArrayOfPaths(currentPath), [currentPath])
  const crumbs: Crumb[] = useMemo(() => arrayOfPaths.map((path, index) => ({
    text: decodeURIComponent(path),
    onClick: () => {
      redirect(
        ROUTE_LINKS.Drive(getURISafePathFromArray(arrayOfPaths.slice(0, index + 1)))
      )
    }
  })), [arrayOfPaths, redirect])

  const handleUploadOnDrop = useCallback(async (files: File[], fileItems: DataTransferItemList, path: string) => {
    if (!bucket) return
    const flattenedFiles = await getFilesFromDataTransferItems(fileItems)
    const paths = [...new Set(flattenedFiles.map(f => f.filepath))]
    paths.forEach(p => {
      uploadFiles(bucket, flattenedFiles.filter(f => f.filepath === p), getPathWithFile(path, p))
    })
  }, [uploadFiles, bucket])

  const viewFolder = useCallback((cid: string) => {
    const fileSystemItem = pathContents.find(f => f.cid === cid)
    if (fileSystemItem && fileSystemItem.content_type === CONTENT_TYPES.Directory) {
      redirect(ROUTE_LINKS.Drive(getUrlSafePathWithFile(currentPath, fileSystemItem.name)))
    }
  }, [currentPath, pathContents, redirect])

  const bulkOperations: IBulkOperations = useMemo(() => ({
    [CONTENT_TYPES.Directory]: ["download", "move", "delete"],
    [CONTENT_TYPES.File]: ["download", "delete", "move"]
  }), [])

  const itemOperations: IFilesTableBrowserProps["itemOperations"] = useMemo(() => ({
    [CONTENT_TYPES.Audio]: ["preview"],
    [CONTENT_TYPES.MP4]: ["preview"],
    [CONTENT_TYPES.Image]: ["preview"],
    [CONTENT_TYPES.Pdf]: ["preview"],
    [CONTENT_TYPES.Text]: ["preview"],
    [CONTENT_TYPES.File]: ["download", "info", "rename", "move", "delete", "share"],
    [CONTENT_TYPES.Directory]: ["download", "rename", "move", "delete"]
  }), [])

  return (
    <FileBrowserContext.Provider value={{
      bucket,
      bulkOperations,
      crumbs,
      moduleRootPath: ROUTE_LINKS.Drive("/"),
      currentPath,
      refreshContents,
      deleteItems: moveItemsToBin,
      downloadFile: handleDownload,
      moveItems,
      renameItem: renameItem,
      viewFolder,
      handleUploadOnDrop,
      loadingCurrentPath,
      showUploadsInTable: true,
      sourceFiles: pathContents,
      heading: t`My Files`,
      controls: true,
      allowDropUpload: true,
      itemOperations,
      withSurvey: showSurvey && olderThanOneWeek
    }}>
      <DragAndDrop>
        <FilesList />
      </DragAndDrop>
    </FileBrowserContext.Provider>
  )
}

export default CSFFileBrowser

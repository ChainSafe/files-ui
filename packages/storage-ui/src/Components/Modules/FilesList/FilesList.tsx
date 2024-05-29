import { createStyles, makeStyles, useThemeSwitcher } from "@chainsafe/common-theme"
import React, { useCallback, useEffect, useRef } from "react"
import {
  MenuDropdown,
  PlusIcon,
  SortDirection,
  Table,
  TableBody,
  TableHead,
  TableHeadCell,
  TableRow,
  Typography,
  Breadcrumb,
  Button,
  PlusCircleIcon,
  UploadIcon,
  Dialog,
  Loading,
  CheckboxInput,
  useHistory,
  GridIcon,
  TableIcon,
  IMenuItem,
  HomeIcon
} from "@chainsafe/common-components"
import { useState } from "react"
import { useMemo } from "react"
import EmptySvg from "../../../Media/Empty.svg"
import clsx from "clsx"
import { plural, t, Trans } from "@lingui/macro"
import { NativeTypes } from "react-dnd-html5-backend"
import { useDrop } from "react-dnd"
import { BrowserView, FileOperation, MoveModalMode } from "../../../Contexts/types"
import { FileSystemItem as FileSystemItemType } from "../../../Contexts/StorageContext"
import FileSystemItem from "../FileSystemItem/FileSystemItem"
import CreateFolderModal from "../CreateFolderModal/CreateFolderModal"
import UploadFileModal from "../UploadFileModal/UploadFileModal"
import MoveFileModal from "../MoveFileModal/MoveFileModal"
import { CONTENT_TYPES } from "../../../Utils/Constants"
import { CSSTheme } from "../../../Themes/types"
import MimeMatcher from "../../../Utils/MimeMatcher"
import { useLanguageContext } from "../../../Contexts/LanguageContext"
import { ISelectedFile, useFileBrowser } from "../../../Contexts/FileBrowserContext"
import SurveyBanner from "../SurveyBanner"
import { useStorageApi } from "../../../Contexts/StorageApiContext"
import RestrictedModeBanner from "../../Elements/RestrictedModeBanner"
import BlacklistedModeBanner from "../../Elements/BlacklistedModeBanner"
import { DragPreviewLayer } from "./DragPreviewLayer"
import FolderBreadcrumb from "./FolderBreadcrumb"
import { DragTypes } from "./DragConstants"
import { getPathWithFile } from "../../../Utils/pathUtils"
import { getItemMenuOptions } from "../FileSystemItem/itemOperations"
import AnchorMenu, { AnchorMenuPosition } from "../../UI-components/AnchorMenu"

interface IStyleProps {
  themeKey: string
}

export const desktopGridSettings = "50px 69px minmax(250px, 3fr) minmax(150px, 450px) 100px 45px !important"
export const mobileGridSettings = "69px 3fr 45px !important"

const useStyles = makeStyles(
  ({ animation, breakpoints, constants, palette, zIndex }: CSSTheme) => {

    return createStyles({
      root: {
        position: "relative",
        [breakpoints.down("md")]: {
          marginLeft: constants.generalUnit * 2,
          marginRight: constants.generalUnit * 2
        },
        [breakpoints.up("md")]: {
          border: "1px solid transparent",
          padding: `0 ${constants.generalUnit}px`,
          borderRadius: constants.generalUnit / 4,
          minHeight: `calc(100vh - ${Number(constants.contentTopPadding)}px)`,
          "&.droppable": {
            borderColor: palette.primary.main
          },
          "&.bottomBanner": {
            minHeight: `calc(100vh - ${Number(constants.contentTopPadding) + Number(constants.bottomBannerHeight)}px)`,
            paddingBottom: constants.bottomBannerHeight
          }
        }
      },
      header: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        [breakpoints.down("md")]: {
          marginTop: constants.generalUnit
        }
      },
      controls: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        "& > button": {
          marginLeft: constants.generalUnit
        }
      },
      breadCrumbContainer: {
        margin: `${constants.generalUnit * 2}px 0`,
        height: 22,
        [breakpoints.down("md")]: {
          marginTop: constants.generalUnit * 3,
          marginBottom: 0
        }
      },
      divider: {
        "&:before, &:after": {
          backgroundColor: palette.additional["gray"][4]
        },
        [breakpoints.up("md")]: {
          marginTop: constants.generalUnit * 3,
          marginBottom: 0
        },
        [breakpoints.down("md")]: {
          margin: `${constants.generalUnit * 3}px 0 0`
        }
      },
      noFiles: ({ themeKey }: IStyleProps) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "25vh",
        color: constants.filesTable.color,
        "& svg": {
          maxWidth: 180,
          marginBottom: constants.generalUnit * 3,
          "& path": {
            "&:first-child": {
              fill: themeKey === "dark" ? palette.additional.gray[2] : ""
            },
            "&:nth-child(2)": {
              stroke: themeKey === "dark" ? palette.additional.gray[2] : "",
              fill: themeKey === "dark" ? "transparent" : ""
            },
            "&:last-child": {
              fill: themeKey === "dark" ? palette.additional.gray[4] : "",
              stroke: themeKey === "dark" ? palette.additional.gray[2] : ""
            }
          }
        }
      }),
      tableRow: {
        border: "2px solid transparent",
        transitionDuration: `${animation.transform}ms`,
        [breakpoints.up("md")]: {
          gridTemplateColumns: desktopGridSettings
        },
        [breakpoints.down("md")]: {
          gridTemplateColumns: mobileGridSettings
        }
      },
      fileIcon: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        "& svg": {
          width: constants.generalUnit * 2.5
        }
      },
      progressIcon: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
      },
      dropdownIcon: {
        "& svg": {
          height: 20,
          width: 20
        }
      },
      dropdownOptions: {
        "& > *": {
          padding: 0
        }
      },
      mobileButton: {
        padding: `${constants.generalUnit * 2}px !important`,
        borderRadius: 0,
        justifyContent: "flex-start",
        "& > *:last-child": {
          display: "block",
          width: "calc(100% - 24px)",
          textAlign: "center"
        }
      },
      dropNotification: {
        display: "block",
        position: "fixed",
        zIndex: zIndex?.layer4,
        bottom: 0,
        transform: "translateX(-50%)",
        backgroundColor: palette.common.black.main,
        color: constants.filesTable.uploadText,
        opacity: 0,
        visibility: "hidden",
        transitionDuration: `${animation.transform}ms`,
        textAlign: "center",
        width: 260,
        padding: `${constants.generalUnit}px 0`,
        [breakpoints.up("md")]: {
          left: `calc(50% + ${Number(constants.navWidth) / 2}px)`
        },
        "&.active": {
          opacity: 1,
          visibility: "visible"
        }
      },
      loadingContainer: {
        position: "absolute",
        width: "100%",
        paddingTop: constants.generalUnit * 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: 0,
        visibility: "hidden",
        transition: `opacity ${animation.transform * 3}ms`,
        "& svg": {
          marginBottom: constants.generalUnit * 2
        }
      },
      showLoadingContainer: {
        visibility: "visible",
        opacity: 1
      },
      fadeOutLoading: {
        opacity: 0.2,
        transition: `opacity ${animation.transform * 3}ms`
      },
      bulkOperations: {
        display: "flex",
        flexDirection: "row",
        position: "sticky",
        top: "80px",
        backgroundColor: palette.additional["gray"][1],
        zIndex: zIndex?.layer0,
        minHeight: constants.generalUnit * 5 + 34,
        alignItems: "center",
        "& > *": {
          marginRight: constants.generalUnit
        }
      },
      confirmDeletionDialog: {
        top: "50%"
      },
      gridRoot: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
        gridColumnGap: constants.generalUnit * 2,
        gridRowGap: constants.generalUnit * 2,
        marginBottom: constants.generalUnit * 4,
        marginTop: constants.generalUnit * 4,
        [breakpoints.down("lg")]: {
          gridTemplateColumns: "1fr 1fr 1fr 1fr"
        },
        [breakpoints.down("md")]: {
          margin: `${constants.generalUnit * 4}px 0`
        },
        [breakpoints.down("sm")]: {
          gridTemplateColumns: "1fr 1fr",
          margin: `${constants.generalUnit * 2}px 0`
        }
      },
      viewToggleButton: {
        border: "none",
        "& svg": {
          marginTop: "2px",
          width: "20px",
          height: "20px"
        }
      },
      encryptionNotificationRoot: {
        backgroundColor: palette.additional["gray"][9],
        padding: constants.generalUnit,
        paddingLeft: constants.generalUnit * 2,
        marginTop: constants.generalUnit,
        borderRadius: 2,
        display: "flex"
      },
      banner: {
        color: "#FFFF00",
        fontWeight: 600,
        paddingRight: constants.generalUnit
      },
      fileNameHeader: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        marginRight: constants.generalUnit * 2
      },
      buttonWrap: {
        whiteSpace: "nowrap"
      },
      tableHead: {
        position: "sticky",
        top: constants.generalUnit * 5 + 34 + 80,
        zIndex: zIndex?.layer0,
        [breakpoints.down("md")]: {
          top: 50
        }
      },
      menuIcon: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: 20,
        marginRight: constants.generalUnit * 1.5,
        "& svg": {
          fill: constants.fileSystemItemRow.menuIcon
        }
      }
    })
  }
)

// Sorting
const sortFoldersFirst = (a: FileSystemItemType, b: FileSystemItemType) =>
  a.isFolder && a.content_type !== b.content_type ? -1 : 1

const FilesList = () => {
  const { themeKey, desktop } = useThemeSwitcher()
  const { accountRestricted, accountBlacklisted } = useStorageApi()
  const {
    heading,
    controls = true,
    sourceFiles,
    handleUploadOnDrop,
    bulkOperations,
    crumbs,
    renameItem: handleRename,
    deleteItems,
    viewFolder,
    moveItems,
    downloadFile,
    currentPath,
    refreshContents,
    loadingCurrentPath,
    allowDropUpload,
    itemOperations,
    moduleRootPath,
    withSurvey
  } = useFileBrowser()
  const classes = useStyles({ themeKey })
  const [editingFile, setEditingFile] = useState<ISelectedFile | undefined>()
  const [direction, setDirection] = useState<SortDirection>("ascend")
  const [column, setColumn] = useState<"name" | "size" | "date_uploaded">("name")
  const [selectedCids, setSelectedCids] = useState<ISelectedFile[]>([])
  const [, setPreviewFileIndex] = useState<number | undefined>()
  const { selectedLocale } = useLanguageContext()
  const { redirect } = useHistory()
  const [isSurveyBannerVisible, setIsSurveyBannerVisible] = useState(true)
  const [contextMenuPosition, setContextMenuPosition] = useState<AnchorMenuPosition | null>(null)

  console.log(accountBlacklisted)

  const items: FileSystemItemType[] = useMemo(() => {
    let temp = []

    switch (column) {
      default: {
      // case "name": {
        temp = sourceFiles.sort((a, b) => {
          return a.name.localeCompare(b.name, selectedLocale, {
            sensitivity: "base"
          })
        })
        break
      }
      case "size": {
        temp = sourceFiles
          .sort((a, b) => (a.size < b.size ? -1 : 1))
          .sort(sortFoldersFirst)
        break
      }
      case "date_uploaded": {
        temp = sourceFiles
          .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
          .sort(sortFoldersFirst)
        break
      }
    }
    return direction === "descend"
      ? temp.reverse().sort(sortFoldersFirst)
      : temp.sort(sortFoldersFirst)
  }, [sourceFiles, direction, column, selectedLocale])

  const files = useMemo(() => items.filter((i) => !i.isFolder), [items])

  const selectedItems = useMemo(
    () => items.filter((file) => selectedCids.findIndex(item => item.name === file.name && item.cid === file.cid) >= 0),
    [selectedCids, items]
  )

  const handleSortToggle = (
    targetColumn: "name" | "size" | "date_uploaded"
  ) => {
    if (column !== targetColumn) {
      setColumn(targetColumn)
      setDirection("descend")
    } else {
      if (direction === "ascend") {
        setDirection("descend")
      } else {
        setDirection("ascend")
      }
    }
  }

  const onHideSurveyBanner = useCallback(() => {
    setIsSurveyBannerVisible(false)
  }, [setIsSurveyBannerVisible])

  // Selection logic
  const handleSelectCid = useCallback(
    (toSelect: ISelectedFile) => {
      setSelectedCids([toSelect])
    },
    []
  )

  const handleAddToSelectedCids = useCallback(
    (toSelect: ISelectedFile) => {
      if (selectedCids.findIndex(item => item.cid === toSelect.cid && item.name === toSelect.name) >= 0) {
        setSelectedCids(
          selectedCids.filter((selected: ISelectedFile) => selected.name !== toSelect.name)
        )
      } else {
        setSelectedCids([...selectedCids, toSelect])
      }
    },
    [selectedCids]
  )

  // select item with SHIFT pressed
  const handleSelectItemWithShift = useCallback(
    (item: ISelectedFile) => {
      // item already selected
      const isItemAlreadySelected = !!selectedItems
        .find((s) => s.cid === item.cid && s.name === item.name)
      if (isItemAlreadySelected) return

      const lastIndex = selectedItems.length
        ? items.findIndex((i) =>
          i.cid === selectedItems[selectedItems.length - 1].cid &&
          i.name === selectedItems[selectedItems.length - 1].name
        )
        : -1

      // first item
      if (lastIndex === -1) {
        setSelectedCids([item])
        return
      }

      const currentIndex = items.findIndex((i) => i.cid === item.cid && i.name === item.name)
      // unavailable item
      if (currentIndex === -1) return

      // new item, with selected items 
      let countIndex = lastIndex
      let mySelectedItems = selectedItems
      while (
        (currentIndex > lastIndex && countIndex <= currentIndex) ||
         (currentIndex < lastIndex && countIndex >= currentIndex)
      ) {
        // filter out if item already selected
        const currentCID = items[countIndex].cid
        const currentName = items[countIndex].name
        mySelectedItems = mySelectedItems.filter((s) => s.cid !== currentCID || s.name !== currentName)
        mySelectedItems.push(items[countIndex])
        if (currentIndex > lastIndex) countIndex++
        else countIndex--
      }
      // add the current item
      setSelectedCids([...mySelectedItems])
    },
    [selectedItems, items]
  )

  const toggleAll = useCallback(() => {
    if (selectedCids.length === items.length) {
      setSelectedCids([])
    } else {
      setSelectedCids([...items.map((file: FileSystemItemType) => ({
        name: file.name,
        cid: file.cid
      }))])
    }
  }, [setSelectedCids, items, selectedCids])

  const [{ isOverUploadable, isOverBrowser }, dropBrowserRef] = useDrop({
    accept: [NativeTypes.FILE],
    drop: (item: any, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        handleUploadOnDrop &&
          currentPath &&
          handleUploadOnDrop(item.files, item.items, currentPath)
        refreshContents && refreshContents()
      }
    },
    collect: (monitor) => ({
      isOverBrowser: monitor.isOver(),
      isOverUploadable: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    })
  })

  const [{ isOverUploadHomeBreadcrumb }, dropUploadHomeBreadcrumbRef] = useDrop({
    accept: [NativeTypes.FILE],
    drop: (item: {
      files: File[]
      items:DataTransferItemList
    }) => {
      handleUploadOnDrop && handleUploadOnDrop(item.files, item.items, "/")
    },
    collect: (monitor) => ({
      isOverUploadHomeBreadcrumb: monitor.isOver()
    })
  })

  const [{ isOverMoveHomeBreadcrumb }, dropMoveHomeBreadcrumbRef] = useDrop({
    accept: DragTypes.MOVABLE_FILE,
    canDrop: () => currentPath !== "/",
    drop: (item: {selected: ISelectedFile[]}) => {
      moveItems && moveItems(item.selected, "/")
      resetSelectedCids()
    },
    collect: (monitor) => ({
      isOverMoveHomeBreadcrumb: monitor.isOver() && currentPath !== "/"
    })
  })

  const homeBreadcrumbRef  =  useRef<HTMLDivElement>(null)
  dropMoveHomeBreadcrumbRef(homeBreadcrumbRef)
  dropUploadHomeBreadcrumbRef(homeBreadcrumbRef)

  // Modals
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isMoveFileModalOpen, setIsMoveFileModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingFiles, setIsDeletingFiles] = useState(false)
  const [, setFileInfoPath] = useState<string | undefined>(undefined)
  const [moveModalMode, setMoveModalMode] = useState<MoveModalMode | undefined>()

  const [browserView, setBrowserView] = useState<BrowserView>("table")

  // Bulk operations
  const [validBulkOps, setValidBulkOps] = useState<FileOperation[]>([])

  useEffect(() => {
    if (bulkOperations) {
      let filteredList: FileOperation[] = [
        "delete",
        "download",
        "info",
        "move",
        "preview",
        "rename",
        "share",
        "recover"
      ]
      for (let i = 0; i < selectedCids.length; i++) {
        const contentType = items.find((item) => item.cid === selectedCids[i].cid && item.name === selectedCids[i].name)
          ?.content_type

        if (contentType) {
          if (contentType === CONTENT_TYPES.Directory) {
            const validList = filteredList.filter(
              (op: FileOperation) =>
                bulkOperations[contentType].indexOf(op) >= 0
            )
            if (validList.length > 0) {
              filteredList = filteredList.filter(
                (existingOp: FileOperation) =>
                  validList.indexOf(existingOp) >= 0
              )
            }
          } else {
            const validList = filteredList.filter(
              (op: FileOperation) =>
                bulkOperations[CONTENT_TYPES.File].indexOf(op) >= 0
            )
            if (validList.length > 0) {
              filteredList = filteredList.filter(
                (existingOp: FileOperation) =>
                  validList.indexOf(existingOp) >= 0
              )
            }
          }
        } else {
          const validList = filteredList.filter(
            (op: FileOperation) =>
              bulkOperations[CONTENT_TYPES.File].indexOf(op) >= 0
          )
          if (validList.length > 0) {
            filteredList = filteredList.filter(
              (existingOp: FileOperation) => validList.indexOf(existingOp) >= 0
            )
          }
        }
      }
      setValidBulkOps(filteredList)
    }
  }, [selectedCids, items, bulkOperations])

  const handleDeleteFiles = useCallback(() => {
    if (!deleteItems) return

    setIsDeletingFiles(true)
    deleteItems(selectedCids)
      .catch(console.error)
      .finally(() => {
        setIsDeletingFiles(false)
        setSelectedCids([])
        setIsDeleteModalOpen(false)
      })
  }, [deleteItems, selectedCids])

  const getItemOperations = useCallback(
    (contentType: string) => {
      if (!itemOperations) return []
      const result = Object.keys(itemOperations).reduce(
        (acc: FileOperation[], item: string) => {
          const matcher = new MimeMatcher(item)
          // Prevent Files options from being added to Directory options
          if (
            !(
              contentType === CONTENT_TYPES.Directory &&
              item === CONTENT_TYPES.File
            ) &&
            matcher.match(contentType)
          ) {
            acc.push(...itemOperations[item])
          }
          return acc
        },
        []
      )
      return [...new Set(result)]
    },
    [itemOperations]
  )

  const resetSelectedCids = useCallback(() => {
    setSelectedCids([])
  }, [])

  useEffect(() => {
    setSelectedCids([])
  }, [currentPath])

  const handleViewFolder = useCallback((toView: ISelectedFile) => {
    viewFolder && viewFolder(toView)
  }, [viewFolder])

  const onDeleteFile = useCallback((toDelete: ISelectedFile) => {
    setSelectedCids([toDelete])
    setIsDeleteModalOpen(true)
  }, [])

  const onMoveFile = useCallback((toMove: ISelectedFile) => {
    setSelectedCids([toMove])
    setIsMoveFileModalOpen(true)
    setMoveModalMode("move")
  }, [])

  const onShowFileInfo = useCallback((item: ISelectedFile) => {
    setFileInfoPath(getPathWithFile(currentPath, item.name))
  }, [currentPath])

  const onPreviewFile = useCallback((toPreview: FileSystemItemType) => {
    setPreviewFileIndex(files.indexOf(toPreview))
  }, [files])

  const handleOpenMoveFileDialog = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMoveFileModalOpen(true)
  }, [])

  const handleOpenDeleteDialog = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDeleteModalOpen(true)
  }, [])

  const browserOptions = useMemo(() => [
    {
      contents: (
        <>
          <PlusCircleIcon className={classes.menuIcon} />
          <span>
            <Trans>New folder</Trans>
          </span>
        </>
      ),
      onClick: () => setCreateFolderModalOpen(true),
      disabled: accountRestricted
    },
    {
      contents: (
        <>
          <UploadIcon className={classes.menuIcon} />
          <span>
            <Trans>Upload</Trans>
          </span>
        </>
      ),
      onClick: () => setIsUploadModalOpen(true),
      disabled: accountRestricted
    }
  ],
  [classes.menuIcon, accountRestricted])

  const bulkActions = useMemo(() => {
    const menuOptions: IMenuItem[] = []
    validBulkOps.includes("move") &&
      menuOptions.push({
        contents: (
          <>
            <span>
              <Trans>Move</Trans>
            </span>
          </>
        ),
        onClick: (e: React.MouseEvent) => {
          handleOpenMoveFileDialog(e)
          setMoveModalMode("move")
        }
      })

    validBulkOps.includes("recover") &&
      menuOptions.push({
        contents: (
          <>
            <span>
              <Trans>Recover</Trans>
            </span>
          </>
        ),
        onClick: (e: React.MouseEvent) => {
          handleOpenMoveFileDialog(e)
          setMoveModalMode("recover")
        }
      })

    validBulkOps.includes("delete") &&
      menuOptions.push({
        contents: (
          <>
            <span>
              <Trans>Delete</Trans>
            </span>
          </>
        ),
        onClick: handleOpenDeleteDialog
      })
    return menuOptions
  }, [
    validBulkOps,
    handleOpenDeleteDialog,
    handleOpenMoveFileDialog
  ])

  const handleContextMenuOnBrowser = useCallback((e: React.MouseEvent) => {
    if (!controls) return
    e.preventDefault()
    // reset selected files if context menu was open
    setSelectedCids([])
    setContextMenuPosition({
      left: e.clientX - 2,
      top: e.clientY - 4
    })
  }, [controls])

  const handleContextMenuOnItem = useCallback((e: React.MouseEvent, item: FileSystemItemType) => {
    e.preventDefault()
    e.stopPropagation()
    // only keep current item selected if not in selected
    if (!selectedItems.includes(item)) {
      setSelectedCids([item])
    }
    setContextMenuPosition({
      left: e.clientX - 2,
      top: e.clientY - 4
    })
  }, [selectedItems])

  const itemFunctions = useMemo(() => ({
    deleteFile: onDeleteFile,
    downloadFile,
    moveFile: onMoveFile,
    viewFolder: handleViewFolder,
    showFileInfo: onShowFileInfo,
    showPreview: onPreviewFile,
    editFile: setEditingFile
  }), [
    handleViewFolder,
    onDeleteFile,
    downloadFile,
    onMoveFile,
    onShowFileInfo,
    onPreviewFile
  ])

  const contextMenuOptions: IMenuItem[] = useMemo(() => {
    if (selectedItems.length > 1) {
      // bulk operations
      return bulkActions
    } else if (selectedItems.length === 1) {
      // single item operations
      const item  = selectedItems[0]
      return getItemMenuOptions({
        file: item,
        itemOperations: getItemOperations(item.content_type),
        menuIconClass: classes.menuIcon,
        ...itemFunctions
      })
    } else {
      return browserOptions
    }
  }, [
    browserOptions,
    selectedItems,
    classes.menuIcon,
    getItemOperations,
    itemFunctions,
    bulkActions
  ])

  return (
    <>
      <article
        className={clsx(classes.root, {
          droppable: isOverUploadable && allowDropUpload
        }, {
          bottomBanner: accountRestricted
        })}
        onContextMenu={handleContextMenuOnBrowser}
        ref={!isUploadModalOpen && allowDropUpload ? dropBrowserRef : null}
      >
        <div
          className={clsx(classes.dropNotification, { active: isOverBrowser })}
        >
          <Typography
            variant="h4"
            component="p">
            <Trans>Drop to upload files</Trans>
          </Typography>
        </div>
        {contextMenuPosition && (
          <AnchorMenu
            options={contextMenuOptions}
            onClose={() => setContextMenuPosition(null)}
            anchorPosition={contextMenuPosition}
          />
        )}
        <DragPreviewLayer
          items={sourceFiles}
          previewType={browserView}
        />
        <div
          className={classes.breadCrumbContainer}
          onContextMenu={(e) => e.stopPropagation()}
        >
          {crumbs && moduleRootPath && (
            <Breadcrumb
              crumbs={crumbs.map((crumb, i) => ({
                ...crumb,
                component: (i < crumbs.length - 1)
                  ? <FolderBreadcrumb
                    folderName={crumb.text}
                    onClick={crumb.onClick}
                    handleMove={(item) => {
                      console.log(item, crumb.path)
                      moveItems && crumb.path && moveItems(item.selected, crumb.path)
                      resetSelectedCids()
                    }}
                    handleUpload={(item) => handleUploadOnDrop &&
                    crumb.path &&
                    handleUploadOnDrop(item.files, item.items, crumb.path)
                    }
                  />
                  : null
              }))}
              onRootClick={() => redirect(moduleRootPath)}
              rootRef={homeBreadcrumbRef}
              rootActive={isOverUploadHomeBreadcrumb || isOverMoveHomeBreadcrumb}
              showDropDown
              maximumCrumbs={desktop ? 5 : 3}
              rootIcon={<HomeIcon/>}
            />
          )}
        </div>
        <header
          className={classes.header}
          data-cy="header-bucket"
        >
          <Typography
            variant="h1"
            component="h1"
            className={classes.fileNameHeader}
          >
            {heading}
          </Typography>
          <div
            className={classes.controls}
            onContextMenu={(e) => e.stopPropagation()}
          >
            {controls && desktop ? (
              <>
                <Button
                  onClick={() => setCreateFolderModalOpen(true)}
                  variant="outline"
                  size="large"
                  disabled={accountRestricted}
                  testId="new-folder"
                >
                  <PlusCircleIcon />
                  <span className={classes.buttonWrap}>
                    <Trans>New folder</Trans>
                  </span>
                </Button>
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  variant="outline"
                  size="large"
                  disabled={accountRestricted}
                  testId="upload-file"
                >
                  <UploadIcon />
                  <span className={classes.buttonWrap}>
                    <Trans>Upload</Trans>
                  </span>
                </Button>
              </>
            ) : (
              controls && !desktop && (
                <>
                  <Button
                    onClick={() =>
                      setBrowserView(browserView === "grid" ? "table" : "grid")
                    }
                    variant="outline"
                    size="large"
                    className={classes.viewToggleButton}
                  >
                    {browserView === "table" ? <GridIcon /> : <TableIcon />}
                  </Button>
                  <MenuDropdown
                    classNames={{
                      icon: classes.dropdownIcon,
                      options: classes.dropdownOptions
                    }}
                    autoclose={true}
                    anchor="bottom-right"
                    animation="none"
                    indicator={PlusIcon}
                    menuItems={browserOptions}
                  />
                </>
              )
            )}
          </div>
        </header>
        <div
          className={classes.encryptionNotificationRoot}
          onContextMenu={(e) => e.stopPropagation()}
        >
          <Typography
            variant="body1"
            className={classes.banner}>
            <Trans>
            Chainsafe Storage Beta does not encrypt data. All data uploaded is publicly accessible on IPFS network.
            </Trans>
          </Typography>
        </div>
        { withSurvey && isSurveyBannerVisible &&
        <SurveyBanner onHide={onHideSurveyBanner}/>
        }
        <section className={classes.bulkOperations}>
          {selectedCids.length > 0 && (
            <>
              {validBulkOps.indexOf("move") >= 0 && (
                <Button
                  onClick={(e) => {
                    handleOpenMoveFileDialog(e)
                    setMoveModalMode("move")
                  }}
                  variant="outline"
                >
                  <Trans>Move selected</Trans>
                </Button>
              )}
              {validBulkOps.indexOf("recover") >= 0 && (
                <Button
                  onClick={(e) => {
                    handleOpenMoveFileDialog(e)
                    setMoveModalMode("recover")
                  }}
                  variant="outline"
                >
                  <Trans>Recover selected</Trans>
                </Button>
              )}
              {validBulkOps.indexOf("delete") >= 0 && (
                <Button
                  onClick={handleOpenDeleteDialog}
                  variant="outline"
                >
                  <Trans>Delete selected</Trans>
                </Button>
              )}
            </>
          )}
        </section>
        <div
          className={clsx(
            classes.loadingContainer,
            loadingCurrentPath && classes.showLoadingContainer
          )}
        >
          <Loading
            size={24}
            type="light" />
          <Typography
            variant="body2"
            component="p">
            <Trans>One sec, getting files ready...</Trans>
          </Typography>
        </div>
        {(items.length === 0) ? (
          <section
            className={clsx(
              classes.noFiles,
              loadingCurrentPath && classes.fadeOutLoading
            )}
          >
            <EmptySvg />
            <Typography
              variant="h4"
              component="h4"
            >
              <Trans>No files to show</Trans>
            </Typography>
          </section>
        ) : browserView === "table" ? (
          <Table
            fullWidth={true}
            striped={true}
            hover={true}
            className={clsx(loadingCurrentPath && classes.fadeOutLoading)}
          >
            {desktop && (
              <TableHead className={classes.tableHead}>
                <TableRow
                  type="grid"
                  className={classes.tableRow}>
                  <TableHeadCell>
                    <CheckboxInput
                      value={selectedCids.length === items.length}
                      onChange={() => toggleAll()}
                    />
                  </TableHeadCell>
                  <TableHeadCell>
                    {/* Icon */}
                  </TableHeadCell>
                  <TableHeadCell
                    sortButtons={true}
                    onSortChange={() => handleSortToggle("name")}
                    sortDirection={column === "name" ? direction : undefined}
                    sortActive={column === "name"}
                  >
                    <Trans>Name</Trans>
                  </TableHeadCell>
                  <TableHeadCell>
                    CID
                  </TableHeadCell>
                  <TableHeadCell
                    sortButtons={true}
                    align="left"
                    onSortChange={() => handleSortToggle("size")}
                    sortDirection={column === "size" ? direction : undefined}
                    sortActive={column === "size"}
                  >
                    <Trans>Size</Trans>
                  </TableHeadCell>
                  <TableHeadCell>{/* Menu */}</TableHeadCell>
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {items.map((file, index) => (
                <FileSystemItem
                  key={index}
                  index={index}
                  file={file}
                  selected={selectedCids}
                  handleSelectCid={handleSelectCid}
                  handleAddToSelectedCids={handleAddToSelectedCids}
                  handleSelectItemWithShift={handleSelectItemWithShift}
                  editingFile={editingFile}
                  handleRename={(item: ISelectedFile, newName: string) => {
                    setEditingFile(undefined)
                    return handleRename && handleRename(item, newName)
                  }}
                  itemOperations={getItemOperations(file.content_type)}
                  resetSelectedFiles={resetSelectedCids}
                  handleContextMenuOnItem={handleContextMenuOnItem}
                  {...itemFunctions}
                  browserView="table"
                />
              ))}
            </TableBody>
          </Table>
        ) : (
          <section
            className={clsx(
              classes.gridRoot,
              loadingCurrentPath && classes.fadeOutLoading
            )}
          >
            {items.map((file, index) => (
              <FileSystemItem
                key={index}
                index={index}
                file={file}
                selected={selectedCids}
                handleSelectCid={handleSelectCid}
                handleAddToSelectedCids={handleAddToSelectedCids}
                handleSelectItemWithShift={handleSelectItemWithShift}
                editingFile={editingFile}
                handleRename={(editingFile: ISelectedFile, newName: string) => {
                  setEditingFile(undefined)
                  return handleRename && handleRename(editingFile, newName)
                }}
                previewFile={onPreviewFile}
                itemOperations={getItemOperations(file.content_type)}
                resetSelectedFiles={resetSelectedCids}
                handleContextMenuOnItem={handleContextMenuOnItem}
                {...itemFunctions}
                browserView="grid"
              />
            ))}
          </section>
        )}
        {/* {files && previewFileIndex !== undefined && bucket && (
        <FilePreviewModal
          file={files[previewFileIndex]}
          closePreview={clearPreview}
          nextFile={
            previewFileIndex < files.length - 1 ? setNextPreview : undefined
          }
          previousFile={previewFileIndex > 0 ? setPreviousPreview : undefined}
          path={isSearch && getPath ? getPath(files[previewFileIndex].cid) : getPathWithFile(currentPath, files[previewFileIndex].name)}
        />
      )} */}
      </article>
      <Dialog
        active={isDeleteModalOpen}
        reject={() => setIsDeleteModalOpen(false)}
        accept={handleDeleteFiles}
        requestMessage={
          plural(selectedCids.length, {
            one: `You are about to delete ${selectedCids.length} item.`,
            other: `You are about to delete ${selectedCids.length} items.`
          })
        }
        rejectText = {t`Cancel`}
        acceptText = {t`Confirm`}
        acceptButtonProps={{ loading: isDeletingFiles, disabled: isDeletingFiles }}
        rejectButtonProps={{ disabled: isDeletingFiles }}
        injectedClass={{ inner: classes.confirmDeletionDialog }}
        onModalBodyClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        testId="file-deletion"
      />
      {
        refreshContents && (
          <>
            <CreateFolderModal
              modalOpen={createFolderModalOpen}
              close={() => setCreateFolderModalOpen(false)}
            />
            <UploadFileModal
              modalOpen={isUploadModalOpen}
              close={() => setIsUploadModalOpen(false)}
            />
            {isMoveFileModalOpen && (
              <MoveFileModal
                filesToMove={selectedItems}
                onClose={() => {
                  setIsMoveFileModalOpen(false)
                  setSelectedCids([])
                  setMoveModalMode(undefined)
                }}
                onCancel={() => {
                  setIsMoveFileModalOpen(false)
                  setMoveModalMode(undefined)
                }}
                mode={moveModalMode}
              />
            )}
          </>
        )
      }
      {accountRestricted && <RestrictedModeBanner />}
      {accountBlacklisted && <BlacklistedModeBanner />}
    </>
  )
}

export default FilesList

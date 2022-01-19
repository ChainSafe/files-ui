import { createStyles, makeStyles, useMediaQuery } from "@chainsafe/common-theme"
import React, { useState, useEffect, useCallback } from "react"
import CustomModal from "../../Elements/CustomModal"
import CustomButton from "../../Elements/CustomButton"
import { t, Trans } from "@lingui/macro"
import { DirectoryContentResponse, FileSystemItem, useFiles } from "../../../Contexts/FilesContext"
import { Button, FolderIcon, Grid, ITreeNodeProps, Loading, ScrollbarWrapper, TreeView, Typography } from "@chainsafe/common-components"
import { CSFTheme } from "../../../Themes/types"
import { useFileBrowser } from "../../../Contexts/FileBrowserContext"
import { useFilesApi } from "../../../Contexts/FilesApiContext"
import { MoveModalMode } from "./types"
import { useMemo } from "react"
import { getPathWithFile, isSubFolder } from "../../../Utils/pathUtils"


const useStyles = makeStyles(
  ({ breakpoints, constants, palette, typography, zIndex }: CSFTheme) => {
    return createStyles({
      modalRoot: {
        zIndex: zIndex?.blocker,
        [breakpoints.down("md")]: {
          paddingBottom: Number(constants?.mobileButtonHeight)
        }
      },
      modalInner: {
        backgroundColor: constants.moveFileModal.background,
        color: constants.moveFileModal.color,
        [breakpoints.down("md")]: {
          maxWidth: `${breakpoints.width("md")}px !important`
        }
      },
      okButton: {
        marginLeft: constants.generalUnit
      },
      heading: {
        fontWeight: typography.fontWeight.semibold,
        textAlign: "left",
        [breakpoints.down("md")]: {
          textAlign: "center"
        }
      },
      treeContainer: {
        padding: `${constants.generalUnit * 4}px 0`,
        borderTop: `1px solid ${palette.additional["gray"][5]}`,
        borderBottom: `1px solid ${palette.additional["gray"][5]}`
      },
      treeScrollView: {
        paddingLeft: constants.generalUnit * 4
      },
      paddedContainer: {
        padding: `${constants.generalUnit * 2}px ${
          constants.generalUnit * 3
        }px`
      }
    })
  }
)

interface IMoveFileModuleProps {
  filesToMove: FileSystemItem[]
  onClose: () => void
  onCancel: () => void
  mode?: MoveModalMode
}

const MoveFileModule = ({ filesToMove, onClose, onCancel, mode }: IMoveFileModuleProps) => {
  const classes = useStyles()
  const { filesApiClient } = useFilesApi()
  const { buckets } = useFiles()
  const { bucket, moveItems, recoverItems, currentPath } = useFileBrowser()
  const [isMovingFile, setIsMovingFile] = useState(false)
  const [movePath, setMovePath] = useState<undefined | string>(undefined)
  const [folderTree, setFolderTree] = useState<ITreeNodeProps[]>([])
  const { type } = bucket || {}
  const isInBin = useMemo(() => type === "trash" && mode === "recover", [type, mode])
  const [isLoading, setIsLoading] = useState(true)
  const desktop = useMediaQuery("md")
  const folders = useMemo(() =>
    filesToMove.filter((f) => f.isFolder)
  , [filesToMove])

  const mapFolderTree = useCallback(
    (folderTreeEntries: DirectoryContentResponse[]): ITreeNodeProps[] => {
      return folderTreeEntries.map((entry) => ({
        id: entry.path,
        title: entry.name,
        expandable: true,
        tree: entry.entries ? mapFolderTree(entry.entries) : []
      }))
    },
    []
  )

  const getFolderTreeData = useCallback(() => {
    let bucketForFolderTree = bucket

    if (isInBin) {
      bucketForFolderTree = buckets.find(({ type }) => type === "csf")
    }

    if (!bucketForFolderTree) return

    setIsLoading(true)
    filesApiClient.getBucketDirectoriesTree(bucketForFolderTree.id).then((newFolderTree) => {
      const folderTreeNodes = [
        {
          id: "/",
          title: bucketForFolderTree?.name || "Home",
          isExpanded: true,
          expandable: true,
          tree: mapFolderTree(newFolderTree.entries || [])
        }
      ]
      setFolderTree(folderTreeNodes)
    })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [bucket, isInBin, filesApiClient, buckets, mapFolderTree])

  useEffect(() => {
    setMovePath(undefined)
    getFolderTreeData()
  }, [getFolderTreeData])

  const onMoveFile = () => {
    const moveFn = isInBin ? recoverItems : moveItems

    if (!movePath || !moveFn) return

    setIsMovingFile(true)
    moveFn(filesToMove.map(f => f.cid), movePath)
      .then(onClose)
      .catch(console.error)
      .finally(() => setIsMovingFile(false))
  }

  const isSubFolderOfAnySelectedFolder = useMemo(() => {
    if(!movePath){
      return false
    }

    return folders.some((folder) => {
      const currentPathWithFolder = getPathWithFile(currentPath, folder.name)

      return movePath === currentPathWithFolder || // don't allow a move from a folder in itself
      isSubFolder(movePath, currentPathWithFolder)
    })
  }, [currentPath, folders, movePath])

  const isAllowedToMove = useMemo(() => {
    // you can always recover from the bin
    if (isInBin) return true

    return !!movePath && // the move path should be set
    mode === "move" && // we're moving and not recovering
    movePath !== currentPath && // can't be the same parent
    (!folders.length || !isSubFolderOfAnySelectedFolder) // if it has folders and the move isn't into one of them
  }, [isInBin, movePath, mode, currentPath, folders.length, isSubFolderOfAnySelectedFolder])

  return (
    <CustomModal
      className={classes.modalRoot}
      injectedClass={{ inner: classes.modalInner }}
      active
      closePosition="none"
      maxWidth="sm"
      onModalBodyClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      testId={isInBin ? "modal-recover-file" : "modal-move-file"}
    >
      <Grid
        item
        xs={12}
        sm={12}
        className={classes.paddedContainer}
      >
        <Typography
          className={classes.heading}
          variant="h5"
          component="h5"
        >
          {isInBin ? t`Recover to…` : t`Move to…`}
        </Typography>
      </Grid>
      <Grid
        item
        xs={12}
        sm={12}
        className={classes.treeContainer}
      >
        <ScrollbarWrapper
          autoHide={true}
          maxHeight={200}
        >
          <div
            className={classes.treeScrollView}
            data-cy="tree-folder-list"
          >
            {isLoading && <Loading
              size={32}
              type="light"
            />
            }
            {folderTree.length
              ? <TreeView
                treeData={folderTree}
                commonIcon={<FolderIcon />}
                selectedId={movePath}
                onSelectNode={(path: string) => setMovePath(path)}
              />
              : !isLoading && <Typography><Trans>No folders</Trans></Typography>
            }
          </div>
        </ScrollbarWrapper>
      </Grid>
      <Grid
        item
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        className={classes.paddedContainer}
      >
        {!!movePath && !isAllowedToMove && (
          <Typography
            component="p"
            variant="body1"
            data-cy="label-move-file-error-message"
          >
            {
              folders.length
                ? t`You can't move folders to this path`
                : t`The files are already in this folder`
            }
          </Typography>
        )}
        <Grid
          item
          flexDirection="row"
          justifyContent="flex-end"
        >
          <CustomButton
            onClick={onCancel}
            size="medium"
            variant={desktop ? "outline" : "gray"}
            type="button"
            data-cy={isInBin ? "button-cancel-recovery" : "button-cancel-move"}
          >
            <Trans>Cancel</Trans>
          </CustomButton>
          <Button
            variant="primary"
            size={desktop ? "medium" : "large"}
            type="submit"
            className={classes.okButton}
            loading={isMovingFile}
            disabled={!isAllowedToMove}
            onClick={onMoveFile}
            data-cy={isInBin ? "button-recover-file" : "button-move-file"}
          >
            {isInBin ? t`Recover` : t`Move`}
          </Button>
        </Grid>
      </Grid>
    </CustomModal>
  )
}

export default MoveFileModule

import React, { useCallback, useEffect, useMemo, useRef } from "react"
import { makeStyles, createStyles, useThemeSwitcher, useOnClickOutside, LongPressEvents } from "@chainsafe/common-theme"
import { t } from "@lingui/macro"
import clsx from "clsx"
import {
  FormikTextInput,
  IMenuItem,
  MoreIcon,
  Typography
} from "@chainsafe/common-components"
import { CSFTheme } from "../../../../../Themes/types"
import { FileSystemItem } from "../../../../../Contexts/FilesContext"
import { ConnectDragPreview } from "react-dnd"
import { Form, FormikProvider, useFormik } from "formik"
import { nameValidator } from "../../../../../Utils/validationSchema"
import Menu from "../../../../../UI-components/Menu"

const useStyles = makeStyles(({ breakpoints, constants, palette }: CSFTheme) => {
  return createStyles({
    fileIcon: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      "& svg": {
        fill: constants.fileSystemItemRow.icon
      }
    },
    folderIcon: {
      "& svg": {
        fill: palette.additional.gray[9]
      }
    },
    gridIcon: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: constants.generalUnit * 16,
      maxWidth: constants.generalUnit * 24,
      border: `1px solid ${palette.additional["gray"][6]}`,
      boxShadow: constants.filesTable.gridItemShadow,
      "& span": {
        fontSize: "32px"
      },
      "& svg": {
        fontSize: "32px"
      },
      [breakpoints.down("lg")]: {
        height: constants.generalUnit * 16
      },
      [breakpoints.down("sm")]: {
        height: constants.generalUnit * 16
      },
      "&.highlighted": {
        border: `1px solid ${constants.fileSystemItemRow.borderColor}`
      }
    },
    renameInput: {
      width: "100%",
      [breakpoints.up("md")]: {
        margin: 0
      },
      [breakpoints.down("md")]: {
        margin: `${constants.generalUnit * 4.2}px 0`
      }
    },
    desktopRename: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      "& svg": {
        width: 20,
        height: 20
      },
      "& > span": {
        fontSize: 16,
        lineHeight: "20px",
        marginLeft: constants.generalUnit / 2
      }
    },
    dropdownIcon: {
      width: 14,
      height: 14,
      padding: 0,
      position: "relative",
      fontSize: "unset",
      "& svg": {
        fill: constants.fileSystemItemRow.dropdownIcon,
        top: "50%",
        left: 0,
        width: 14,
        height: 14,
        position: "absolute"
      }
    },
    gridViewContainer: {
      display: "flex",
      flex: 1,
      maxWidth: constants.generalUnit * 24
    },
    gridFolderName: {
      textAlign: "center",
      wordBreak: "break-all",
      overflowWrap: "break-word",
      padding: constants.generalUnit
    },
    gridViewIconNameBox: {
      display: "flex",
      flexDirection: "column",
      width: "100%"
    },
    menuTitleGrid: {
      padding: `0 ${constants.generalUnit * 0.5}px`,
      [breakpoints.down("md")]: {
        padding: 0
      }
    },
    focusVisible: {
      backgroundColor: "transparent !important"
    }
  })
})

interface IFileSystemTableItemProps {
  isFolder: boolean
  isOverMove: boolean
  isOverUpload: boolean
  selectedCids: string[]
  file: FileSystemItem
  editing: string | undefined
  onFolderOrFileClicks: (e?: React.MouseEvent) => void
  icon: React.ReactNode
  preview: ConnectDragPreview
  setEditing: (editing: string | undefined) => void
  handleRename?: (path: string, newPath: string) => Promise<void>
  currentPath: string | undefined
  menuItems: IMenuItem[]
  resetSelectedFiles: () => void
  longPressEvents?: LongPressEvents
}

const FileSystemGridItem = React.forwardRef(
  ({
    isFolder,
    isOverMove,
    isOverUpload,
    selectedCids,
    file,
    editing,
    onFolderOrFileClicks,
    icon,
    setEditing,
    handleRename,
    menuItems,
    resetSelectedFiles,
    preview,
    longPressEvents
  }: IFileSystemTableItemProps, forwardedRef: any) => {
    const classes = useStyles()
    const { name, cid } = file
    const { desktop } = useThemeSwitcher()
    const formRef = useRef(null)

    const {
      fileName,
      extension
    } = useMemo(() => {
      if (isFolder) {
        return {
          fileName : name,
          extension: ""
        }
      }
      const split = name.split(".")
      const extension = `.${split[split.length - 1]}`

      if (split.length === 1) {
        return {
          fileName : name,
          extension: ""
        }
      }

      return {
        fileName: name.slice(0, name.length - extension.length),
        extension: split[split.length - 1]
      }
    }, [name, isFolder])

    const formik = useFormik({
      initialValues: {
        name: fileName
      },
      validationSchema: nameValidator,
      onSubmit: (values: { name: string }) => {
        const newName = extension !== "" ? `${values.name.trim()}.${extension}` : values.name.trim()

        if (newName !== name) {
          newName && handleRename && handleRename(file.cid, newName)
        } else {
          stopEditing()
        }
      },
      enableReinitialize: true
    })

    const handleClickOutside = useCallback(
      (e) => {
        if (forwardedRef.current && forwardedRef.current.contains(e.target)) {
          // inside click
          return
        }
        if (e.defaultPrevented || e.isPropagationStopped) {
          return
        }
        // outside click
        resetSelectedFiles()
      },
      [resetSelectedFiles, forwardedRef]
    )

    useEffect(() => {
      document.addEventListener("click", handleClickOutside)
      return () => {
        document.removeEventListener("click", handleClickOutside)
      }
    }, [handleClickOutside])

    const stopEditing = useCallback(() => {
      setEditing(undefined)
      formik.resetForm()
    }, [formik, setEditing])

    useOnClickOutside(formRef, stopEditing)

    return (
      <div
        className={classes.gridViewContainer}
        ref={forwardedRef}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div
          className={clsx(classes.gridViewIconNameBox)}
          ref={preview}
          onClick={(e) => onFolderOrFileClicks(e)}
          {...longPressEvents}
        >
          <div
            className={clsx(
              classes.fileIcon,
              isFolder && classes.folderIcon,
              classes.gridIcon,
              (isOverMove || isOverUpload || selectedCids.includes(cid)) && "highlighted"
            )}
          >
            {icon}
          </div>
          {editing === cid && desktop
            ? (
              <FormikProvider value={formik}>
                <Form
                  className={classes.desktopRename}
                  ref={formRef}
                >
                  <FormikTextInput
                    className={classes.renameInput}
                    name="name"
                    inputVariant="minimal"
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        stopEditing()
                      }
                    }}
                    placeholder={isFolder
                      ? t`Please enter a folder name`
                      : t`Please enter a file name`
                    }
                    autoFocus={editing === cid}
                  />
                  {
                    !isFolder && extension !== ""  && (
                      <Typography component="span">
                        { `.${extension}` }
                      </Typography>
                    )
                  }
                </Form>
              </FormikProvider>
            )
            : <div className={classes.gridFolderName}>{name}</div>
          }
        </div>
        <div>
          {!!menuItems.length && (
            <Menu
              testId='file-item-kebab'
              icon={<MoreIcon className={classes.dropdownIcon} />}
              options={menuItems}
              style={{ focusVisible: classes.focusVisible }}
            />
          )}
        </div>
      </div>
    )
  }
)

FileSystemGridItem.displayName = "FileSystemGridItem"

export default FileSystemGridItem

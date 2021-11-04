import React, { useCallback, useMemo, useRef, useState } from "react"
import { makeStyles, createStyles, useThemeSwitcher, useOnClickOutside, LongPressEvents } from "@chainsafe/common-theme"
import { t } from "@lingui/macro"
import clsx from "clsx"
import {
  CheckboxInput,
  formatBytes,
  FormikTextInput,
  IMenuItem,
  MoreIcon,
  TableCell,
  TableRow,
  Typography
} from "@chainsafe/common-components"
import { CSFTheme } from "../../../../../Themes/types"
import dayjs from "dayjs"
import { FileSystemItem } from "../../../../../Contexts/FilesContext"
import { ConnectDragPreview } from "react-dnd"
import { Form, FormikProvider, useFormik } from "formik"
import { nameValidator } from "../../../../../Utils/validationSchema"
import Menu from "../../../../../UI-components/Menu"

const useStyles = makeStyles(({ breakpoints, constants, palette }: CSFTheme) => {
  const desktopGridSettings = "50px 69px 3fr 190px 100px 45px !important"
  const mobileGridSettings = "69px 3fr 45px !important"

  return createStyles({
    tableRow: {
      border: "1px solid transparent",
      [breakpoints.up("md")]: {
        gridTemplateColumns: desktopGridSettings
      },
      [breakpoints.down("md")]: {
        gridTemplateColumns: mobileGridSettings
      },
      "&.droppable": {
        border: `1px solid ${constants.fileSystemItemRow.borderColor}`
      },
      "&.highlighted": {
        border: `1px solid ${constants.fileSystemItemRow.borderColor}`
      }
    },
    fileIcon: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      "& svg": {
        width: constants.generalUnit * 2.5,
        fill: constants.fileSystemItemRow.icon
      }
    },
    folderIcon: {
      "& svg": {
        fill: palette.additional.gray[9]
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
      "& svg": {
        width: 20,
        height: 20
      }
    },
    filename: {
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      userSelect: "none",
      "&.editing": {
        overflow: "visible"
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
  handleAddToSelectedItems: (selected: FileSystemItem) => void
  onFolderOrFileClicks: (e?: React.MouseEvent) => void
  icon: React.ReactNode
  preview: ConnectDragPreview
  setEditing: (editing: string | undefined) => void
  handleRename?: (path: string, newPath: string) => Promise<void>
  currentPath: string | undefined
  menuItems: IMenuItem[]
  longPressEvents?: LongPressEvents
}

const FileSystemTableItem = React.forwardRef(
  ({
    isFolder,
    isOverMove,
    isOverUpload,
    selectedCids,
    file,
    editing,
    handleAddToSelectedItems,
    onFolderOrFileClicks,
    icon,
    preview,
    setEditing,
    handleRename,
    menuItems,
    longPressEvents
  }: IFileSystemTableItemProps, forwardedRef: any) => {
    const classes = useStyles()
    const { name, cid, created_at, size } = file
    const { desktop } = useThemeSwitcher()
    const formRef = useRef(null)
    const formik = useFormik({
      initialValues: { name },
      validationSchema: nameValidator,
      onSubmit: (values: { name: string }) => {
        const newName = values.name.trim()

        newName && handleRename && handleRename(file.cid, newName)
      },
      enableReinitialize: true
    })

    const stopEditing = useCallback(() => {
      setEditing(undefined)
      formik.resetForm()
    }, [formik, setEditing])

    useOnClickOutside(formRef, stopEditing)

    const [dragMutex, setDragMutex] = useState(false)
    const clickEvent = useMemo(() => {
      return desktop ? {
        onClick: (e: any) => !editing && onFolderOrFileClicks(e)
      } : {
        onMouseUp: (e: any) => !editing && (dragMutex ? setDragMutex(false) : onFolderOrFileClicks(e)),
        onDragStart: () => setDragMutex(true)
      }
    }, [desktop, editing, onFolderOrFileClicks, dragMutex])

    return (
      <TableRow
        data-cy="file-item-row"
        className={clsx(classes.tableRow, {
          droppable: isFolder && (isOverMove || isOverUpload),
          highlighted: !desktop && selectedCids.includes(cid)
        })}
        type="grid"
        ref={forwardedRef}
        selected={selectedCids.includes(cid)}
      >
        {desktop && (
          <TableCell>
            <CheckboxInput
              value={selectedCids.includes(cid)}
              onChange={() => handleAddToSelectedItems(file)}
            />
          </TableCell>
        )}
        <TableCell
          className={clsx(classes.fileIcon, isFolder && classes.folderIcon)}
          {...clickEvent}
          {...longPressEvents}
        >
          {icon}
        </TableCell>
        <TableCell
          data-cy="file-item-name"
          ref={preview}
          align="left"
          className={clsx(classes.filename, desktop && editing === cid && "editing")}
          {...clickEvent}
          {...longPressEvents}
        >
          {editing === cid && desktop
            ? (
              <FormikProvider value={formik}>
                <Form
                  className={classes.desktopRename}
                  data-cy='rename-form'
                  ref={formRef}
                >
                  <FormikTextInput
                    className={classes.renameInput}
                    data-cy='input-rename-file-or-folder'
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
                </Form>
              </FormikProvider>
            )
            : <Typography>{name}</Typography>}
        </TableCell>
        {desktop && (
          <>
            <TableCell align="left">
              {
                !isFolder && !!created_at && dayjs.unix(created_at).format("DD MMM YYYY h:mm a")
              }
            </TableCell>
            <TableCell align="left">
              {!isFolder && formatBytes(size, 2)}
            </TableCell>
          </>
        )}
        <TableCell align="right">
          {!!menuItems.length && (
            <Menu
              testId='fileDropdown'
              icon={<MoreIcon className={classes.dropdownIcon} />}
              options={menuItems}
              style={{ focusVisible: classes.focusVisible }}
            />
          )}
        </TableCell>
      </TableRow>
    )
  }
)

FileSystemTableItem.displayName = "FileSystemTableItem"

export default FileSystemTableItem

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { makeStyles, createStyles, useOnClickOutside, useThemeSwitcher } from "@chainsafe/common-theme"
import {
  CopyIcon,
  DeleteSvg,
  EditSvg,
  formatBytes,
  FormikTextInput,
  IMenuItem,
  Loading,
  MenuDropdown,
  MoreIcon,
  TableCell,
  TableRow,
  Typography,
  useHistory,
  useToasts
} from "@chainsafe/common-components"
import { t, Trans } from "@lingui/macro"
import { Bucket } from "@chainsafe/files-api-client"
import { CSSTheme } from "../../Themes/types"
import { desktopGridSettings, mobileGridSettings }  from "../Pages/BucketsPage"
import { ROUTE_LINKS } from "../StorageRoutes"
import clsx from "clsx"
import { Form, FormikProvider, useFormik } from "formik"
import { nameValidator } from "../../Utils/validationSchema"

const useStyles = makeStyles(({ palette, animation, constants, breakpoints }: CSSTheme) =>
  createStyles({
    dropdownIcon: {
      "& svg": {
        fill: constants.fileSystemItemRow.dropdownIcon
      }
    },
    dropdownOptions: {
      backgroundColor: constants.fileSystemItemRow.optionsBackground,
      color: constants.fileSystemItemRow.optionsColor,
      border: `1px solid ${constants.fileSystemItemRow.optionsBorder}`
    },
    dropdownItem: {
      backgroundColor: constants.fileSystemItemRow.itemBackground,
      color: constants.fileSystemItemRow.itemColor
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
    },
    tableRow: {
      border: "2px solid transparent",
      transitionDuration: `${animation.transform}ms`,
      "&.deleting": {
        // TODO: #1321
        display: "none"
      },
      [breakpoints.up("md")]: {
        gridTemplateColumns: desktopGridSettings
      },
      [breakpoints.down("md")]: {
        gridTemplateColumns: mobileGridSettings
      },
      cursor: "pointer"
    },
    loadingIcon: {
      marginLeft: constants.generalUnit,
      verticalAlign: "middle"
    },
    nameRename: {
      display: "flex",
      flexDirection: "row",
      "& svg": {
        width: 20,
        height: 20
      }
    },
    filename: {
      textAlign: "left",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      "&.editing": {
        overflow: "visible"
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
    idRow: {
      display: "flex",
      alignItems: "center"
    },
    copyIcon: {
      fontSize: "16px",
      fill: palette.additional["gray"][8],
      marginLeft: "8px"
    }
  })
)
interface Props {
  bucket: Bucket
  onRemoveBucket: (bucket: Bucket) => void
  handleContextMenu: (e: React.MouseEvent, items?: IMenuItem[]) => void
  handleRename: (bucket: Bucket, newName: string) => Promise<void>
}

const BucketRow = ({ bucket, onRemoveBucket, handleContextMenu, handleRename }: Props) => {
  const classes = useStyles()
  const { redirect } = useHistory()
  const { addToast } = useToasts()
  const { desktop } = useThemeSwitcher()

  const menuItems = useMemo(() => [
    {
      contents: (
        <>
          <EditSvg className={classes.menuIcon} />
          <span data-cy="menu-rename">
            <Trans>Rename</Trans>
          </span>
        </>
      ),
      onClick: () => setIsRenaming(true)
    },
    {
      contents: (
        <>
          <DeleteSvg className={classes.menuIcon} />
          <span data-cy="menu-delete-bucket">
            <Trans>Delete bucket</Trans>
          </span>
        </>
      ),
      onClick: () => onRemoveBucket(bucket)
    }], [bucket, classes, onRemoveBucket])

  const [isEditingLoading, setIsEditingLoading] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const renameInputRef = useRef<HTMLInputElement | null>()
  const formRef = useRef(null)

  useEffect(() => {
    if (isRenaming && renameInputRef?.current) {
      renameInputRef.current.focus()
    }
  }, [isRenaming])

  const formik = useFormik({
    initialValues:{ name: bucket.name },
    enableReinitialize: true,
    validationSchema: nameValidator,
    onSubmit:(values, { resetForm }) => {
      const newName = values.name?.trim()

      if (newName !== bucket.name && !!newName && handleRename) {
        setIsEditingLoading(true)

        handleRename(bucket, newName)
          .then(() => setIsEditingLoading(false))
      } else {
        stopEditing()
      }
      setIsRenaming(false)
      resetForm()
    }
  })

  const stopEditing = useCallback(() => {
    setIsRenaming(false)
    formik.resetForm()
  }, [formik, setIsRenaming])

  useOnClickOutside(formRef, formik.submitForm)

  const onCopyBucketId = () => {
    navigator.clipboard.writeText(bucket.id)
    addToast({
      title: t`Bucket Id copied`,
      type: "success"
    })
  }

  return (
    <TableRow
      type="grid"
      className={clsx(classes.tableRow, {
        deleting: bucket.status === "deleting"
      })}
      data-cy="row-bucket-item"
      onContextMenu={(e) => handleContextMenu(e, menuItems)}
    >
      <TableCell
        className={clsx(classes.filename, isRenaming && "editing")}
        data-cy="cell-bucket-name"
        onClick={() => !isRenaming && redirect(ROUTE_LINKS.Bucket(bucket.id, "/"))}
      >
        {!isRenaming
          ? <>
            <Typography>{bucket.name || bucket.id}</Typography>
            {isEditingLoading && <Loading
              className={classes.loadingIcon}
              size={16}
              type="initial"
            />}
          </>
          : (
            <FormikProvider value={formik}>
              <Form
                className={classes.nameRename}
                data-cy='form-rename'
                ref={formRef}
              >
                <FormikTextInput
                  className={classes.renameInput}
                  data-cy='input-rename-bucket'
                  name="name"
                  inputVariant="minimal"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      stopEditing()
                    }
                  }}
                  placeholder = {t`Please enter a bucket name`}
                  autoFocus
                  ref={renameInputRef}
                />
              </Form>
            </FormikProvider>
          )
        }
      </TableCell>
      {desktop &&
        <TableCell
          data-cy="cell-file-system-id"
          align="left"
          className={classes.idRow}
        >
          {bucket.id }
          <CopyIcon
            className={classes.copyIcon}
            onClick={onCopyBucketId}
          />
        </TableCell>
      }
      <TableCell
        data-cy="cell-file-system-type"
      >
        {bucket.file_system_type === "ipfs" ? "IPFS MFS" : "Chainsafe" }
      </TableCell>
      <TableCell>
        {formatBytes(bucket.size, 2)}
      </TableCell>
      <TableCell align="right">
        <MenuDropdown
          testId='bucket-kebab'
          animation="none"
          anchor={"bottom-right"}
          menuItems={menuItems}
          classNames={{
            icon: classes.dropdownIcon,
            options: classes.dropdownOptions,
            item: classes.dropdownItem
          }}
          indicator={MoreIcon}
        />
      </TableCell>
    </TableRow>
  )
}

export default BucketRow
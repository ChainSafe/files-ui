import React, { useEffect, useMemo, useState } from "react"
import { makeStyles, createStyles, useThemeSwitcher } from "@chainsafe/common-theme"
import {
  Button,
  Dialog,
  FormikRadioInput,
  FormikTextInput,
  Grid,
  IMenuItem,
  PlusIcon,
  PlusSvg,
  Table,
  TableBody,
  TableHead,
  TableHeadCell,
  TableRow,
  Typography
} from "@chainsafe/common-components"
import { CSSTheme } from "../../Themes/types"
import { useStorage } from "../../Contexts/StorageContext"
import { t, Trans } from "@lingui/macro"
import BucketRow from "../Elements/BucketRow"
import CustomModal from "../Elements/CustomModal"
import { Form, FormikProvider, useFormik } from "formik"
import { bucketNameValidator } from "../../Utils/validationSchema"
import { useCallback } from "react"
import RestrictedModeBanner from "../Elements/RestrictedModeBanner"
import { useStorageApi } from "../../Contexts/StorageApiContext"
import { usePageTrack } from "../../Contexts/PosthogContext"
import { Bucket, FileSystemType } from "@chainsafe/files-api-client"
import { Helmet } from "react-helmet-async"
import AnchorMenu, { AnchorMenuPosition } from "../UI-components/AnchorMenu"

export const desktopGridSettings = "2fr 5fr 150px 150px 50px !important"
export const mobileGridSettings = "1fr 150px 110px 50px !important"

const useStyles = makeStyles(({ breakpoints, animation, constants, typography }: CSSTheme) =>
  createStyles({
    root: {
      position: "relative",
      marginTop: constants.generalUnit * 2
    },
    tableHead: {
      marginTop: 24
    },
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
    modalFooter: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end"
    },
    createBucketModal: {
      padding: constants.generalUnit * 4
    },
    modalInner: {
      width: "100%"
    },
    okButton: {
      marginLeft: constants.generalUnit
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
    header: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      [breakpoints.down("md")]: {
        margin: `${constants.generalUnit}px ${constants.generalUnit * 2}px 0`
      }
    },
    modalRoot: {
      padding: constants.generalUnit * 4,
      flexDirection: "column"
    },
    input: {
      marginBottom: constants.generalUnit * 2
    },
    heading: {
      color: constants.createFolder.color,
      fontWeight: typography.fontWeight.semibold,
      textAlign: "center",
      marginBottom: constants.generalUnit * 4
    },
    label: {
      fontSize: 14,
      lineHeight: "22px"
    },
    fileSystemSelector: {
      margin: 5,
      "& > div": {
        display: "flex",
        flexDirection: "row"
      }
    },
    menuIcon: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: 20,
      marginRight: constants.generalUnit * 1.5,
      fill: constants.previewModal.menuItemIconColor
    }
  })
)

type SortColumn = "name" | "file_system" | "size"
type SortDirection = "ascend" | "descend"

const BucketsPage = () => {
  const classes = useStyles()
  const { storageBuckets, createBucket, refreshBuckets, removeBucket, editBucket } = useStorage()
  const { accountRestricted } = useStorageApi()
  const [isCreateBucketModalOpen, setIsCreateBucketModalOpen] = useState(false)
  const [bucketToRemove, setBucketToRemove] = useState<Bucket | undefined>()
  const [isRemovingBucket, setIsRemovingBucket] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState<AnchorMenuPosition | null>(null)
  const [contextMenuOptions, setContextMenuOptions] = useState<IMenuItem[]>([])
  const [sortColumn, setSortColumn] = useState<SortColumn | undefined>(undefined)
  const [sortDirection, setSortDirection] = useState<SortDirection>("descend")

  const { desktop } = useThemeSwitcher()

  const generalContextMenuOptions: IMenuItem[] = useMemo(() => [
    {
      contents: (
        <>
          <PlusSvg className={classes.menuIcon} />
          <span>
            <Trans>Create Bucket</Trans>
          </span>
        </>
      ),
      onClick: () => setIsCreateBucketModalOpen(true)
    }
  ], [classes])

  usePageTrack()

  useEffect(() => {
    // this is needed for tests
    refreshBuckets()
  }, [refreshBuckets])

  const handleRemoveBucket = useCallback(() => {
    if (!bucketToRemove) return
    setIsRemovingBucket(true)
    removeBucket(bucketToRemove.id)
      .catch(console.error)
      .finally(() => {
        setBucketToRemove(undefined)
        setIsRemovingBucket(false)
      })
  }, [bucketToRemove, removeBucket])

  const bucketsToShow: Bucket[] = useMemo(() => {
    let temp = []
    const filteredBuckets = storageBuckets.filter(b => b.status === "created")

    switch (sortColumn) {
      case "name": {
        temp = filteredBuckets.sort((a, b) => a.name?.localeCompare(b.name || "") || 0)
        break
      }
      case "size": {
        temp = filteredBuckets.sort((a, b) => (a.size < b.size ? -1 : 1))
        break
      }
      case "file_system": {
        temp = filteredBuckets.sort((a, b) => a.file_system_type?.localeCompare(b.file_system_type || "") || 0)
        break
      }
      default: {
        temp = filteredBuckets
        break
      }
    }
    return sortColumn && sortDirection === "descend" ? temp.reverse() : temp
  }, [storageBuckets, sortDirection, sortColumn])

  const bucketNameValidationSchema = useMemo(
    () => bucketNameValidator(bucketsToShow.map(b => b.name))
    , [bucketsToShow]
  )

  const formik = useFormik({
    initialValues: {
      name: "",
      fileSystemType: "chainsafe"
    },
    enableReinitialize: true,
    validationSchema: bucketNameValidationSchema,
    onSubmit: (values, helpers) => {
      helpers.setSubmitting(true)
      createBucket(values.name.trim(), values.fileSystemType as FileSystemType)
        .then(() => {
          setIsCreateBucketModalOpen(false)
        })
        .catch(console.error)
        .finally(() => {
          helpers.setSubmitting(false)
          helpers.resetForm()
        })
    }
  })

  const closeCreateModal = useCallback(() => {
    formik.resetForm()
    setIsCreateBucketModalOpen(false)
  }, [formik])

  const handleContextMenu = useCallback((e: React.MouseEvent, options?: IMenuItem[]) => {
    e.preventDefault()
    if (options) {
      setContextMenuOptions(options)
    } else {
      setContextMenuOptions(generalContextMenuOptions)
    }
    setContextMenuPosition({
      left: e.clientX - 2,
      top: e.clientY - 4
    })
  }, [generalContextMenuOptions])

  const handleSortToggle = (
    targetColumn: SortColumn
  ) => {
    if (sortColumn !== targetColumn) {
      setSortColumn(targetColumn)
      setSortDirection("descend")
    } else {
      if (sortDirection === "ascend") {
        setSortDirection("descend")
      } else {
        setSortDirection("ascend")
      }
    }
  }

  const handleRename = useCallback((bucket: Bucket, newName: string) => {
    return editBucket(bucket.id, {
      ...bucket,
      name: newName
    }).then(() => refreshBuckets())
      .catch(console.error)
  }, [editBucket, refreshBuckets])

  return (
    <div className={classes.root}>
      <Helmet>
        <title>{t`Buckets`} - Chainsafe Storage</title>
      </Helmet>
      <header
        className={classes.header}
        data-cy="header-buckets"
        onContextMenu={handleContextMenu}
      >
        <Typography variant='h1'>
          <Trans>
            Buckets
          </Trans>
        </Typography>
        <div className={classes.controls}>
          <Button
            data-cy="button-create-bucket"
            onClick={() => setIsCreateBucketModalOpen(true)}
            variant="outline"
            disabled={accountRestricted}
          >
            <PlusIcon />
            <Trans>Create Bucket</Trans>
          </Button>
        </div>
      </header>
      {contextMenuPosition && (
        <AnchorMenu
          options={contextMenuOptions}
          onClose={() => setContextMenuPosition(null)}
          anchorPosition={contextMenuPosition}
        />
      )}
      <Table
        fullWidth={true}
        striped={true}
        hover={true}
      >
        <TableHead
          className={classes.tableHead}
          onContextMenu={handleContextMenu}
        >
          <TableRow
            type="grid"
            className={classes.tableRow}
          >
            <TableHeadCell
              data-cy="buckets-table-header-name"
              align="left"
              sortButtons={true}
              onSortChange={() => handleSortToggle("name")}
              sortDirection={sortColumn === "name" ? sortDirection : undefined}
              sortActive={sortColumn === "name"}
            >
              <Trans>Name</Trans>
            </TableHeadCell>
            {desktop &&
              <TableHeadCell
                data-cy="buckets-table-header-id"
                align="left"
              >
                <Trans>Bucket Id</Trans>
              </TableHeadCell>
            }
            <TableHeadCell
              data-cy="buckets-table-header-file-system"
              align="center"
              sortButtons={true}
              onSortChange={() => handleSortToggle("file_system")}
              sortDirection={sortColumn === "file_system" ? sortDirection : undefined}
              sortActive={sortColumn === "file_system"}
            >
              <Trans>File System</Trans>
            </TableHeadCell>
            <TableHeadCell
              data-cy="buckets-table-header-size"
              align="center"
              sortButtons={true}
              onSortChange={() => handleSortToggle("size")}
              sortDirection={sortColumn === "size" ? sortDirection : undefined}
              sortActive={sortColumn === "size"}
            >
              <Trans>Size</Trans>
            </TableHeadCell>
            <TableHeadCell>{/* Menu */}</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bucketsToShow
            .map((bucket) =>
              <BucketRow
                bucket={bucket}
                key={bucket.id}
                onRemoveBucket={setBucketToRemove}
                handleContextMenu={handleContextMenu}
                handleRename={handleRename}
              />
            )}
        </TableBody>
      </Table>
      {accountRestricted &&
        <RestrictedModeBanner />
      }
      <CustomModal
        active={isCreateBucketModalOpen}
        className={classes.createBucketModal}
        injectedClass={{
          inner: classes.modalInner
        }}
        closePosition="none"
        testId="create-bucket"
      >
        <div
          className={classes.modalRoot}
        >
          <FormikProvider value={formik}>
            <Form>
              <Grid
                item
                xs={12}
                sm={12}
              >
                <Typography
                  className={classes.heading}
                  variant="h5"
                  component="h5"
                >
                  <Trans>Create Bucket</Trans>
                </Typography>
              </Grid>
              <Grid
                item
                xs={12}
                sm={12}
                className={classes.input}
              >
                <FormikTextInput
                  data-cy="input-bucket-name"
                  name="name"
                  size="large"
                  placeholder={t`Bucket name`}
                  label={t`Bucket name`}
                  labelClassName={classes.label}
                  autoFocus={true}
                />
              </Grid>
              <Grid
                item
                xs={12}
                sm={12}
                className={classes.input}
              >
                <label className={classes.fileSystemSelector}>
                  <Trans>File system type</Trans>
                  <div>
                    <FormikRadioInput
                      name="fileSystemType"
                      id='chainsafe'
                      label='Chainsafe'
                      testId="chainsafe"
                    />
                    <FormikRadioInput
                      name="fileSystemType"
                      id='ipfs'
                      label='IPFS'
                      testId="ipfs"
                      disabled
                    />
                  </div>
                  <div>
                    <Typography variant="caption">Looking for IPFS MFS support? Email <a
                      style={{ fontStyle: "italic" }}
                      href="mailto:colin@chainsafe.io">colin@chainsafe.io</a> to inquire.
                    </Typography>
                  </div>
                </label>
              </Grid>
              <footer className={classes.modalFooter}>
                <Button
                  data-cy="button-cancel-create"
                  onClick={closeCreateModal}
                  size="medium"
                  variant="outline"
                  type="button"
                >
                  <Trans>Cancel</Trans>
                </Button>
                <Button
                  data-cy="button-submit-create"
                  variant="primary"
                  size="medium"
                  className={classes.okButton}
                  type="submit"
                  loading={formik.isSubmitting}
                >
                  <Trans>Create</Trans>
                </Button>
              </footer>
            </Form>
          </FormikProvider>
        </div>
      </CustomModal >
      <Dialog
        active={!!bucketToRemove}
        reject={() => setBucketToRemove(undefined)}
        accept={handleRemoveBucket}
        requestMessage={t`You are about to delete the bucket ${bucketToRemove?.name}`}
        rejectText={t`Cancel`}
        acceptText={t`Delete`}
        acceptButtonProps={{ loading: isRemovingBucket, disabled: isRemovingBucket }}
        rejectButtonProps={{ disabled: isRemovingBucket }}
        testId={"bucket-deletion"}
      />
    </div >
  )
}

export default BucketsPage

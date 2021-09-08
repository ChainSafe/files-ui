import React, { useEffect, useState, useCallback } from "react"
import { makeStyles, createStyles, debounce } from "@chainsafe/common-theme"
import { useGamingApi } from "../../Contexts/GamingApiContext"
import { AccessKey } from "@chainsafe/files-api-client"
import {
  Typography,
  Button,
  PlusIcon,
  Table,
  TableHead,
  TableRow,
  TableHeadCell,
  TableBody,
  TableCell,
  MenuDropdown,
  DeleteSvg,
  MoreIcon,
  CopyIcon,
  Modal
} from "@chainsafe/common-components"
import { CSGTheme } from "../../Themes/types"
import { Trans } from "@lingui/macro"
import dayjs from "dayjs"

export const desktopGridSettings = "2fr 2fr 1fr 1.5fr 70px !important"
export const mobileGridSettings = "2fr 2fr 1fr 1.5fr 70px !important"

const useStyles = makeStyles(({ constants, breakpoints, animation, zIndex, palette }: CSGTheme) =>
  createStyles({
    root: {
      position: "relative"
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
    modalRoot: {
      zIndex: zIndex?.blocker,
      [breakpoints.down("md")]: {}
    },
    modalInner: {
      // backgroundColor: constants.createFolder.backgroundColor,
      // color: constants.createFolder.color,
      [breakpoints.down("md")]: {
        bottom:
        Number(constants?.mobileButtonHeight) + constants.generalUnit,
        borderTopLeftRadius: `${constants.generalUnit * 1.5}px`,
        borderTopRightRadius: `${constants.generalUnit * 1.5}px`,
        maxWidth: `${breakpoints.width("md")}px !important`
      }
    },
    modalHeading: {
      textAlign: "center",
      marginBottom: constants.generalUnit * 4
    },
    modalContent: {
      display: "flex",
      flexDirection: "column",
      padding: constants.generalUnit * 4
    },
    secretContainer: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: constants.generalUnit * 0.5
    },
    copyBox: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      color: palette.text.secondary
    },
    copyIcon: {
      fontSize: "14px",
      fill: constants.profile.icon,
      [breakpoints.down("md")]: {
        fontSize: "18px",
        fill: palette.additional["gray"][9]
      }
    },
    secret: {
      maxWidth: "95%",
      overflowWrap: "anywhere"
    },
    field: {
      marginBottom: constants.generalUnit * 4
    }
  })
)

const ApiKeys = () => {
  const classes = useStyles()
  const { gamingApiClient } = useGamingApi()
  const [keys, setKeys] = useState<AccessKey[]>([])
  const [newKey, setNewKey] = useState<AccessKey | undefined>()
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const debouncedCopiedSecret =
    debounce(() => setCopiedSecret(false), 3000)

  const copySecret = async () => {
    if (newKey?.secret) {
      try {
        await navigator.clipboard.writeText(newKey.secret)
        setCopiedSecret(true)
        debouncedCopiedSecret()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const fetchAccessKeys = useCallback(() => {
    gamingApiClient.listAccessKeys()
      .then(setKeys)
      .catch(console.error)
  }, [gamingApiClient])

  const createStorageAccessKey = useCallback(() => {
    gamingApiClient.createAccessKey({ type: "gaming" })
      .then(setNewKey)
      .then(fetchAccessKeys)
      .then(() => setIsNewKeyModalOpen(true))
      .catch(console.error)
  }, [fetchAccessKeys, gamingApiClient])

  const deleteAccessKey = useCallback((id: string) => {
    gamingApiClient.deleteAccessKey(id)
      .then(fetchAccessKeys)
      .catch(console.error)
  }, [gamingApiClient, fetchAccessKeys])

  useEffect(() => {
    fetchAccessKeys()
  }, [fetchAccessKeys])

  return (
    <>
      <div className={classes.root}>
        <header className={classes.header}>
          <Typography
            variant="h1"
            component="h1"
            data-cy="api-keys-header"
          >
            <Trans>
            API Keys
            </Trans>
          </Typography>
          <div className={classes.controls}>
            <Button
              data-cy="add-storage-api-key-button"
              onClick={createStorageAccessKey}
              variant="outline"
              size="large"
              disabled={keys.filter(k => k.type === "storage").length > 0}
            >
              <PlusIcon />
              <span>
                <Trans>Add API Key</Trans>
              </span>
            </Button>
          </div>
        </header>
        <Table
          fullWidth={true}
          striped={true}
          hover={true}
          className=""
        >
          <TableHead className={classes.tableHead}>
            <TableRow
              type="grid"
              className={classes.tableRow}
            >
              <TableHeadCell
                sortButtons={false}
                align="center"
              >
                <Trans>Id</Trans>
              </TableHeadCell>
              <TableHeadCell
                sortButtons={false}
                align="center"
              >
                <Trans>Type</Trans>
              </TableHeadCell>
              <TableHeadCell
                sortButtons={false}
                align="center"
              >
                <Trans>Status</Trans>
              </TableHeadCell>
              <TableHeadCell
                sortButtons={false}
                align="center"
              >
                <Trans>Created At</Trans>
              </TableHeadCell>
              <TableHeadCell>{/* Menu */}</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {keys.map(k =>
              <TableRow
                key={k.id}
                type='grid'
                className={classes.tableRow}>
                <TableCell align='left'>
                  <Typography>
                    {k.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>
                    {k.type}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>
                    {k.status}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>
                    {dayjs(k.created_at).format("DD MMM YYYY h:mm a")}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <MenuDropdown
                    animation="none"
                    anchor={"bottom-right"}
                    menuItems={[{
                      contents: (
                        <>
                          <DeleteSvg className={classes.menuIcon} />
                          <span data-cy="menu-share">
                            <Trans>Delete Key</Trans>
                          </span>
                        </>
                      ),
                      onClick: () => deleteAccessKey(k.id)
                    }]}
                    classNames={{
                      icon: classes.dropdownIcon,
                      options: classes.dropdownOptions,
                      item: classes.dropdownItem
                    }}
                    indicator={MoreIcon}
                  />
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <Modal
        className={classes.modalRoot}
        injectedClass={{
          inner: classes.modalInner
        }}
        active={isNewKeyModalOpen}
        closePosition="none"
        maxWidth="sm"
      >
        <div className={classes.modalContent}>
          <Typography
            variant='h6'
            className={classes.modalHeading}
          >
            <Trans>New Key</Trans>
          </Typography>
          <Typography variant='h4'>
            <Trans>Key ID</Trans>
          </Typography>
          <Typography className={classes.field}>{newKey?.id}</Typography>
          <Typography variant='h4'>
            <Trans>Secret</Trans>
          </Typography>
          <div className={classes.field}>
            <div className={classes.secretContainer}>
              <Typography variant='body2'>
                <Trans>Make sure to save the secret, as it can only be displayed once.</Trans>
              </Typography>
              {copiedSecret && (
                <Typography variant='body2'>
                  <Trans>Copied!</Trans>
                </Typography>
              )}
            </div>
            <div
              className={classes.copyBox}
              onClick={copySecret}
            >
              <Typography
                variant="body1"
                component="p"
                className={classes.secret}
              >
                {newKey?.secret}
              </Typography>
              <CopyIcon className={classes.copyIcon} />
            </div>
          </div>
          <Button
            autoFocus
            onClick={() => {
              setIsNewKeyModalOpen(false)
              setNewKey(undefined)
            }}
          >
            Close
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default ApiKeys

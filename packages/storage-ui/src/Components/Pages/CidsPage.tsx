import React, { ChangeEvent, useCallback, useMemo, useState, useEffect } from "react"
import {
  Button,
  PlusIcon,
  Table,
  TableBody,
  TableHead,
  TableHeadCell,
  TableRow,
  Typography,
  Pagination,
  SearchBar
} from "@chainsafe/common-components"
import { makeStyles, createStyles, debounce, useThemeSwitcher } from "@chainsafe/common-theme"
import { useStorage } from "../../Contexts/StorageContext"
import { t, Trans } from "@lingui/macro"
import CidRow from "../Elements/CidRow"
import { CSSTheme } from "../../Themes/types"
import AddCIDModal from "../Modules/AddCIDModal"
import { PinStatus } from "@chainsafe/files-api-client"
import RestrictedModeBanner from "../Elements/RestrictedModeBanner"
import { useStorageApi } from "../../Contexts/StorageApiContext"
import { usePageTrack } from "../../Contexts/PosthogContext"
import { Helmet } from "react-helmet-async"
import { cid as isCid } from "is-ipfs"
import BlacklistedModeBanner from "../Elements/BlacklistedModeBanner"

export const desktopGridSettings = "2fr 3fr 180px 110px 80px 20px 70px !important"
export const mobileGridSettings = "2fr 4fr 50px !important"

const useStyles = makeStyles(({ animation, breakpoints, constants }: CSSTheme) =>
  createStyles({
    root: {
      position: "relative",
      marginTop: constants.generalUnit * 2
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
    title: {
      marginRight: constants.generalUnit * 1.5
    },
    pinButton: {
      minWidth: 110
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
    pagination: {
      margin: `${constants.generalUnit * 3}px 0`,
      display: "flex",
      justifyContent: "flex-end",
      [breakpoints.down("md")]: {
        marginRight: constants.generalUnit * 2
      }
    }
  })
)

type SortColumn = "size" | "date_uploaded" | "name"
type SortDirection = "ascend" | "descend"

const CidsPage = () => {
  const classes = useStyles()
  const { desktop } = useThemeSwitcher()
  const {
    pins,
    onNextPins,
    onPreviousPins,
    isNextPinsPage,
    isPreviousPinsPage,
    pagingLoaders,
    refreshPins,
    onSearch,
    pageNumber,
    isLoadingPins,
    resetPins
  } = useStorage()
  const { accountRestricted, accountBlacklisted } = useStorageApi()
  const [addCIDOpen, setAddCIDOpen] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>("date_uploaded")
  const [sortDirection, setSortDirection] = useState<SortDirection>("descend")
  const [searchQuery, setSearchQuery] = useState("")
  usePageTrack()

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

  useEffect(() => {
    resetPins()
  }, [resetPins])

  const sortedPins: PinStatus[] = useMemo(() => {
    let temp = []

    switch (sortColumn) {
      case "size": {
        temp = pins.sort((a, b) => (a.info?.size < b.info?.size ? -1 : 1))
        break
      }
      case "name": {
        temp = pins.sort((a, b) => a.pin.name?.localeCompare(b.pin.name || "") || 0)
        break
      }
      default: {
        temp = pins.sort((a, b) => (a.created < b.created ? -1 : 1))
        break
      }
    }
    return sortDirection === "descend" ? temp.reverse() : temp
  }, [pins, sortDirection, sortColumn])


  const handleSearch = (searchString: string) => {
    onSearch(
      isCid(searchString)
        ? { searchedCid: searchString.trim() }
        : { searchedName: searchString.trim() })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(handleSearch, 400), [refreshPins])

  const onSearchChange = (searchString: string) => {
    setSearchQuery(searchString)
    debouncedSearch(searchString)
  }

  return (
    <>
      <Helmet>
        <title>{t`CIDs`} - Chainsafe Storage</title>
      </Helmet>
      <div className={classes.root}>
        <header
          className={classes.header}
          data-cy="cids-header"
        >
          <Typography
            variant="h1"
            component="h1"
            className={classes.title}
          >
            <Trans>CIDs</Trans>
          </Typography>
          <div className={classes.controls}>
            <SearchBar
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onSearchChange(e.target.value)
              }
              placeholder={t`Search by cid, name…`}
              testId = "input-search-cid"
              value={searchQuery}
              isLoading={isLoadingPins}
            />
            <Button
              data-cy="button-pin-cid"
              onClick={() => setAddCIDOpen(true)}
              variant="outline"
              size="large"
              className={classes.pinButton}
              disabled={accountRestricted}
            >
              <PlusIcon />
              <span>
                <Trans>Pin CID</Trans>
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
                data-cy="cids-table-header-name"
                sortButtons={true}
                align="center"
                onSortChange={() => handleSortToggle("name")}
                sortDirection={sortColumn === "name" ? sortDirection : undefined}
                sortActive={sortColumn === "name"}
              >
                <Trans>Name</Trans>
              </TableHeadCell>
              <TableHeadCell
                data-cy="cids-table-header-cid"
                sortButtons={false}
                align="center"
              >
                <Trans>Cid</Trans>
              </TableHeadCell>
              {desktop && <>
                <TableHeadCell
                  data-cy="cids-table-header-created"
                  sortButtons={true}
                  onSortChange={() => handleSortToggle("date_uploaded")}
                  sortDirection={sortColumn === "date_uploaded" ? sortDirection : undefined}
                  sortActive={sortColumn === "date_uploaded"}
                  align="center"
                >
                  <Trans>Created</Trans>
                </TableHeadCell>
                <TableHeadCell
                  data-cy="cids-table-header-size"
                  sortButtons={true}
                  onSortChange={() => handleSortToggle("size")}
                  sortDirection={sortColumn === "size" ? sortDirection : undefined}
                  sortActive={sortColumn === "size"}
                  align="center"
                >
                  <Trans>Size</Trans>
                </TableHeadCell>
                <TableHeadCell
                  data-cy="cids-table-header-status"
                  sortButtons={false}
                  align="center"
                >
                  <Trans>Status</Trans>
                </TableHeadCell>
                <TableHeadCell>{/* IPFS Gateway */}</TableHeadCell>
              </>}
              <TableHeadCell>{/* Menu */}</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPins.map((pinStatus, index) =>
              <CidRow
                data-cy="row-pin-status"
                pinStatus={pinStatus}
                key={index}
              />
            )}
          </TableBody>
        </Table>
      </div>
      {!!pins.length && (isNextPinsPage || isPreviousPinsPage) &&
        <div className={classes.pagination}>
          <Pagination
            showPageNumbers={true}
            pageNo={pageNumber}
            onNextClick={onNextPins}
            onPreviousClick={onPreviousPins}
            isNextDisabled={!isNextPinsPage || !!pagingLoaders}
            isPreviousDisabled={!isPreviousPinsPage || !!pagingLoaders}
            loadingNext={pagingLoaders?.next}
            loadingPrevious={pagingLoaders?.previous}
          />
        </div>
      }
      <AddCIDModal
        close={() => setAddCIDOpen(false)}
        modalOpen={addCIDOpen}
      />
      {accountRestricted && <RestrictedModeBanner />}
      {accountBlacklisted && <BlacklistedModeBanner />}
    </>
  )
}

export default CidsPage

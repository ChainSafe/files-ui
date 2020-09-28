import { createStyles, ITheme, makeStyles } from "@chainsafe/common-themes"
import React, { Fragment } from "react"
import { Button, CheckboxInput, DeleteIcon, Divider, DownloadIcon, EditIcon, ExportIcon, FileImageSvg, FilePdfSvg, FileTextSvg, FolderSvg, FormikTextInput, MenuDropdown, MoreIcon, PlusCircleIcon, ShareAltIcon, SortDirection, standardDateFormat, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Typography, UploadIcon } from "@chainsafe/common-components"
import { useState } from "react"
import { useEffect } from "react"
import { useMemo } from "react"
import { useDrive } from "@chainsafe/common-contexts"
import { FileRequest } from "@chainsafe/common-contexts/dist/ImployApiContext/ImployApiClient"
import { Formik, Field } from "formik"
import { object, string,  } from "yup"

const useStyles = makeStyles(({
  constants
}: ITheme) =>{
    const gridSettings = "50px 69px 3fr 150px 100px 45px !important"
    return createStyles({
      root: {},
      header: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
      },
      controls:{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        "& > *": {
          marginLeft: constants.generalUnit
        }
      },
      divider: {
        margin: `${constants.generalUnit * 4.5}px 0`
      },
      tableRow: {
        gridTemplateColumns: gridSettings,
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
      renameInput: {
        
      }
    })
  }
)

const MOCKS = [
  {
    name:"Whitepapers",
    cid:"QmWPv9tYYmfER4G22o5i4F2tipqrxNd7gxxWGRniPpy5GE",
    content_type:"application/chainsafe-files-directory",
    date_uploaded: Date.now(),
    size: 0
  },
  {
    name:"Gitcoin Grants",
    cid:"QmWPv5tYYmfER4G22o5i4F2tipqrxNd7gxxWGRniPpy5GE",
    content_type:"application/chainsafe-files-directory",
    date_uploaded: Date.now(),
    size: 0
  },
  {
    name:"EthGlobal.txt",
    cid:"QmWPv9tYYmfER4G22o5i4F2tipqrxNd7gxxWGRniP0y5GE",
    content_type:"text/plain",
    date_uploaded: Date.now(),
    size: 3000000
  },
  {
    name:"Filecoin_spec.md",
    cid:"QmWPv9tYYmfER4G22o5i4F2tipqr1Nd7gxxWGRniPpy5GE",
    content_type:"text/plain",
    date_uploaded: Date.now(),
    size: 200100
  },
  {
    name:"Screenshot-09-11-20.png",
    cid:"QmWev9tYYmfER4G22o5i4F2tipqrxNd7gxxWGRniPpy5GE",
    content_type:"image/jpeg",
    date_uploaded: Date.now(),
    size: 1000000
  },
]

// TODO Replace with correct interface
interface IFile {
  name: string
  cid: string
  content_type: String
  date_uploaded: number
  size: number
}

export interface IFileBrowserProps {
  heading?: string
  // TODO: once pagination & unique content requests are present, this might change to a passed in function
  fileRequest: FileRequest
}

const FileBrowserModule: React.FC<IFileBrowserProps> = ({
  heading = "My Files",
  fileRequest = { path: "/" }
}: IFileBrowserProps) => {
  const classes = useStyles()
  const { list, deleteFile, downloadFile, renameFile, } = useDrive()

  const [files, setFiles] = useState<IFile[]>(MOCKS)
  const [editing, setEditing] = useState<string | undefined>()
  const [direction, setDirection] = useState<SortDirection>("ascend")
  const [column, setColumn] = useState<"name" | "size" | "date_uploaded">("name")
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const getFolderContents = async () => {
      try {
        const contents = await list(fileRequest)
        console.log(contents)
        // setFiles(contents as IFile[])
        setFiles(MOCKS)
      } catch (error) {
        console.log(error)
      }
    }
    getFolderContents()
  }, [direction, column, fileRequest, list])
 
  const sortFoldersFirst = (a: IFile, b: IFile) => a.content_type === "application/chainsafe-files-directory" && a.content_type !== b.content_type ? -1 : 1
  const items: IFile[] = useMemo(() => {
    switch(direction) {
      default: {
        // case "descend": {
        // case "name": {
        return files.sort((a: IFile, b: IFile) => a.name > b.name ? -1 : 1)
          .sort(sortFoldersFirst)
      }
      case "descend": {
        switch (column) {
          default: {
            // case "name": {
            return files.sort((a: IFile, b: IFile) => a.name > b.name ? -1 : 1)
              .sort(sortFoldersFirst)
          }
          case "size": {
            return files.sort((a: IFile, b: IFile) => a.size > b.size ? -1 : 1)
              .sort(sortFoldersFirst)
          }
          case "date_uploaded": {
            return files.sort((a: IFile, b: IFile) => a.date_uploaded > b.date_uploaded ? -1 : 1)
              .sort(sortFoldersFirst)
          }
        }
      }
      case "ascend": {
        switch (column) {
          default: {
            // case "name": {
            return files.sort((a: IFile, b: IFile) => a.name < b.name ? -1 : 1)
              .sort(sortFoldersFirst)
          }
          case "size": {
            return files.sort((a: IFile, b: IFile) => a.size < b.size ? -1 : 1)
              .sort(sortFoldersFirst)
          }
          case "date_uploaded": {
            return files.sort((a: IFile, b: IFile) => a.date_uploaded < b.date_uploaded ? -1 : 1)
              .sort(sortFoldersFirst)
          }
        }
      }
    }
  }, [files, direction, column])


  const handleSelect = (cid: string) => {
    if (selected.includes(cid)) {
      setSelected(selected.filter((selectedCid: string) => selectedCid !== cid))
    } else {
      setSelected([
        ...selected,
        cid
      ])
    }
  }

  const toggleAll = () => {
    if (selected.length === items.length) {
      setSelected([])
    } else {
      setSelected([
        ...items.map((file: IFile) => file.cid)
      ])
    }
  }

  const handleSortToggle = (targetColumn: "name" | "size" | "date_uploaded") => {
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

  const RenameSchema = object().shape({
    fileName: string()
      .min(1, 'Please enter a file name')
      .max(65, 'File name length exceeded')
      .required('File name is required'),
  })

  return (
    <article className={classes.root}>
      <header className={classes.header}>
        <Typography variant="h1" component="h1"> 
          {
            heading
          }
        </Typography>
        <div className={classes.controls}>
          <Button variant="outline">
            <PlusCircleIcon />
            New folder
          </Button>
          <Button variant="outline">
            <UploadIcon />
            Upload
          </Button>
        </div>
      </header>
      <Divider className={classes.divider} />
      <Table
        fullWidth={true}
        // dense={true}
        striped={true}
        hover={true}
      >
        <TableHead>
          <TableRow 
            type="grid"
            className={classes.tableRow}
          >
            <TableHeadCell>
              <CheckboxInput value={selected.length === items.length} onChange={() => toggleAll()} />
            </TableHeadCell>
            <TableHeadCell>
              {/* 
                Icon
              */}
            </TableHeadCell>
            <TableHeadCell
              sortButtons={true}
              align="left"
              onSortChange={() => handleSortToggle("name")}
              sortDirection={column === "name" ? direction : undefined}
            >
              Name
            </TableHeadCell>
            <TableHeadCell
              sortButtons={true}
              align="left"
              onSortChange={() => handleSortToggle("date_uploaded")}
              sortDirection={column === "date_uploaded" ? direction : undefined}
            >
              Date uploaded
            </TableHeadCell>
            <TableHeadCell
              sortButtons={true}
              align="left"
              onSortChange={() => handleSortToggle("size")}
              sortDirection={column === "size" ? direction : undefined}
            >
              Size
            </TableHeadCell>
            <TableHeadCell>
              {/* Menu */}
            </TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            items.map((file: IFile) => {
              let Icon
              if (file.content_type === "application/chainsafe-files-directory") {
                Icon = FolderSvg
              } else if (file.content_type.includes("image")){
                Icon = FileImageSvg
              } else if (file.content_type.includes("pdf")) {
                Icon = FilePdfSvg
              } else {
                Icon = FileTextSvg
              }
              return (
                <TableRow
                  className={classes.tableRow}
                  type="grid"
                  rowSelectable={true}
                  selected={selected.includes(file.cid)}
                >
                  <TableCell>
                    <CheckboxInput value={selected.includes(file.cid)} onChange={() => handleSelect(file.cid)} />
                  </TableCell>
                  <TableCell 
                    className={classes.fileIcon}
                  >
                    <Icon />  
                  </TableCell>
                  <TableCell
                    align="left"
                  >
                    {
                      editing !== file.cid ? file.name : (
                        <Formik 
                          initialValues={
                            {
                              fileName: file.name
                            }
                          }
                          validationSchema={RenameSchema}
                          onSubmit={(values, actions) => {
                            debugger
                          }}
                        >
                          <Fragment>
                            <Field 
                              className={classes.renameInput}
                              name="fileName"
                              placeholder="Please enter a file name"
                              component={FormikTextInput}
                            />
                          </Fragment>
                        </Formik>
                      )
                    }
                  </TableCell>
                  <TableCell
                    align="left"
                  >
                    {
                      standardDateFormat(new Date(file.date_uploaded))
                    }
                  </TableCell>
                  <TableCell
                    align="left"
                  >
                    {
                      file.size
                    }
                  </TableCell>
                  <TableCell
                    align="right"
                  >
                    <MenuDropdown 
                      menuItems={[
                        {
                          contents: <Fragment>
                            <ExportIcon />
                            <span>
                              Move
                            </span>
                          </Fragment>,
                          onClick: () => console.log
                        },
                        {
                          contents: <Fragment>
                            <ShareAltIcon />
                            <span>
                              Share
                            </span>
                          </Fragment>,
                          onClick: () => console.log
                        },
                        {
                          contents: <Fragment>
                            <EditIcon />
                            <span>
                              Rename
                            </span>
                          </Fragment>,
                          onClick: () => setEditing(file.cid)
                        },
                        {
                          contents: <Fragment>
                            <DeleteIcon />
                            <span>
                              Delete
                            </span>
                          </Fragment>,
                          onClick: () => deleteFile({
                            path: `${fileRequest.path}/${file.name}` 
                          })
                        },
                        {
                          contents: <Fragment>
                            <DownloadIcon/>
                            <span>
                              Download
                            </span>
                          </Fragment>,
                          onClick: () => downloadFile({
                            path: `${fileRequest.path}/${file.name}` 
                          })
                        },
                      ]}
                      indicator={MoreIcon}
                    />
                  </TableCell>
                </TableRow>
              )
            })
          }
        </TableBody>
      </Table>
    </article>
  )
}

export default FileBrowserModule


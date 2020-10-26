import React, { Fragment, ReactNode, useEffect } from "react"
import { useState } from "react"
import {
  createStyles,
  ITheme,
  makeStyles,
  useMediaQuery,
  useTheme,
} from "@imploy/common-themes"
import { IFile, useDrive } from "../../Contexts/DriveContext"
import MimeMatcher from "mime-matcher"
import {
  Button,
  Grid,
  ArrowLeftIcon,
  ArrowRightIcon,
  Typography,
  MenuDropdown,
  ExportIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  MoreIcon,
  ShareAltIcon,
  CloseCircleIcon,
} from "@imploy/common-components"
import ImagePreview from "./PreviewRenderers/ImagePreview"
import { useSwipeable } from "react-swipeable"
import PdfPreview from "./PreviewRenderers/PDFPreview"

export interface IPreviewRendererProps {
  contents: Blob
}

const SUPPORTED_FILE_TYPES: Record<string, React.FC<IPreviewRendererProps>> = {
  "application/pdf": PdfPreview,
  "image/*": ImagePreview,
  // "audio/*": <div>Audio Previews coming soon</div>,
  // "video/*": <div>Video Previews coming soon</div>,
  // "text/*": <div>Text Previews coming soon</div>,
}

const compatibleFilesMatcher = new MimeMatcher(
  ...Object.keys(SUPPORTED_FILE_TYPES),
)

const useStyles = makeStyles(
  ({ constants, palette, zIndex, breakpoints }: ITheme) =>
    createStyles({
      root: {
        height: "100%",
        width: "100%",
        position: "fixed",
        zIndex: 1,
        left: 0,
        top: 0,
        backgroundColor: "rgba(0,0,0, 0.88)",
        overflowX: "hidden",
      },
      previewModalControls: {
        position: "absolute",
        zIndex: zIndex?.layer1,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        left: 0,
        top: 0,
        width: "100%",
        maxWidth: breakpoints.values["sm"],
        height: constants.generalUnit * 8,
        backgroundColor: palette.additional["gray"][9],
        color: palette.additional["gray"][3],
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: palette.additional["gray"][8],
      },
      closePreviewButton: {
        marginRight: constants.generalUnit * 2,
        marginLeft: constants.generalUnit * 2,
        fill: palette.additional["gray"][2],
      },
      fileOperationsMenu: {
        fill: palette.additional["gray"][2],
      },
      fileName: {
        width: "100%",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
      menuIcon: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: 20,
        marginRight: constants.generalUnit * 1.5,
      },
      previewContainer: {
        height: "100%",
        alignItems: "center",
        textAlign: "center",
      },
      prevNext: {
        alignItems: "center",
      },
      prevNextButton: {
        backgroundColor: palette.common.black.main,
        padding: `${constants.generalUnit * 2}px !important`,
        borderRadius: constants.generalUnit * 4,
      },
      previewContent: {
        color: palette.additional["gray"][6],
        fill: palette.additional["gray"][6],
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      },
      downloadButton: {
        backgroundColor: "rgba(0,0,0, 0.88)",
        color: palette.additional["gray"][3],
        borderColor: palette.additional["gray"][3],
        borderWidth: 1,
        borderStyle: "solid",
      },
      swipeContainer: {
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
      },
    }),
)

const FilePreviewModal: React.FC<{
  file?: IFile
  nextFile?(): void
  previousFile?(): void
  closePreview(): void
}> = ({ file, nextFile, previousFile, closePreview }) => {
  const classes = useStyles()
  const { getFileContent, downloadFile } = useDrive()

  const { breakpoints }: ITheme = useTheme()
  const desktop = useMediaQuery(breakpoints.up("sm"))

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [fileContent, setFileContent] = useState<Blob | undefined>(undefined)
  const handlers = useSwipeable({
    onSwipedLeft: () => previousFile && !isLoading && previousFile(),
    onSwipedRight: () => nextFile && !isLoading && nextFile(),
    delta: 20,
  })
  useEffect(() => {
    const getContents = async () => {
      if (!file) return

      setIsLoading(true)
      setError(undefined)
      try {
        const content = await getFileContent(file.name)
        setFileContent(content)
      } catch (error) {
        setError("There was an error getting the preview.")
      }
      setIsLoading(false)
    }

    if (file && compatibleFilesMatcher.match(file?.content_type)) {
      getContents()
    }
  }, [file])

  const validRendererMimeType =
    file &&
    Object.keys(SUPPORTED_FILE_TYPES).find((type) => {
      const matcher = new MimeMatcher(type)

      return matcher.match(file.content_type)
    })

  const PreviewComponent =
    file &&
    file.content_type &&
    fileContent &&
    validRendererMimeType &&
    SUPPORTED_FILE_TYPES[validRendererMimeType]

  return !file ? null : (
    <div className={classes.root}>
      <div className={classes.previewModalControls}>
        <ArrowLeftIcon
          onClick={closePreview}
          className={classes.closePreviewButton}
        />
        <Typography
          variant={desktop ? "h4" : "h5"}
          component="h1"
          className={classes.fileName}
        >
          {file.name}
        </Typography>
        <MenuDropdown
          animation="none"
          anchor="top-right"
          className={classes.fileOperationsMenu}
          menuItems={[
            {
              contents: (
                <Fragment>
                  <ExportIcon className={classes.menuIcon} />
                  <span>Move</span>
                </Fragment>
              ),
              onClick: () => console.log,
            },
            {
              contents: (
                <Fragment>
                  <ShareAltIcon className={classes.menuIcon} />
                  <span>Share</span>
                </Fragment>
              ),
              onClick: () => console.log,
            },
            {
              contents: (
                <Fragment>
                  <EditIcon className={classes.menuIcon} />
                  <span>Rename</span>
                </Fragment>
              ),
              onClick: () => console.log,
            },
            {
              contents: (
                <Fragment>
                  <DeleteIcon className={classes.menuIcon} />
                  <span>Delete</span>
                </Fragment>
              ),
              onClick: () => console.log,
            },
            {
              contents: (
                <Fragment>
                  <DownloadIcon className={classes.menuIcon} />
                  <span>Download</span>
                </Fragment>
              ),
              onClick: () => downloadFile(file.name),
            },
          ]}
          indicator={MoreIcon}
        />
      </div>
      <Grid
        container
        flexDirection="row"
        alignItems="stretch"
        className={classes.previewContainer}
      >
        {desktop && (
          <Grid item sm={1} md={1} lg={1} xl={1} className={classes.prevNext}>
            {previousFile && (
              <Button onClick={previousFile} className={classes.prevNextButton}>
                <ArrowLeftIcon />
              </Button>
            )}
          </Grid>
        )}
        <Grid item xs={12} sm={10} md={10} lg={10} xl={10} alignItems="center">
          <div {...handlers} className={classes.swipeContainer}>
            {isLoading && <div>Loading</div>}
            {error && <div>{error}</div>}
            {!isLoading &&
              !error &&
              !compatibleFilesMatcher.match(file?.content_type) && (
                <div className={classes.previewContent}>
                  <CloseCircleIcon
                    fontSize={desktop ? "extraLarge" : "medium"}
                  />
                  <br />
                  <Typography variant="h1">
                    File format not supported.
                  </Typography>
                  <br />
                  <Button
                    className={classes.downloadButton}
                    onClick={() => downloadFile(file.name)}
                  >
                    Download
                  </Button>
                </div>
              )}
            {!isLoading &&
              !error &&
              compatibleFilesMatcher.match(file?.content_type) &&
              fileContent &&
              PreviewComponent && <PreviewComponent contents={fileContent} />}
          </div>
        </Grid>
        {desktop && (
          <Grid item sm={1} md={1} lg={1} xl={1} className={classes.prevNext}>
            {nextFile && (
              <Button onClick={nextFile} className={classes.prevNextButton}>
                <ArrowRightIcon />
              </Button>
            )}
          </Grid>
        )}
      </Grid>
    </div>
  )
}

export default FilePreviewModal

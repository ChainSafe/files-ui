import React, { ReactNode, useState } from "react"
import { Button, Divider, FileInput, FormikTextInput, SelectInput, TextInput, Typography } from "@chainsafe/common-components"
import { makeStyles, createStyles, useThemeSwitcher, ITheme } from "@chainsafe/common-theme"
import { t, Trans } from "@lingui/macro"
import { usePageTrack } from "../../Contexts/PosthogContext"
import { Helmet } from "react-helmet-async"
import { FieldArray, Form, FormikProvider, useFormik } from "formik"
import { useStorageApi } from "../../Contexts/StorageApiContext"
import FormikImageInput from "../Elements/FormikImageInput"

const useStyles = makeStyles(({ constants, breakpoints }: ITheme) =>
  createStyles({
    container: {
      marginTop: constants.generalUnit * 2
    },
    headerContainer: {
      marginBottom: constants.generalUnit * 4,
      [breakpoints.down("md")]: {
        padding: `0 ${constants.generalUnit * 2}px`,
        marginTop: constants.generalUnit * 4,
        marginBottom: constants.generalUnit * 2
      }
    },
    title: {
      marginTop: constants.generalUnit,
      [breakpoints.down("md")]: {
        fontSize: 20,
        lineHeight: "28px",
        margin: `${constants.generalUnit}px 0`
      }
    }
  })
)

const primitives = ["boolean", "string", "number"]

const generateFormFields = (obj: any,
  formikProps: {values: any; setValues: (vals: any) => void},
  namespace?: string): ReactNode | (ReactNode | undefined)[] => {
  if (!!namespace && primitives.includes(typeof obj)) {
    return <FormikTextInput
      name={namespace || ""}
      label={namespace}
      key={namespace} />
  }

  if (!!namespace && (obj === null || (typeof obj === "object" && (obj instanceof File || obj instanceof Blob)))) {
    return <FileInput
      name={namespace || ""}
      label={namespace || ""}
      onFileNumberChange={() => undefined}
      moreFilesLabel={""}
      maxFiles={1}
      key={namespace} />
  }

  if (typeof obj === "object") {
    // Map through each of the child properties and create fields to handle inputs for these
    return Object.keys(obj).map((key, index) => {
      // Primitive fields should be instantiated to an empty string
      if ((primitives.includes(typeof obj[key])) && obj[key] !== undefined)
        return <FormikTextInput
          key={index}
          name={`${namespace}.${key}`}
          label={key} />

      // File fields should be instantiated to null
      if (obj[key] === null || (typeof obj[key] === "object" && (obj[key] instanceof File || obj[key] instanceof Blob)))
        return <FileInput
          name={`${namespace}.${key}`}
          key={key}
          label={key}
          onFileNumberChange={() => undefined}
          moreFilesLabel={""}
          maxFiles={1} />

      // Handle arrays by recursively generating a FieldArray and 
      if (typeof obj[key] === "object" && Array.isArray(obj[key]))
        return <FieldArray
          name={`${namespace}.${key}`}
          key={key}>
          {({ push }) => <>
            <Typography>{key}</Typography>
            {obj[key].map((item: any, index: number) => generateFormFields(item, formikProps, `${namespace}.${key}[${index}]`))}
            <Button onClick={() => push("")}>Add Value</Button>
          </>
          }
        </FieldArray>

      if (typeof obj[key] === "object") {
        return <FieldArray
          name={`${namespace}.${key}`}
          key={key}>
          {() => {
            const [newFieldName, setNewFieldName] = useState("")
            const [newFieldType, setNewFieldType] = useState<"value" | "array" | "file" | "object">("value")

            return <>
              <Typography>{key}</Typography>
              {generateFormFields(obj[key], formikProps, `${namespace}.${key}`)}
              <Button onClick={() => {
                formikProps.setValues({
                  ...formikProps.values,
                  properties: {
                    ...formikProps.values.properties,
                    [newFieldName]: (newFieldType === "array")
                      ? []
                      : (newFieldType === "file")
                        ? null
                        : (newFieldType === "object")
                          ? {}
                          : ""
                  }
                })}}>Add Value</Button>
            </>}
          }
        </FieldArray>
      }

      return undefined
    })
  }
}

const CreateNFTPage: React.FC = () => {
  const { desktop } = useThemeSwitcher()
  const classes = useStyles()
  usePageTrack()

  const initialValues: { [key: string]: any } = {
    image: null,
    name: "",
    decimals: "",
    description: "",
    properties: {}
  }

  const formikProps = useFormik({
    initialValues: initialValues,
    // validationSchema={validationSchema}
    onSubmit: async (val) => {
      // const result = await storageApiClient.uploadNFT(val)
      console.log(val)
    },
    enableReinitialize: true
  })

  const { storageApiClient } = useStorageApi()



  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState<"value" | "array" | "file" | "object">("value")

  // const validationSchema = yup.object().shape({
  //   name: yup.string().required("Name is required"),
  //   decimals: yup.number().required("Decimals is required"),
  //   description: yup.string(),
  //   image: yup.object().nullable().required("Image is required")
  // })

  // const addField = (name: string, type: "value" |"object"|"array"|"file", parent?: string) => {
  //   switch (type) {
  //     case "array":
  //       initialValues = {...initialValues, }
  //       break
  //     case "file":
  //       break
  //     case "object":
  //       break
  //     case "value":
  //       break
  //     default:
  //       break
  //   }
  // }

  return (
    <div className={classes.container}>
      <Helmet>
        <title>{t`Upload NFT`} - Chainsafe Storage</title>
      </Helmet>
      <div className={classes.headerContainer}>
        <Typography
          variant="h1"
          component="p"
          className={classes.title}
        >
          <Trans>Upload NFT</Trans>
        </Typography>
      </div>
      {desktop && <Divider />}
      <FormikProvider value={formikProps}>
        <Form>
          <FormikTextInput name='name' />
          <FormikTextInput name='description' />
          <FormikTextInput name='decimals' />
          <FormikImageInput name='image' />
          {generateFormFields(formikProps.values.properties, formikProps, "properties")}
          <Button type="submit">Upload</Button>
        </Form>
      </FormikProvider>
      <TextInput
        value={newFieldName}
        onChange={(val) => setNewFieldName(val?.toString() || "")} />
      <SelectInput
        options={[{
          label: "Value", // Use better description here
          value: "value"
        }, {
          label: "Object", // Use better description here
          value: "object"
        }, {
          label: "Array",
          value: "array"
        }, {
          label: "File",
          value: "file"
        }]}
        onChange={setNewFieldType}
        value={newFieldType} />
      <Button onClick={
        () => {
          console.log("adding new field to properties root")
          formikProps.setFieldValue(`properties.${newFieldName}`, (newFieldType === "array")
            ? []
            : (newFieldType === "file")
              ? null
              : (newFieldType === "object")
                ? {}
                : "")
        }
      }>
          Add
      </Button>
    </div>
  )
}

export default CreateNFTPage

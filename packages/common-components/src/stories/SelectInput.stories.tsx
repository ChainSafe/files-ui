import React, { useState } from "react"
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs"
import { action } from "@storybook/addon-actions"
import { Formik, Form } from "formik"
import { Button } from "../Button"
import { SelectInput, FormikSelectInput } from "../SelectInput"
import { BulbIcon } from "../Icons"
import { Typography } from "../Typography"

export default {
  title: "Select Input",
  component: SelectInput,
  excludeStories: /.*Data$/,
  decorators: [withKnobs]
}

const sizeOptions: Array<"large" | "medium" | "small"> = [
  "large",
  "medium",
  "small"
]

export const actionsData = {
  onChange: action("onChange"),
  onFormSubmit: action("Submit Form")
}

export const SelectInputStory = (): React.ReactNode => {
  const [value, setValue] = useState(["a", "b"])

  return (
    <SelectInput
      onChange={(value: any) => {
        actionsData.onChange(value)
        setValue(value)
      }}
      size={select("Size", sizeOptions, "large")}
      isMulti={boolean("Multi", false)}
      isClearable={boolean("Clearable", false)}
      disabled={boolean("Disabled", false)}
      label={text("Label", "Testing Label")}
      value={value}
      options={[
        {
          label: (
            <>
              <BulbIcon fontSize="small" />{" "}
              <Typography>Custom markup</Typography>
            </>
          ),
          value: "4"
        },
        { label: "a", value: "a" },
        { label: "b", value: "b" },
        { label: "c", value: "c" }
      ]}
    />
  )
}

export const SelectInputMultiOptionsStory = (): React.ReactNode => {
  const [value, setValue] = useState(["a"])

  return (
    <SelectInput
      onChange={(value: any) => {
        actionsData.onChange(value)
        setValue(value)
      }}
      defaultIsOpen={true}
      size={select("Size", sizeOptions, "large")}
      isMulti={boolean("Multi", false)}
      isClearable={boolean("Clearable", false)}
      disabled={boolean("Disabled", false)}
      label={text("Label", "Testing Label")}
      value={value}
      menuMaxHeight={180}
      options={[
        { label: "a", value: "a" },
        { label: "b", value: "b" },
        { label: "c", value: "c" },
        { label: "d", value: "d" },
        { label: "e", value: "e" },
        { label: "f", value: "f" },
        { label: "g", value: "g" },
        { label: "h", value: "h" },
        { label: "i", value: "i" },
        { label: "j", value: "j" },
        { label: "k", value: "k" },
        { label: "l", value: "l" }
      ]}
    />
  )
}

export const FormikStory = (): React.ReactNode => {
  return (
    <Formik
      initialValues={{
        select: "4"
      }}
      onSubmit={(values: any) => actionsData.onFormSubmit(values)}
    >
      <Form>
        <FormikSelectInput
          name="select"
          options={[
            {
              label: (
                <>
                  <BulbIcon fontSize="small" />{" "}
                  <Typography>Custom markup</Typography>
                </>
              ),
              value: "4"
            },
            { label: "b", value: "b" },
            { label: "c", value: "c" }
          ]}
          isMulti={boolean("Multi", false)}
          isClearable={boolean("Clearable", false)}
        />
        <br />
        <br />
        <Button type="submit">Submit</Button>
      </Form>
    </Formik>
  )
}

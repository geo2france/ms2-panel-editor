import React from "react";
import TextAreaControl from "./TextAreaControl";
import NumberInputControl from "./NumberInputControl";
import DateInputControl from "./DateInputControl";
import SelectInputControl from "./SelectInputControl";
import TextInputControl from "./TextInputControl";

/**
 * Renders the proper form control according to the field type.
 * @param {object} options Render options.
 * @param {string} options.type Field type.
 * @param {*} options.value Current field value.
 * @param {Function} options.onChange Change handler.
 * @param {Array} [options.options=[]] Select options for list fields.
 * @param {boolean} [options.disabled=false] Whether the control is read-only in the UI.
 * @returns {React.ReactElement} Input component matching the requested type.
 */
const renderInputByType = ({ type, value, onChange, options = [], disabled = false }) => {
    switch (type) {
    case "textarea":
        return <TextAreaControl value={value} onChange={onChange} disabled={disabled} />;
    case "number":
        return <NumberInputControl value={value} onChange={onChange} disabled={disabled} />;
    case "date":
        // Disabled date fields use text input to keep the raw feature value visible
        // and avoid opening the native calendar picker.
        return disabled
            ? <TextInputControl value={value} onChange={onChange} disabled />
            : <DateInputControl value={value} onChange={onChange} disabled={disabled} />;
    case "list":
        return (
            <SelectInputControl
                value={value}
                options={options}
                includeEmptyOption
                disabled={disabled}
                onChange={onChange}
            />
        );
    default:
        return <TextInputControl value={value} onChange={onChange} disabled={disabled} />;
    }
};

export default renderInputByType;

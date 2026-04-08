import React from "react";
import PropTypes from "prop-types";
import { FormControl } from "react-bootstrap";
import "../css/panelEditor.css";

/**
 * Normalizes primitive options into `{ value, label }` pairs.
 * @param {string|number|object} option Raw option value.
 * @returns {{value: *, label: *}} Normalized option object.
 */
const normalizeOption = (option) => {
    if (option && typeof option === "object") {
        return option;
    }
    return { value: option, label: option };
};

/**
 * Select input used for list-based attribute editing.
 * @param {object} props Input props.
 * @returns {React.ReactElement} Select form control.
 */
const SelectInputControl = ({ value, options, includeEmptyOption, onChange, disabled }) => (
    <FormControl
        componentClass="select"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
    >
        {includeEmptyOption ? <option value="" /> : null}
        {(Array.isArray(options) ? options : []).map((option) => {
            const normalizedOption = normalizeOption(option);
            return (
                <option className="panel-editor-header-option" key={normalizedOption.value} value={normalizedOption.value}>
                    {normalizedOption.label}
                </option>
            );
        })}
    </FormControl>
);

SelectInputControl.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    options: PropTypes.array,
    includeEmptyOption: PropTypes.bool,
    onChange: PropTypes.func,
    disabled: PropTypes.bool
};

SelectInputControl.defaultProps = {
    value: "",
    options: [],
    includeEmptyOption: false,
    onChange: () => {},
    disabled: false
};

export default SelectInputControl;

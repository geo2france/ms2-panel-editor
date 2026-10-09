import React from "react";
import PropTypes from "prop-types";
import { FormControl } from "react-bootstrap";

/**
 * Multiline input used for long text attributes.
 * @param {object} props Input props.
 * @returns {React.ReactElement} Textarea form control.
 */
const TextAreaControl = ({ value, onChange, disabled }) => (
    <FormControl
        componentClass="textarea"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
    />
);

TextAreaControl.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool
};

TextAreaControl.defaultProps = {
    value: "",
    onChange: () => {},
    disabled: false
};

export default TextAreaControl;

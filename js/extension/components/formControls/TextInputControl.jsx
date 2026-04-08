import React from "react";
import PropTypes from "prop-types";
import { FormControl } from "react-bootstrap";

/**
 * Default single-line text input used for string attributes.
 * @param {object} props Input props.
 * @returns {React.ReactElement} Text form control.
 */
const TextInputControl = ({ value, onChange, disabled }) => (
    <FormControl
        type="text"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
    />
);

TextInputControl.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    disabled: PropTypes.bool
};

TextInputControl.defaultProps = {
    value: "",
    onChange: () => {},
    disabled: false
};

export default TextInputControl;

import React from "react";
import PropTypes from "prop-types";
import { FormControl } from "react-bootstrap";

/**
 * Number input used for numeric attribute editing.
 * @param {object} props Input props.
 * @returns {React.ReactElement} Number form control.
 */
const NumberInputControl = ({ value, onChange, disabled }) => (
    <FormControl
        type="number"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
    />
);

NumberInputControl.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    disabled: PropTypes.bool
};

NumberInputControl.defaultProps = {
    value: "",
    onChange: () => {},
    disabled: false
};

export default NumberInputControl;
